$assetRoot = Join-Path $PSScriptRoot '..\assets\images'
$outputPath = Join-Path $PSScriptRoot '..\data\media-manifest.json'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

function Get-MediaFiles($directory, $extensions) {
  if (-not (Test-Path $directory)) { return @() }
  return @(Get-ChildItem -Path $directory -File | Where-Object { $extensions -contains $_.Extension.ToLowerInvariant() } | Sort-Object Name | ForEach-Object {
    $_.FullName.Substring($repoRoot.Length + 1).Replace('\', '/')
  })
}

$homeExtensions = @('.jpg', '.jpeg', '.png', '.webp', '.svg')
$galleryExtensions = @('.jpg', '.jpeg', '.png', '.pdf')
$galleryRoot = Join-Path $assetRoot 'gallery'
$gallery = @()
if (Test-Path $galleryRoot) {
  $gallery = @(Get-ChildItem -Path $galleryRoot -Directory | Sort-Object Name | ForEach-Object {
    [ordered]@{ category = $_.Name; files = @(Get-MediaFiles $_.FullName $galleryExtensions) }
  })
}

$manifest = [ordered]@{
  collegeLife = @(Get-MediaFiles (Join-Path $assetRoot 'college_life_in_focus') $homeExtensions)
  campusLife = @(Get-MediaFiles (Join-Path $assetRoot 'campus_life') $homeExtensions)
  gallery = $gallery
}
$manifest | ConvertTo-Json -Depth 5 | Set-Content -Path $outputPath -Encoding UTF8
Write-Output "Updated $outputPath"