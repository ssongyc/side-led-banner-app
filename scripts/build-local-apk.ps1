param([Parameter(Mandatory=$true)][string]$BuildRoot, [switch]$ResumeNative)
$ErrorActionPreference='Stop'
$resolved=[IO.Path]::GetFullPath($BuildRoot).TrimEnd('\')
$allowedRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../artifacts/local-builds')).TrimEnd('\')+'\'
if(-not $resolved.StartsWith($allowedRoot,[StringComparison]::OrdinalIgnoreCase)){throw 'Unexpected isolated build root'}
if(Test-Path -LiteralPath (Join-Path $resolved '.relocated-build')){throw 'Relocated native caches cannot be resumed. Prepare a fresh source snapshot under artifacts/local-builds.'}
$signing='C:/AndroidSigning/com.minkyokim.sideledbannerapp'
$cred=Get-Content (Join-Path $signing 'credentials.json') -Raw | ConvertFrom-Json
$key=$cred.android.keystore
if($key.keystorePath -ne 'C:/AndroidSigning/com.minkyokim.sideledbannerapp/upload-key.jks' -or $key.keyAlias -ne '88995a0e2459ad11a9ee33f8f161d791'){throw 'Signing identity configuration mismatch'}
$expected='730173560958735BF237CA84BA4F35BBE76A6734986929EB65F6CED63D3FD893'
$env:LEDPOP_STORE_PASSWORD=$key.keystorePassword
$env:LEDPOP_KEY_PASSWORD=$key.keyPassword
$env:LEDPOP_KEY_ALIAS=$key.keyAlias
$env:LEDPOP_KEYSTORE=$key.keystorePath
$env:JAVA_HOME='C:/Program Files/Android/Android Studio/jbr'
$env:ANDROID_HOME='C:/Users/ssong/AppData/Local/Android/Sdk'
$env:CI='1'
try {
 $check=& "$env:JAVA_HOME/bin/keytool.exe" -list -v -keystore $key.keystorePath -alias $key.keyAlias -storepass:env LEDPOP_STORE_PASSWORD 2>&1
 if($LASTEXITCODE -ne 0 -or (($check -join '') -replace ':','') -notmatch $expected){throw 'Keystore fingerprint verification failed'}
 $cert=[Security.Cryptography.X509Certificates.X509Certificate2]::CreateFromPem([IO.File]::ReadAllText((Join-Path $signing 'upload_certificate.pem')))
 if($cert.GetCertHashString([Security.Cryptography.HashAlgorithmName]::SHA256) -ne $expected){throw 'Public certificate mismatch'}
 Push-Location $resolved
 try {
  if((Test-Path android) -and -not $ResumeNative){throw 'Native output already exists; refusing regeneration'}
  if(-not $ResumeNative){
  & npx expo prebuild --platform android --no-clean --no-install > prebuild.log 2>&1
  if($LASTEXITCODE -ne 0){throw 'Prebuild failed; inspect prebuild.log'}
  }
  $gradle=Get-Content android/app/build.gradle -Raw
  $pattern='(?s)(release\s*\{.*?signingConfig\s*(?:=\s*)?)signingConfigs\.(?:debug|localVerified)'
  if([regex]::Matches($gradle,$pattern).Count -ne 1){throw 'Unexpected release signing template'}
  $gradle=[regex]::Replace($gradle,$pattern,'${1}signingConfigs.localVerified')
  $marker='    signingConfigs {'
  if(-not $gradle.Contains($marker)){throw 'Signing configuration section absent'}
  $block=@"
    signingConfigs {
        localVerified {
            storeFile file(System.getenv('LEDPOP_KEYSTORE'))
            storePassword System.getenv('LEDPOP_STORE_PASSWORD')
            keyAlias System.getenv('LEDPOP_KEY_ALIAS')
            keyPassword System.getenv('LEDPOP_KEY_PASSWORD')
        }
"@
  if(-not $gradle.Contains('localVerified {')){$gradle=$gradle.Replace($marker,$block)}
  [IO.File]::WriteAllText((Join-Path $resolved 'android/app/build.gradle'),$gradle)
  [IO.File]::WriteAllText((Join-Path $resolved 'android/local.properties'),'sdk.dir=C:/Users/ssong/AppData/Local/Android/Sdk'+[Environment]::NewLine)
  & ./android/gradlew.bat -p android :app:assembleRelease --no-daemon --max-workers=2 > gradle-release.log 2>&1
  if($LASTEXITCODE -ne 0){throw 'Gradle build failed; inspect gradle-release.log'}
  Write-Output 'Gradle assembleRelease completed; independent APK verification still required.'
 } finally { Pop-Location }
} finally {
 foreach($name in @('LEDPOP_STORE_PASSWORD','LEDPOP_KEY_PASSWORD','LEDPOP_KEY_ALIAS','LEDPOP_KEYSTORE')){Remove-Item "Env:$name" -ErrorAction SilentlyContinue}
}
