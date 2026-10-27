[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot 'portable-environment.ps1')
$pidFile = Join-Path $root 'pids.json'
$entry = Join-Path $root 'canvas-agent\dist\index.js'
$nodeExe = Join-Path $root 'runtime\node.exe'
$stdinFile = Join-Path $root 'runtime\stdin.txt'
if (-not (Test-Path -LiteralPath $entry) -or -not (Test-Path -LiteralPath $nodeExe)) {
    throw '便携版 Agent 运行文件不完整。'
}
$pids = Get-Content -LiteralPath $pidFile -Raw | ConvertFrom-Json
$oldId = [int]$pids.agent
if ($oldId) {
    $old = Get-CimInstance Win32_Process -Filter "ProcessId = $oldId"
    if ($old) {
        if (-not $old.CommandLine.Contains($entry)) { throw "PID $oldId 不是此便携版 Agent，拒绝停止。" }
        Stop-Process -Id $oldId -Force
    }
}

$env:FRAMEFIELD_LOCAL_RUNTIME_CONFIG_DIR = Join-Path $root 'canvas-agent-config'
$env:FRAMEFIELD_TRUSTED_WEB_ORIGINS = 'http://localhost:3000,http://127.0.0.1:3000'
$env:CANVAS_PROJECT_ROOT = $root
$env:CANVAS_DEPTH_PYTHON = Join-Path $root 'python-runtime\python.exe'
$env:CANVAS_POSE_PYTHON = $env:CANVAS_DEPTH_PYTHON
$env:CANVAS_CUTOUT_PYTHON = $env:CANVAS_DEPTH_PYTHON
$env:CANVAS_DEPTH_HF_HOME = Join-Path $root '.local\cache\huggingface'
$env:CANVAS_LINEART_HF_HOME = $env:CANVAS_DEPTH_HF_HOME
$env:CANVAS_POSE_HF_HOME = $env:CANVAS_DEPTH_HF_HOME
$env:CANVAS_CUTOUT_MODEL_HOME = Join-Path $root ".local\cache\rembg"
$env:HF_HOME = $env:CANVAS_DEPTH_HF_HOME
$env:HF_HUB_CACHE = Join-Path $env:CANVAS_DEPTH_HF_HOME 'hub'

$agent = Start-Process -FilePath $nodeExe -ArgumentList ('"' + $entry + '"') -WorkingDirectory (Join-Path $root 'canvas-agent') -WindowStyle Hidden -PassThru `
    -RedirectStandardInput $stdinFile -RedirectStandardOutput (Join-Path $root 'logs\canvas-agent.log') -RedirectStandardError (Join-Path $root 'logs\canvas-agent.err.log')
$pids.agent = $agent.Id
$pids | ConvertTo-Json | Set-Content -LiteralPath $pidFile -Encoding UTF8
Write-Host "便携版画布 Agent 已启动：PID $($agent.Id)"


