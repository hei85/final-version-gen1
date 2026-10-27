[CmdletBinding()]
param([switch]$NoBrowser)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot 'portable-environment.ps1')
$runtimeDir = Join-Path $root "runtime"
$nodeExe = Join-Path $runtimeDir "node.exe"
$backendExe = Join-Path $root "backend\server.next.exe"
$agentEntry = Join-Path $root "canvas-agent\dist\index.js"
$webEntry = Join-Path $runtimeDir "serve-web.mjs"
$logDir = Join-Path $root "logs"
$dataDir = Join-Path $root "data"
$agentConfigDir = Join-Path $root "canvas-agent-config"
$stdinFile = Join-Path $runtimeDir "stdin.txt"
$pidFile = Join-Path $root "pids.json"

foreach ($required in @($nodeExe, $backendExe, $agentEntry, $webEntry)) {
    if (-not (Test-Path -LiteralPath $required)) { throw "便携包不完整，缺少：$required" }
}

New-Item -ItemType Directory -Force -Path $logDir, $dataDir, $agentConfigDir | Out-Null
if (-not (Test-Path -LiteralPath $stdinFile)) { New-Item -ItemType File -Path $stdinFile -Force | Out-Null }

function Test-ListeningPort([int]$Port) {
    try { return $null -ne (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop | Select-Object -First 1) }
    catch { return $false }
}

foreach ($port in 3000, 8080, 17371) {
    if (Test-ListeningPort $port) { throw "端口 $port 已被占用，请先关闭占用它的程序（或运行 scripts\portable-stop.ps1）后重试。" }
}

$env:CANVAS_BACKEND_ADDR = "127.0.0.1:8080"
$env:CANVAS_BACKEND_DATA_DIR = $dataDir
$env:CANVAS_CORS_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000"
$env:CANVAS_SELF_USE_MODE = "1"
$env:CANVAS_PORTABLE_NO_LOGIN = "1"
$env:CANVAS_INLINE_MEDIA_URLS = "1"
$env:ENABLE_PROVIDER_PLUGINS = "false"
$env:CANVAS_AUTO_MIGRATE = "true"

Write-Host "启动后端（8080）..." -ForegroundColor Cyan
$backend = Start-Process -FilePath $backendExe -WorkingDirectory (Split-Path -Parent $backendExe) -WindowStyle Hidden -PassThru `
    -RedirectStandardInput $stdinFile -RedirectStandardOutput (Join-Path $logDir "backend.log") -RedirectStandardError (Join-Path $logDir "backend.err.log")

$env:FRAMEFIELD_LOCAL_RUNTIME_CONFIG_DIR = $agentConfigDir
$env:FRAMEFIELD_TRUSTED_WEB_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000"

# 图像分析模块（深度图 / AI 线稿 / 姿态骨架）的本地依赖：包内 Python 与模型缓存。
$env:CANVAS_PROJECT_ROOT = $root
$env:CANVAS_DEPTH_PYTHON = Join-Path $root "python-runtime\python.exe"
$env:CANVAS_POSE_PYTHON = $env:CANVAS_DEPTH_PYTHON
$env:CANVAS_CUTOUT_PYTHON = $env:CANVAS_DEPTH_PYTHON
$env:CANVAS_DEPTH_HF_HOME = Join-Path $root ".local\cache\huggingface"
$env:CANVAS_LINEART_HF_HOME = $env:CANVAS_DEPTH_HF_HOME
$env:CANVAS_POSE_HF_HOME = $env:CANVAS_DEPTH_HF_HOME
$env:CANVAS_CUTOUT_MODEL_HOME = Join-Path $root ".local\cache\rembg"
$env:HF_HOME = $env:CANVAS_DEPTH_HF_HOME
$env:HF_HUB_CACHE = Join-Path $env:CANVAS_DEPTH_HF_HOME "hub"

$env:FRAMEFIELD_TRUSTED_WEB_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000"

Write-Host "启动画布 Agent 运行时（17371）..." -ForegroundColor Cyan
$agent = Start-Process -FilePath $nodeExe -ArgumentList ('"' + $agentEntry + '"') -WorkingDirectory (Split-Path -Parent (Split-Path -Parent $agentEntry)) -WindowStyle Hidden -PassThru `
    -RedirectStandardInput $stdinFile -RedirectStandardOutput (Join-Path $logDir "canvas-agent.log") -RedirectStandardError (Join-Path $logDir "canvas-agent.err.log")

Write-Host "启动网页服务（3000）..." -ForegroundColor Cyan
$web = Start-Process -FilePath $nodeExe -ArgumentList ('"' + $webEntry + '"') -WorkingDirectory $root -WindowStyle Hidden -PassThru `
    -RedirectStandardInput $stdinFile -RedirectStandardOutput (Join-Path $logDir "web.log") -RedirectStandardError (Join-Path $logDir "web.err.log")

@{ backend = $backend.Id; agent = $agent.Id; web = $web.Id; startedAt = (Get-Date).ToString("s") } | ConvertTo-Json | Set-Content -LiteralPath $pidFile -Encoding UTF8

function Wait-Endpoint([string]$Url, [int]$TimeoutSeconds = 90) {
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 3
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) { return $true }
        } catch { Start-Sleep -Milliseconds 500 }
    }
    return $false
}

$ok = (Wait-Endpoint "http://127.0.0.1:8080/api/health") -and (Wait-Endpoint "http://127.0.0.1:3000") -and (Wait-Endpoint "http://127.0.0.1:17371/health")
if (-not $ok) {
    Write-Host "启动未完成，请查看 logs 目录下的日志。" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "正在准备内置制作技能..." -ForegroundColor Cyan
& $nodeExe (Join-Path $runtimeDir 'bootstrap-skills.mjs')
if ($LASTEXITCODE -ne 0) { throw '内置技能注册失败，请查看上面的具体错误。不要开始生成。' }

Write-Host "衍图便携版已启动：" -ForegroundColor Green
Write-Host "  网页：        http://localhost:3000"
Write-Host "  后端：        http://127.0.0.1:8080"
Write-Host "  画布 Agent：  http://127.0.0.1:17371"
Write-Host "  数据目录：    $dataDir"
Write-Host "  日志目录：    $logDir"
Write-Host ""
Write-Host "关闭：运行 scripts\portable-stop.ps1（或双击 停止衍图.cmd）"

if (-not $NoBrowser) { Start-Process "http://localhost:3000" | Out-Null }


