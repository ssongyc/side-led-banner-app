$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'android-build-observability.ps1')
$count=0
function Assert-True($Value,$Label){if(-not $Value){throw "FAILED: $Label"}; $script:count++}
function Issues($Memory,$Processes=@()){ @(Get-AndroidBuildResourceIssues @{AvailableBytes=$Memory;Processes=$Processes}) }
Assert-True ((Issues 4GB).Count -eq 0) '4 GiB boundary accepted'
Assert-True ((Issues (4GB-1)).Count -eq 1) 'low memory rejected'
Assert-True ((Issues $null).Count -eq 1) 'unmeasurable memory rejected'
foreach($case in @(
 @{Name='java.exe';ProcessId=1;CommandLine='java GradleWrapperMain :app:bundleRelease --build-cache'},
 @{Name='java.exe';ProcessId=2;CommandLine='java org.gradle.launcher.GradleMain assembleRelease'},
 @{Name='dart.exe';ProcessId=3;CommandLine='dart "C:\flutter\flutter_tools.snapshot" build appbundle'},
 @{Name='node.exe';ProcessId=4;CommandLine='node expo prebuild --platform android'},
 @{Name='node.exe';ProcessId=5;CommandLine='node eas build --platform android --local'}
)) {Assert-True ((Issues 8GB @($case)).Count -eq 1) "active build detected: $($case.Name)"}
foreach($command in @('java GradleDaemon 9.3.1','java KotlinCompileDaemon','java GradleWrapperMain --version','java GradleWrapperMain tasks')){
 Assert-True ((Issues 8GB @(@{Name='java.exe';ProcessId=6;CommandLine=$command})).Count -eq 0) "idle/read-only excluded: $command"
}
$s=New-AndroidBuildTiming
Start-AndroidBuildStage $s 'dependencyInstallation'
$s.active.exitCode=0
Start-AndroidBuildStage $s 'compilation'
$s.active.exitCode=1
$r=Get-AndroidBuildTimingReport $s 'failed'
Assert-True ($r.status -eq 'failed' -and $r.stages[0].status -eq 'completed' -and $r.stages[1].status -eq 'failed') 'failure preserves completed stages'
Assert-True ($r.stages[1].exitCode -eq 1 -and $r.totalSeconds -ge 0 -and $r.stages[0].elapsedSeconds -ge 0) 'elapsed time and exit code retained'
$s=New-AndroidBuildTiming
Skip-AndroidBuildStage $s 'nativeGeneration'
Start-AndroidBuildStage $s 'apkExport'
$r=Get-AndroidBuildTimingReport $s 'completed'
Assert-True ($r.stages[0].status -eq 'skipped' -and $r.stages[0].elapsedSeconds -eq 0 -and $r.stages[1].status -eq 'completed') 'skipped and executed separated'
# Parse the wrapper without executing credentials, resource probes, installs or builds.
$tokens=$null;$errors=$null
[void][Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot 'build-local-apk.ps1'),[ref]$tokens,[ref]$errors)
Assert-True ($errors.Count -eq 0) ('wrapper parses: '+($errors.Message -join '; '))
# Substitute the OS/process probe only inside this test process.
$script:fixtureMode='low'
function Get-CimInstance {
 param($ClassName,$Filter,$ErrorAction)
 if($script:fixtureMode -eq 'probeFailure'){throw 'fixture probe failure'}
 if($ClassName -eq 'Win32_OperatingSystem'){return @{FreePhysicalMemory=1MB}}
 return @(@{Name='java.exe';ProcessId=88;CommandLine=$(if($script:fixtureMode -eq 'unreadable'){$null}else{'java GradleDaemon 9.3.1'})})
}
$s=New-AndroidBuildTiming
$caught=$false
try {Assert-AndroidBuildResources $s} catch {$caught=$true}
Assert-True ($caught -and $s.resourceChecks[0].status -eq 'blocked' -and $s.resourceChecks[0].availableBytes -eq 1GB) 'blocked preflight retains measured memory'
$script:fixtureMode='unreadable'
$s=New-AndroidBuildTiming;$caught=$false
try {Assert-AndroidBuildResources $s} catch {$caught=$true}
Assert-True ($caught -and $s.resourceChecks[0].status -eq 'unmeasurable') 'unreadable process state is not reported safe'
$script:fixtureMode='probeFailure'
$s=New-AndroidBuildTiming;$caught=$false
try {Assert-AndroidBuildResources $s} catch {$caught=$true}
Assert-True ($caught -and $s.resourceChecks[0].status -eq 'unmeasurable') 'probe failure is not reported safe'
$serialized=$r | ConvertTo-Json -Depth 6 | ConvertFrom-Json
Assert-True ($serialized.stages[0].status -eq 'skipped' -and $serialized.stages[1].status -eq 'completed') 'timing report survives JSON serialization'
Write-Output "PASS: $count assertions (fixtures only; no build or process mutation)"
