# Portable tools take precedence; do not depend on the author's PATH or user-site packages.
$portableEnvironmentRoot = Split-Path -Parent $PSScriptRoot
$portableTools = @(
    (Join-Path $portableEnvironmentRoot 'runtime\powershell'),
    (Join-Path $portableEnvironmentRoot 'runtime\ffmpeg\bin'),
    (Join-Path $portableEnvironmentRoot 'runtime\music\fluidsynth\bin'),
    (Join-Path $portableEnvironmentRoot 'runtime'),
    (Join-Path $portableEnvironmentRoot 'python-runtime'),
    (Join-Path $portableEnvironmentRoot 'python-runtime\Scripts')
)
$env:PATH = (($portableTools | Where-Object { Test-Path -LiteralPath $_ }) -join [IO.Path]::PathSeparator) + [IO.Path]::PathSeparator + $env:PATH
$env:PYTHONNOUSERSITE = '1'
