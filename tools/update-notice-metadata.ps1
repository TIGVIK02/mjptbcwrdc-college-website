$noticeDirectory = Join-Path $PSScriptRoot '..\assets\notice_files'
$outputPath = Join-Path $noticeDirectory 'notice-index.json'

$notices = Get-ChildItem -Path $noticeDirectory -File -Filter '*.pdf' | ForEach-Object {
  [PSCustomObject]@{
    title = $_.BaseName
    file = $_.Name
    updated = $_.LastWriteTime.ToString('o')
  }
} | Sort-Object { [datetime]$_.updated } -Descending

$notices | ConvertTo-Json -Depth 3 | Set-Content -Path $outputPath -Encoding UTF8
Write-Output "Updated $outputPath with $($notices.Count) PDF notice(s)."
