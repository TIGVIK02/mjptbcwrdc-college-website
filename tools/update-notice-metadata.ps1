$noticeDirectory = Join-Path $PSScriptRoot '..\assets\notice_files'
$outputPath = Join-Path $noticeDirectory 'pdf-notices.txt'

$notices = Get-ChildItem -Path $noticeDirectory -File -Filter '*.pdf' | Sort-Object Name

$content = $notices | ForEach-Object { "TITLE=$($_.BaseName)`r`nPDF=$($_.Name)" }
$content -join "`r`n`r`n" | Set-Content -Path $outputPath -Encoding UTF8
Write-Output "Updated $outputPath with $($notices.Count) notice(s)."
