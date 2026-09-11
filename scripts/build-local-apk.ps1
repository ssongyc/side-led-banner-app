param(
 [string]$BuildRoot=(Join-Path $PSScriptRoot '../artifacts/b'),
 [switch]$ResumeNative,
 [switch]$IncludeBundle,
 [ValidateSet("production", "test")][string]$AdProfile="production",
 [Nullable[int]]$VersionCode,
 [string]$BundletoolJar=(Join-Path $PSScriptRoot '../artifacts/bundletool-all-1.18.3.jar'),
 [string]$PythonExecutable="python",
 [switch]$MeasureBuild,
 [switch]$ConfigurationCache,
 [switch]$ReuseDaemon,
 [ValidateSet(1, 2)][int]$GradleWorkers=1
)
$ErrorActionPreference='Stop'
if($IncludeBundle -and $AdProfile -ne 'production'){throw 'Store AAB requires production ads'}
$verificationScript=Join-Path $PSScriptRoot 'verify-store-release.py'
if($IncludeBundle){
 if(-not (Test-Path -LiteralPath $verificationScript -PathType Leaf)){throw 'Store verifier is missing'}
 $PythonExecutable=(Get-Command $PythonExecutable -CommandType Application -ErrorAction Stop).Source
 & $PythonExecutable -c "import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)"
 if($LASTEXITCODE -ne 0){throw 'Store verification requires Python 3.11 or newer'}
 foreach($tool in @('apksigner.bat','aapt.exe','zipalign.exe')){
  if(-not (Test-Path -LiteralPath (Join-Path 'C:/Users/ssong/AppData/Local/Android/Sdk/build-tools/36.1.0' $tool))){throw ('Store verification tool missing: '+$tool)}
 }
}
if($env:EXPO_PUBLIC_WEB_AD_DIAGNOSTICS -eq '1'){throw 'Web diagnostics cannot be included in native builds'}

$resolved=[IO.Path]::GetFullPath($BuildRoot).TrimEnd('\')
$shortRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../artifacts/b')).TrimEnd('\')
if($resolved -ne $shortRoot){throw 'Use the fixed artifacts/b build root'}
foreach($path in @((Split-Path $resolved -Parent),$resolved)){
 if((Test-Path -LiteralPath $path) -and ((Get-Item -LiteralPath $path).Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Build paths must not be links'}
}
if(Test-Path -LiteralPath (Join-Path $resolved '.relocated-build')){throw 'Relocated native caches cannot be resumed'}
$prepare=Join-Path $PSScriptRoot 'prepare-local-apk.cjs'
$buildLock=$null
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
 $previousAdProfile=$env:LEDPOP_AD_PROFILE
 $env:LEDPOP_AD_PROFILE=$AdProfile
 $bundletoolVersion=$null
 if($IncludeBundle){
  $BundletoolJar=[IO.Path]::GetFullPath($BundletoolJar)
  if(-not (Test-Path -LiteralPath $BundletoolJar -PathType Leaf)){throw 'Pinned bundletool jar is missing'}
  $bundletoolVersion=((& "$env:JAVA_HOME/bin/java.exe" -jar $BundletoolJar version 2>&1)-join [Environment]::NewLine).Trim()
  if($LASTEXITCODE -ne 0 -or $bundletoolVersion -ne '1.18.3'){throw 'Pinned bundletool version verification failed'}
 }
 $previousErrorActionPreference=$ErrorActionPreference
 try {
  # keytool may emit a successful JKS notice on stderr; validate its exit code and fingerprint explicitly.
  $ErrorActionPreference='Continue'
  $check=& "$env:JAVA_HOME/bin/keytool.exe" -list -v -keystore $key.keystorePath -alias $key.keyAlias -storepass:env LEDPOP_STORE_PASSWORD 2>&1
 } finally {
  $ErrorActionPreference=$previousErrorActionPreference
 }
 if($LASTEXITCODE -ne 0 -or (($check -join '') -replace ':','') -notmatch $expected){throw 'Keystore fingerprint verification failed'}
 $cert=[Security.Cryptography.X509Certificates.X509Certificate2]::CreateFromPem([IO.File]::ReadAllText((Join-Path $signing 'upload_certificate.pem')))
 if($cert.GetCertHashString([Security.Cryptography.HashAlgorithmName]::SHA256) -ne $expected){throw 'Public certificate mismatch'}
 New-Item -ItemType Directory -Force -Path $resolved | Out-Null
 $buildLock=[IO.File]::Open((Join-Path $resolved '.build.lock'),[IO.FileMode]::OpenOrCreate,[IO.FileAccess]::ReadWrite,[IO.FileShare]::None)
 $runId=(Get-Date -Format 'yyyyMMdd-HHmmss')+'-'+[Guid]::NewGuid().ToString('N').Substring(0,8)
 $record=Join-Path (Split-Path $resolved -Parent) ('apk-runs/'+$runId)
 New-Item -ItemType Directory -Path $record | Out-Null
 # Preserve previous output before preparation, installation or generation can replace it.
 foreach($name in @('gradle-release.log','prebuild.log','npm-ci.log','source-inputs.json','source-revision.txt')){
  $old=Join-Path $resolved $name
  if(Test-Path -LiteralPath $old){Copy-Item -LiteralPath $old -Destination (Join-Path $record ('previous-'+$name))}
 }
 foreach($item in @(
  @{Source='android/app/build/outputs/bundle/release/app-release.aab'; Name='previous.aab'},
  @{Source='android/app/build/outputs/mapping/release/mapping.txt'; Name='previous-mapping.txt'},
  @{Source='android/app/build/outputs/bundle/release/app-release-universal.apk'; Name='previous-universal.apk'}
 )){
  $previous=Join-Path $resolved $item.Source
  if(Test-Path -LiteralPath $previous){Copy-Item -LiteralPath $previous -Destination (Join-Path $record $item.Name)}
 }
 $previousApk=Join-Path $resolved 'android/app/build/outputs/apk/release/app-release.apk'
 if(Test-Path -LiteralPath $previousApk){Copy-Item -LiteralPath $previousApk -Destination (Join-Path $record 'previous.apk')}
 & node $prepare prepare "$VersionCode"
 if($LASTEXITCODE -ne 0){throw 'Source preparation failed'}
 $plan=Get-Content (Join-Path $resolved '.source-plan.json') -Raw | ConvertFrom-Json
 if($ResumeNative -and ($plan.nativeRequired -or $plan.installRequired)){throw 'ResumeNative requested but inputs changed; rerun without ResumeNative'}
 Push-Location $resolved
 try {
  if($plan.installRequired -or $plan.nativeRequired){
   & node $prepare native-start
   if($LASTEXITCODE -ne 0){throw 'Native preparation state update failed'}
  }
  if($plan.installRequired){
   & node $prepare install-start
   if($LASTEXITCODE -ne 0){throw 'Installation state update failed'}
   & npm ci > npm-ci.log 2>&1
   if($LASTEXITCODE -ne 0){throw 'Dependency installation failed; inspect npm-ci.log'}
   & node $prepare installed
   if($LASTEXITCODE -ne 0){throw 'Dependency state recording failed'}
  }
  if($plan.nativeRequired -or $plan.installRequired){
   $archive=$null
   $native=Join-Path $resolved 'android'
   if(Test-Path -LiteralPath $native){
    if((Get-Item -LiteralPath $native).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Native directory must not be a link'}
    $archiveRoot=Join-Path (Split-Path $shortRoot -Parent) 'native-archives'
    if((Test-Path -LiteralPath $archiveRoot) -and ((Get-Item -LiteralPath $archiveRoot).Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Archive root must not be a link'}
    New-Item -ItemType Directory -Force -Path $archiveRoot | Out-Null
    $archive=Join-Path $archiveRoot $runId
    if([IO.Path]::GetFullPath($native) -ne (Join-Path $shortRoot 'android') -or (Split-Path ([IO.Path]::GetFullPath($archive)) -Parent) -ne $archiveRoot){throw 'Unexpected native archive path'}
    Move-Item -LiteralPath $native -Destination $archive
   }
   & npx --no-install expo prebuild --platform android --no-clean --no-install > prebuild.log 2>&1
   if($LASTEXITCODE -ne 0){throw 'Prebuild failed; previous native output is archived, not resumed'}
   # Reuse only generated app build caches at the same fixed absolute path.
   # Never restore app/src, manifests or Gradle configuration from the archive.
   if($null -ne $archive){
    foreach($relative in @('app/build','app/.cxx')){
     $cached=Join-Path $archive $relative
     $destination=Join-Path $native $relative
     if(Test-Path -LiteralPath $cached){
      if((Get-Item -LiteralPath $cached).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Native cache must not be a link'}
      if(Test-Path -LiteralPath $destination){throw 'Fresh native project unexpectedly contains build cache'}
      if([IO.Path]::GetFullPath($cached) -ne (Join-Path $archive $relative) -or [IO.Path]::GetFullPath($destination) -ne (Join-Path $native $relative)){throw 'Unexpected generated cache path'}
      Move-Item -LiteralPath $cached -Destination $destination
     }
    }
   }
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
  # Bound Ninja independently of Gradle workers to avoid Windows commit-limit exhaustion.
  if(-not $gradle.Contains('// LED POP local CMake jobs')){
   $gradle += @"

// LED POP local CMake jobs
android {
    defaultConfig {
        externalNativeBuild {
            cmake {
                arguments '-DCMAKE_JOB_POOLS=ledpop_compile=1;ledpop_link=1', '-DCMAKE_JOB_POOL_COMPILE=ledpop_compile', '-DCMAKE_JOB_POOL_LINK=ledpop_link'
            }
        }
    }
}
"@
  }
  $appConfig=Get-Content app.json -Raw|ConvertFrom-Json
  $buildVersionName=[string]$appConfig.expo.version
  $buildVersionCode=[int]$plan.versionCode
  if($buildVersionName -notmatch '^\d+(?:\.\d+)*$' -or $buildVersionCode -lt 1){throw 'Invalid Android release version'}
  $versionCodePattern='(?m)^(\s*)versionCode\s+\d+\s*$'
  $versionNamePattern='(?m)^(\s*)versionName\s+"[^"]*"\s*$'
  if([regex]::Matches($gradle,$versionCodePattern).Count -ne 1 -or [regex]::Matches($gradle,$versionNamePattern).Count -ne 1){throw 'Unexpected generated Android version fields'}
  $gradle=[regex]::Replace($gradle,$versionCodePattern,[Text.RegularExpressions.MatchEvaluator]{param($match) $match.Groups[1].Value+'versionCode '+$buildVersionCode},1)
  $gradle=[regex]::Replace($gradle,$versionNamePattern,[Text.RegularExpressions.MatchEvaluator]{param($match) $match.Groups[1].Value+'versionName "'+$buildVersionName+'"'},1)
  $gradlePath=Join-Path $resolved 'android/app/build.gradle'
  if([IO.File]::ReadAllText($gradlePath) -cne $gradle){[IO.File]::WriteAllText($gradlePath,$gradle)}
  $propertiesPath=Join-Path $resolved 'android/local.properties'
  $sdkProperty='sdk.dir=C:/Users/ssong/AppData/Local/Android/Sdk'+[Environment]::NewLine
  if(-not (Test-Path -LiteralPath $propertiesPath) -or [IO.File]::ReadAllText($propertiesPath) -cne $sdkProperty){[IO.File]::WriteAllText($propertiesPath,$sdkProperty)}
  & node $prepare native-ready
  if($LASTEXITCODE -ne 0){throw 'Native state recording failed'}
  Copy-Item -LiteralPath (Join-Path $resolved 'source-inputs.json') -Destination $record
  $started=Get-Date
  $tasks=if($IncludeBundle){@(':app:bundleRelease')}else{@(':app:assembleRelease')}
  $daemonArgument=if($ReuseDaemon){'--daemon'}else{'--no-daemon'}
  $cacheArgument=if($ConfigurationCache){'--configuration-cache'}else{'--no-configuration-cache'}
  $gradleArguments=@('-p','android')+$tasks+@('--build-cache',$daemonArgument,$cacheArgument,('--max-workers='+$GradleWorkers),'-Dorg.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=1024m','--stacktrace')
  if($ConfigurationCache){$gradleArguments+='--configuration-cache-problems=fail'}
  # Record the selected settings before execution, including failed compatibility trials.
  @{ configurationCache=[bool]$ConfigurationCache; reuseDaemon=[bool]$ReuseDaemon; gradleWorkers=$GradleWorkers; appCmakeCompilePool=1; appCmakeLinkPool=1; measureBuild=[bool]$MeasureBuild; arguments=$gradleArguments } | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath (Join-Path $record 'build-options.json')
  if($MeasureBuild){$gradleArguments+=@('--profile','--info')}
  & ./android/gradlew.bat @gradleArguments > gradle-release.log 2>&1
  $buildExit=$LASTEXITCODE
  Copy-Item -LiteralPath (Join-Path $resolved 'gradle-release.log') -Destination $record
  if($MeasureBuild){
   $profileDirectory=Join-Path $resolved 'android/build/reports/profile'
   if(Test-Path -LiteralPath $profileDirectory){Copy-Item -LiteralPath $profileDirectory -Destination (Join-Path $record 'gradle-profile') -Recurse}
  }
  if($buildExit -ne 0){throw 'Gradle build failed; inspect gradle-release.log'}
  if(Select-String -LiteralPath 'gradle-release.log' -SimpleMatch 'An error occurred when parsing kotlin metadata' -Quiet){throw 'R8 Kotlin metadata compatibility failure'}
  $expectedR8=(& node -p "require('./plugins/withAndroidRelease').R8_VERSION").Trim()
  if($LASTEXITCODE -ne 0 -or $expectedR8 -notmatch '^\d+\.\d+\.\d+$'){throw 'Expected R8 version is invalid'}
  $mapping=Join-Path $resolved 'android/app/build/outputs/mapping/release/mapping.txt'
  if(-not (Test-Path -LiteralPath $mapping) -or (Get-Item -LiteralPath $mapping).Length -eq 0){throw 'Optimized release mapping is missing'}
  if(-not (Select-String -LiteralPath $mapping -Pattern ('^# compiler_version: '+[regex]::Escape($expectedR8)+'$') -Quiet)){throw 'Mapping compiler version does not match the pinned R8 version'}
  $mappingHash=(Get-FileHash -LiteralPath $mapping -Algorithm SHA256).Hash
  Copy-Item -LiteralPath $mapping -Destination (Join-Path $record 'mapping.txt')
  $aabHash=$null
  $deliveryAab=$null
  $aabExportedAtUtc=$null
  $apkSource='gradle-assemble'
  if($IncludeBundle){
   $aab=Join-Path $resolved 'android/app/build/outputs/bundle/release/app-release.aab'
   if(-not (Test-Path -LiteralPath $aab)){throw 'Gradle succeeded but AAB is missing'}
   $deliveryAab = & (Join-Path $PSScriptRoot 'new-aab-delivery-path.ps1') -Aab $aab -AppName 'LedPop' -OutputDirectory $record
   Copy-Item -LiteralPath $aab -Destination $deliveryAab -ErrorAction Stop
   # Stamp final export time without changing signed archive bytes.
   $artifactExportedAtUtc=[DateTime]::UtcNow
   [IO.File]::SetLastWriteTimeUtc($deliveryAab,$artifactExportedAtUtc)
   $verifiedExportedAtUtc=[IO.File]::GetLastWriteTimeUtc($deliveryAab)
   if([Math]::Abs(($verifiedExportedAtUtc-$artifactExportedAtUtc).TotalSeconds) -gt 2){throw 'Final AAB timestamp verification failed'}
   $aabExportedAtUtc=$verifiedExportedAtUtc.ToString('o')
   $aabHash=(Get-FileHash -LiteralPath $aab -Algorithm SHA256).Hash
   if($aabHash -ne (Get-FileHash -LiteralPath $deliveryAab -Algorithm SHA256).Hash){throw 'AAB delivery hash mismatch'}
   Write-Output ('AAB: '+$deliveryAab)
   Add-Type -AssemblyName System.IO.Compression.FileSystem
   $zip=[IO.Compression.ZipFile]::OpenRead($aab)
   try {
    $entry=$zip.GetEntry('BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map')
    if($null -eq $entry){throw 'AAB mapping metadata is missing'}
    $stream=$entry.Open()
    try {$embeddedHash=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($stream))} finally {$stream.Dispose()}
    if($embeddedHash -ne $mappingHash){throw 'AAB mapping differs from same-build mapping'}
   } finally {$zip.Dispose()}
   $apk=Join-Path $resolved 'android/app/build/outputs/bundle/release/app-release-universal.apk'
   & (Join-Path $PSScriptRoot 'new-universal-apk-from-aab.ps1') -Aab $aab -OutputApk $apk -BundletoolJar $BundletoolJar -Keystore $key.keystorePath -KeyAlias $key.keyAlias -LogPath (Join-Path $record 'bundletool-build-apks.log') -MaxThreads 2
   $apkSource='bundletool-universal'
  }else{
   $apk=Join-Path $resolved 'android/app/build/outputs/apk/release/app-release.apk'
  }
  if(-not (Test-Path -LiteralPath $apk)){throw 'Release APK is missing'}
  $apkHash=(Get-FileHash -LiteralPath $apk -Algorithm SHA256).Hash
  $deliveryApk = & (Join-Path $PSScriptRoot 'new-apk-delivery-path.ps1') -Apk $apk -AppName 'LedPop' -OutputDirectory $record
  Copy-Item -LiteralPath $apk -Destination $deliveryApk -ErrorAction Stop
  # Stamp final export time without changing signed archive bytes.
  $artifactExportedAtUtc=[DateTime]::UtcNow
  [IO.File]::SetLastWriteTimeUtc($deliveryApk,$artifactExportedAtUtc)
  $verifiedExportedAtUtc=[IO.File]::GetLastWriteTimeUtc($deliveryApk)
  if([Math]::Abs(($verifiedExportedAtUtc-$artifactExportedAtUtc).TotalSeconds) -gt 2){throw 'Final APK timestamp verification failed'}
  $apkExportedAtUtc=$verifiedExportedAtUtc.ToString('o')
  if($apkHash -ne (Get-FileHash -LiteralPath $deliveryApk -Algorithm SHA256).Hash){throw 'APK delivery hash mismatch'}
  Write-Output ('APK: '+$deliveryApk)
  @{ apk=$deliveryApk; apkSource=$apkSource; aab=$deliveryAab; adProfile=$AdProfile; aabSha256=$aabHash; bundletoolVersion=$bundletoolVersion; gradleTasks=$tasks; mappingSha256=$mappingHash; elapsedSeconds=((Get-Date)-$started).TotalSeconds; apkSha256=$apkHash; revision=$plan.revision; dirty=$plan.dirty; versionName=$buildVersionName; versionCode=$plan.versionCode; apkExportedAtUtc=$apkExportedAtUtc; aabExportedAtUtc=$aabExportedAtUtc; measureBuild=[bool]$MeasureBuild; configurationCache=[bool]$ConfigurationCache; reuseDaemon=[bool]$ReuseDaemon; gradleWorkers=$GradleWorkers } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $record 'build-result.json')
  if($IncludeBundle){
   # One verification entrypoint; it never invokes Gradle or repeats APK packaging.
   & $PythonExecutable $verificationScript --record $record --build-root $resolved --bundletool $BundletoolJar --sdk $env:ANDROID_HOME --java-home $env:JAVA_HOME --r8 $expectedR8
   if($LASTEXITCODE -ne 0){throw 'Store artifact verification failed; inspect release-verification record'}
   Write-Output ('Store static checks completed; review warnings and runtime/Play status separately. Record: '+$record)
  }else{
   Write-Output ('Gradle '+($tasks -join ', ')+' completed; independent artifact verification still required. Record: '+$record)
  }
 } finally { Pop-Location }
} finally {
 $env:LEDPOP_AD_PROFILE=$previousAdProfile
 if($null -ne $buildLock){$buildLock.Dispose()}
 foreach($name in @('LEDPOP_STORE_PASSWORD','LEDPOP_KEY_PASSWORD','LEDPOP_KEY_ALIAS','LEDPOP_KEYSTORE')){Remove-Item "Env:$name" -ErrorAction SilentlyContinue}
}
