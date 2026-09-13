# Read-only host checks and per-run measurements; dot-sourcing starts no build.
function Get-AndroidBuildResourceIssues {
 param($Snapshot)
 $issues=[Collections.Generic.List[string]]::new()
 if($null -eq $Snapshot.AvailableBytes -or $Snapshot.AvailableBytes -lt 0){
  $issues.Add('Available physical memory could not be measured.')
 }elseif($Snapshot.AvailableBytes -lt 4GB){
  $issues.Add(('Available memory is {0:N2} GiB; at least 4 GiB is required before this build.' -f ($Snapshot.AvailableBytes/1GB)))
 }
 foreach($item in $Snapshot.Processes){
  $command=[string]$item.CommandLine
  $name=[string]$item.Name
  # Match active build clients, not idle Gradle/Kotlin daemons or arbitrary editors.
  $gradle=$name -match '^javaw?\.exe$' -and $command -match 'GradleWrapperMain|org\.gradle\.launcher\.GradleMain' -and
    $command -match '(?i)(?:^|[\s:\x22])(?:assemble|bundle|build|install)(?:[A-Z][\w]*|)(?=[\s\x22]|$)'
  $flutter=$name -match '^dart\.exe$' -and $command -match 'flutter_tools\.snapshot[\x22]?\s+build\s+(apk|appbundle)\b'
  $expo=$name -match '^node\.exe$' -and $command -match '(?:expo|eas)' -and $command -match '\b(?:prebuild|run:android|build\s+.*--local)\b'
  if($gradle -or $flutter -or $expo){
   # Never retain command lines: they can contain credentials or private arguments.
   $issues.Add(('Another Android build/preparation client is running: {0}, PID {1}.' -f $name,$item.ProcessId))
  }
 }
 return $issues.ToArray()
}
function Get-AndroidBuildResourceSnapshot {
 $os=Get-CimInstance Win32_OperatingSystem -ErrorAction Stop
 if($null -eq $os.FreePhysicalMemory){throw 'Available physical memory could not be measured.'}
 $processes=@(Get-CimInstance Win32_Process -Filter "Name='java.exe' OR Name='javaw.exe' OR Name='dart.exe' OR Name='node.exe'" -ErrorAction Stop)
 # Unreadable build-client command lines make the concurrency check inconclusive.
 if(@($processes | Where-Object { [string]::IsNullOrWhiteSpace($_.CommandLine) }).Count){
  throw 'Some build-client command lines could not be inspected; concurrent-build status is unknown.'
 }
 return @{AvailableBytes=([long]$os.FreePhysicalMemory*1KB); Processes=$processes}
}
function Assert-AndroidBuildResources {
 param($TimingState=$null)
 try {$snapshot=Get-AndroidBuildResourceSnapshot} catch {
  if($null -ne $TimingState){$TimingState.resourceChecks.Add(@{checkedAtUtc=[DateTime]::UtcNow.ToString('o'); status='unmeasurable'})}
  throw
 }
 $issues=@(Get-AndroidBuildResourceIssues $snapshot)
 $report=@{checkedAtUtc=[DateTime]::UtcNow.ToString('o'); status=$(if($issues.Count){'blocked'}else{'passed'}); availableBytes=$snapshot.AvailableBytes; minimumBytes=4GB; issues=$issues}
 if($null -ne $TimingState){$TimingState.resourceChecks.Add($report)}
 if($issues.Count){throw ($issues -join ' ')}
 if($null -eq $TimingState){return $report}
}
function New-AndroidBuildTiming {
 return @{watch=[Diagnostics.Stopwatch]::StartNew(); startedAtUtc=[DateTime]::UtcNow.ToString('o'); stages=[Collections.Generic.List[object]]::new(); active=$null; stageWatch=$null; resourceChecks=[Collections.Generic.List[object]]::new()}
}
function Stop-AndroidBuildStage {
 param($State,[string]$Status='completed')
 if($null -ne $State.active){
  $State.stageWatch.Stop()
  $State.active.elapsedSeconds=$State.stageWatch.Elapsed.TotalSeconds
  $State.active.status=$Status
  $State.active.finishedAtUtc=[DateTime]::UtcNow.ToString('o')
  $State.active=$null
 }
}
function Start-AndroidBuildStage {
 param($State,[string]$Name)
 Stop-AndroidBuildStage $State
 $entry=[ordered]@{name=$Name; status='running'; startedAtUtc=[DateTime]::UtcNow.ToString('o'); finishedAtUtc=$null; elapsedSeconds=$null; exitCode=$null; log=$null}
 $State.stages.Add($entry)
 $State.active=$entry
 $State.stageWatch=[Diagnostics.Stopwatch]::StartNew()
}
function Skip-AndroidBuildStage {
 param($State,[string]$Name)
 Stop-AndroidBuildStage $State
 $State.stages.Add([ordered]@{name=$Name; status='skipped'; startedAtUtc=$null; finishedAtUtc=$null; elapsedSeconds=0; exitCode=$null; log=$null})
}
function Get-AndroidBuildTimingReport {
 param($State,[string]$Status)
 Stop-AndroidBuildStage $State $(if($Status -eq 'completed'){'completed'}else{'failed'})
 $State.watch.Stop()
 return [ordered]@{startedAtUtc=$State.startedAtUtc; finishedAtUtc=[DateTime]::UtcNow.ToString('o'); status=$Status; totalSeconds=$State.watch.Elapsed.TotalSeconds; resourceChecks=$State.resourceChecks.ToArray(); stages=$State.stages.ToArray()}
}
