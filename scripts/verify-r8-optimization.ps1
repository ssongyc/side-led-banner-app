# Read-only, same-build configuration gate; AAB metrics are separate from mapping.
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$ConfigurationPath,
  [string]$AabPath
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
try {
  $configuration = Get-Content -LiteralPath $ConfigurationPath -Raw -ErrorAction Stop
  if ([string]::IsNullOrWhiteSpace($configuration)) { throw 'Empty effective R8 configuration.' }
  if ($configuration -match '(?m)^\s*-(dontoptimize|dontshrink|dontobfuscate)(?:\s|$)') {
    throw 'Effective R8 configuration disables optimization, shrinking or obfuscation.'
  }
  $metrics = $null
  $dexBytes = $null
  $metadataHash = $null
  if ($AabPath) {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [IO.Compression.ZipFile]::OpenRead($AabPath)
    try {
      $entries = @($archive.Entries | Where-Object { $_.FullName -ceq 'BUNDLE-METADATA/com.android.tools/r8.json' })
      if ($entries.Count -ne 1 -or $entries[0].Length -eq 0) { throw 'Expected one nonempty AAB r8.json.' }
      $reader = [IO.StreamReader]::new($entries[0].Open())
      try { $metadata = $reader.ReadToEnd() | ConvertFrom-Json } finally { $reader.Dispose() }
      foreach ($name in @('isOptimizationsEnabled', 'isShrinkingEnabled', 'isObfuscationEnabled')) {
        $value = $metadata.options.$name
        if ($value -isnot [bool] -or -not $value) { throw "R8 option $name is not enabled." }
      }
      $dexEntries = @($archive.Entries | Where-Object { $_.FullName -match '^[^/]+/dex/[^/]+\.dex$' })
      if ($dexEntries.Count -eq 0) { throw 'AAB contains no DEX entries.' }
      $dexBytes = ($dexEntries | Measure-Object -Property Length -Sum).Sum
      $hashStream = $entries[0].Open()
      $sha = [Security.Cryptography.SHA256]::Create()
      try { $metadataHash = [BitConverter]::ToString($sha.ComputeHash($hashStream)).Replace('-', '') }
      finally { $sha.Dispose(); $hashStream.Dispose() }
      $metrics = [ordered]@{}
      foreach ($category in @('Optimization', 'Shrinking', 'Obfuscation')) {
        $value = $metadata.stats.("no${category}Percentage")
        if ($null -eq $value -or $value -is [string] -or $value -is [bool]) { throw "Invalid $category metric." }
        $number = [double]$value
        if ([double]::IsNaN($number) -or [double]::IsInfinity($number) -or $number -lt 0 -or $number -gt 100) {
          throw "Invalid $category percentage."
        }
        $percentage = 100.0 - $number
        if ($percentage -lt 25.0) { throw "$category is $percentage%; local preventive minimum is 25%. Export blocked." }
        $metrics[$category] = $percentage
      }
    } finally { $archive.Dispose() }
  }
  [pscustomobject]@{
    Check = 'r8-optimization'
    ConfigurationPath = $ConfigurationPath
    ConfigurationSha256 = (Get-FileHash -LiteralPath $ConfigurationPath -Algorithm SHA256).Hash
    Configuration = 'passed'
    AabMetrics = if ($AabPath) { 'passed' } else { 'not-applicable: APK-only; no AAB percentage claim' }
    Percentages = $metrics
    MinimumPercentage = 25
    ThresholdScope = 'Local preventive gate; Play eligibility and deadline require separate confirmation'
    UncompressedDexBytes = $dexBytes
    MetadataSha256 = $metadataHash
  } | ConvertTo-Json -Compress
} catch {
  [Console]::Error.WriteLine('R8 optimization gate FAILED: ' + $_.Exception.Message)
  exit 1
}
