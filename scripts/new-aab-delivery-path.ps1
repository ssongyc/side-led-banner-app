param(
    [Parameter(Mandatory=$true)][string]$Aab,
    [Parameter(Mandatory=$true)][string]$AppName,
    [Parameter(Mandatory=$true)][string]$OutputDirectory
)
$ErrorActionPreference = 'Stop'
# Read only the AAPT2 protobuf manifest; do not unpack/repack or resign the bundle.
# Schema: https://android.googlesource.com/platform/frameworks/base/+/master/tools/aapt2/Resources.proto
function Read-Varint([byte[]]$Data, [ref]$Position) {
    [long]$value = 0
    for ($shift=0; $shift -lt 63; $shift+=7) {
        if ($Position.Value -ge $Data.Length) { throw 'Truncated protobuf value.' }
        [long]$b = $Data[$Position.Value]; $Position.Value++
        $value = $value -bor (($b -band 127) -shl $shift)
        if ($b -lt 128) { return $value }
    }
    throw 'Unsupported protobuf integer.'
}
function Read-Fields([byte[]]$Data) {
    $position=0
    while ($position -lt $Data.Length) {
        $tag=Read-Varint $Data ([ref]$position)
        if (($tag -shr 3) -eq 0) { throw 'Invalid protobuf field.' }
        $wire=$tag -band 7
        if ($wire -eq 0) { $null=Read-Varint $Data ([ref]$position); continue }
        $length=switch ($wire) { 1 {8} 5 {4} 2 {Read-Varint $Data ([ref]$position)} default {throw 'Unsupported protobuf field type.'} }
        if ($length -gt ($Data.Length-$position)) { throw 'Truncated protobuf field.' }
        if ($wire -eq 2) {
            $bytes=New-Object byte[] ([int]$length)
            [Buffer]::BlockCopy($Data,$position,$bytes,0,[int]$length)
            [pscustomobject]@{Number=($tag -shr 3);Data=$bytes}
        }
        $position += [int]$length
    }
}
function One-Field($Fields,[int]$Number) {
    $found=@($Fields | Where-Object Number -eq $Number)
    if ($found.Count -ne 1) { throw "Missing or duplicate manifest field $Number." }
    return ,$found[0].Data
}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$bundle=[IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $Aab).Path)
try {
    $entries=@($bundle.Entries|Where-Object FullName -eq 'base/manifest/AndroidManifest.xml')
    if ($entries.Count -ne 1 -or $entries[0].Length -gt 16MB) { throw 'Missing, duplicate, or oversized AAB manifest.' }
    $stream=$entries[0].Open();$memory=[IO.MemoryStream]::new()
    try {$stream.CopyTo($memory);$data=$memory.ToArray()} finally {$stream.Dispose();$memory.Dispose()}
} finally {$bundle.Dispose()}
$node=@(Read-Fields $data)
$element=@(Read-Fields (One-Field $node 1))
$utf8=[Text.UTF8Encoding]::new($false,$true)
if ($utf8.GetString((One-Field $element 3)) -cne 'manifest') { throw 'AAB root is not manifest.' }
$versions=@(foreach($attribute in @($element|Where-Object Number -eq 4)) {
    $fields=@(Read-Fields $attribute.Data)
    if ($utf8.GetString((One-Field $fields 2)) -ceq 'versionName') {
        if ($utf8.GetString((One-Field $fields 1)) -cne 'http://schemas.android.com/apk/res/android') { throw 'Unexpected versionName namespace.' }
        $utf8.GetString((One-Field $fields 3))
    }
})
if ($versions.Count -ne 1 -or $versions[0] -notmatch '^\d+(\.\d+)*$') { throw 'AAB versionName must contain only digits and periods.' }
$name=$AppName -replace '\s',''
if ($name -notmatch '^[A-Za-z0-9]+$') { throw 'Invalid app filename name.' }
$filename=$name+'V'+$versions[0].Replace('.','')+'.aab'
$run=(Get-Date -Format 'yyyyMMdd-HHmmss')+'-'+[guid]::NewGuid().ToString('N')
$directory=Join-Path ([IO.Path]::GetFullPath($OutputDirectory)) ('aab-deliveries/'+$run)
New-Item -ItemType Directory -Path $directory -ErrorAction Stop|Out-Null
Join-Path $directory $filename
