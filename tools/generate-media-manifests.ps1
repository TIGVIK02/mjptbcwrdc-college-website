$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
python (Join-Path $repoRoot 'tools\build_content.py')
