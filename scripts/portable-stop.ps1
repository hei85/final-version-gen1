[CmdletBinding()]
param()

$ErrorActionPreference = "Continue"

$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot 'portable-environment.ps1')
$pidFile = Join-Path $root "pids.json"
$agentConfigDir = Join-Path $root "canvas-agent-config"

if (-not (Test-Path -LiteralPath $pidFile)) {
    Write-Host "没有找到 pids.json，可能还没启动过。"
    exit 0
}

$pids = Get-Content -LiteralPath $pidFile -Raw | ConvertFrom-Json
foreach ($name in @("web", "agent", "backend")) {
    $processId = $pids.$name
    if (-not $processId) { continue }
    $process = Get-Process -Id ([int]$processId) -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "停止 $name（PID $processId）..."
        Stop-Process -Id ([int]$processId) -Force -ErrorAction SilentlyContinue
    }
}
Move-Item -LiteralPath $pidFile -Destination ($pidFile + ".stopped") -Force -ErrorAction SilentlyContinue

# 运行时被强杀时可能留下 Dreamina 状态锁；这里清掉，避免下次启动卡在「状态锁被占用」。
Start-Sleep -Seconds 2
if (Test-Path -LiteralPath $agentConfigDir) {
    Get-ChildItem -LiteralPath $agentConfigDir -Force -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like "dreamina-runtime-state.json.lock*" } |
        ForEach-Object {
            Write-Host "清理残留状态锁：$($_.Name)"
            Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
        }
}

Write-Host "衍图便携版已停止。" -ForegroundColor Green
