param(
    [int]$PollSeconds = 2
)

$root = Split-Path -Parent $PSScriptRoot
$pyqFolder = Join-Path $root "assets\pyq"
$generator = Join-Path (Split-Path -Parent $PSScriptRoot) "build_content.py"

if (-not (Test-Path $pyqFolder)) {
    throw "PYQ folder not found: $pyqFolder"
}

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    throw "Python was not found on PATH. Install Python or run build_content.py manually."
}

function Get-PyqSignature {
    $files = Get-ChildItem -Path $pyqFolder -File -Filter "*.pdf" | Sort-Object FullName
    return (($files | ForEach-Object { "$($_.FullName)|$($_.Length)|$($_.LastWriteTimeUtc.Ticks)" }) -join "`n")
}

$signature = Get-PyqSignature
Write-Host "Watching $pyqFolder"
Write-Host "Press Ctrl+C to stop."

while ($true) {
    Start-Sleep -Seconds $PollSeconds
    $currentSignature = Get-PyqSignature
    if ($currentSignature -eq $signature) {
        continue
    }

    & $python.Source $generator
    if ($LASTEXITCODE -eq 0) {
        $signature = $currentSignature
        Write-Host "Updated data\pyq.json at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    } else {
        Write-Warning "build_content.py failed with exit code $LASTEXITCODE"
    }
}
