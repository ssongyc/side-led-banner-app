param(
    [Parameter(Mandatory=$true)][string]$Apk,
    [Parameter(Mandatory=$true)][string]$AppName,
    [Parameter(Mandatory=$true)][string]$OutputDirectory,
    [string]$SdkRoot = $env:ANDROID_HOME
)
$ErrorActionPreference = 'Stop'
$sourceApk = (Resolve-Path -LiteralPath $Apk -ErrorAction Stop).Path
$sdk = $SdkRoot
if ([string]::IsNullOrWhiteSpace($sdk)) { throw 'ANDROID_HOME is required to read the built APK version.' }
$tools = @(Get-ChildItem -LiteralPath (Join-Path $sdk 'build-tools') -Directory |
    Where-Object { $_.Name -match '^\d+\.\d+\.\d+$' -and (Test-Path -LiteralPath (Join-Path $_.FullName 'aapt.exe')) } |
    Sort-Object { [version]$_.Name } -Descending)
if ($tools.Count -eq 0) { throw 'Android SDK aapt.exe is required for APK naming.' }
$badging = & (Join-Path $tools[0].FullName 'aapt.exe') dump badging $sourceApk 2>&1
if ($LASTEXITCODE -ne 0) { throw 'Could not read the built APK version.' }
$identity = [regex]::Match(($badging -join "`n"), "(?m)^package: name='([^']+)' versionCode='(\d+)' versionName='([^']+)'")
if (-not $identity.Success -or $identity.Groups[3].Value -notmatch '^\d+(\.\d+)*$') { throw 'APK versionName must contain only digits and periods.' }
$name = $AppName -replace '\s', ''
if ($name -notmatch '^[A-Za-z0-9]+$') { throw 'AppName must be an established alphanumeric filename name.' }
$filename = $name + 'V' + $identity.Groups[3].Value.Replace('.', '') + '.apk'
$run = (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [guid]::NewGuid().ToString('N')
$directory = Join-Path ([IO.Path]::GetFullPath($OutputDirectory)) ('apk-deliveries/' + $run)
New-Item -ItemType Directory -Path $directory -ErrorAction Stop | Out-Null
# Only allocate the path; the caller retains its existing copy/verification flow.
Join-Path $directory $filename
