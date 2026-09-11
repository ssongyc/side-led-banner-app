param(
    [Parameter(Mandatory=$true)][string]$Aab,
    [Parameter(Mandatory=$true)][string]$OutputApk,
    [Parameter(Mandatory=$true)][string]$BundletoolJar,
    [Parameter(Mandatory=$true)][string]$Keystore,
    [Parameter(Mandatory=$true)][string]$KeyAlias,
    [Parameter(Mandatory=$true)][string]$LogPath,
    [ValidateRange(1,8)][int]$MaxThreads=2
)
$ErrorActionPreference='Stop'
foreach($path in @($Aab,$BundletoolJar,$Keystore)){
    if(-not (Test-Path -LiteralPath $path -PathType Leaf)){throw "Required file is missing: $path"}
}
if([string]::IsNullOrEmpty($env:LEDPOP_STORE_PASSWORD) -or [string]::IsNullOrEmpty($env:LEDPOP_KEY_PASSWORD)){
    throw 'Signing passwords are not available in the approved environment variables'
}
$resolvedOutput=[IO.Path]::GetFullPath($OutputApk)
$outputDirectory=Split-Path $resolvedOutput -Parent
New-Item -ItemType Directory -Force -Path $outputDirectory|Out-Null
$archive=[IO.Path]::ChangeExtension($resolvedOutput,'.apks')
if(Test-Path -LiteralPath $archive){Remove-Item -LiteralPath $archive}
if(Test-Path -LiteralPath $resolvedOutput){Remove-Item -LiteralPath $resolvedOutput}
$signingRoot=Split-Path ([IO.Path]::GetFullPath($Keystore)) -Parent
$passwordDirectory=Join-Path $signingRoot ('.bundletool-'+[Guid]::NewGuid().ToString('N'))
$storePasswordFile=Join-Path $passwordDirectory 'store.pass'
$keyPasswordFile=Join-Path $passwordDirectory 'key.pass'
try {
    New-Item -ItemType Directory -Path $passwordDirectory|Out-Null
    $acl=Get-Acl -LiteralPath $passwordDirectory
    $acl.SetAccessRuleProtection($true,$false)
    $identity=[Security.Principal.WindowsIdentity]::GetCurrent().User
    $rule=[Security.AccessControl.FileSystemAccessRule]::new($identity,'FullControl','ContainerInherit,ObjectInherit','None','Allow')
    $acl.SetAccessRule($rule)
    Set-Acl -LiteralPath $passwordDirectory -AclObject $acl
    $utf8=[Text.UTF8Encoding]::new($false)
    [IO.File]::WriteAllText($storePasswordFile,$env:LEDPOP_STORE_PASSWORD+[Environment]::NewLine,$utf8)
    [IO.File]::WriteAllText($keyPasswordFile,$env:LEDPOP_KEY_PASSWORD+[Environment]::NewLine,$utf8)
    $arguments=@(
        '-jar',$BundletoolJar,'build-apks',
        "--bundle=$Aab","--output=$archive",'--mode=universal',
        "--ks=$Keystore","--ks-key-alias=$KeyAlias",
        "--ks-pass=file:$storePasswordFile","--key-pass=file:$keyPasswordFile",
        "--max-threads=$MaxThreads"
    )
    & "$env:JAVA_HOME/bin/java.exe" @arguments > $LogPath 2>&1
    if($LASTEXITCODE -ne 0){throw 'bundletool build-apks failed; inspect the retained bundletool log'}
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip=[IO.Compression.ZipFile]::OpenRead($archive)
    try {
        $entries=@($zip.Entries|Where-Object FullName -eq 'universal.apk')
        if($entries.Count -ne 1 -or $entries[0].Length -eq 0){throw 'bundletool did not produce exactly one nonempty universal APK'}
        $input=$entries[0].Open()
        $output=[IO.File]::Open($resolvedOutput,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
        try {$input.CopyTo($output)} finally {$input.Dispose();$output.Dispose()}
    } finally {$zip.Dispose()}
    Remove-Item -LiteralPath $archive
} finally {
    foreach($file in @($storePasswordFile,$keyPasswordFile)){
        if(Test-Path -LiteralPath $file){Remove-Item -LiteralPath $file}
    }
    if(Test-Path -LiteralPath $passwordDirectory){Remove-Item -LiteralPath $passwordDirectory}
}
if(-not (Test-Path -LiteralPath $resolvedOutput -PathType Leaf) -or (Get-Item -LiteralPath $resolvedOutput).Length -eq 0){
    throw 'Derived universal APK is missing or empty'
}
