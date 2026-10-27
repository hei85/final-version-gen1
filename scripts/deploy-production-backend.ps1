[CmdletBinding()]
param([string]$CandidateFile = 'server.production-20261001.exe')
$ErrorActionPreference = 'Stop'
$appRoot = (Resolve-Path -LiteralPath (Split-Path -Parent $PSScriptRoot)).Path
$targetExe = Join-Path $appRoot 'backend\server.next.exe'
if ([IO.Path]::GetFileName($CandidateFile) -ne $CandidateFile -or [IO.Path]::GetExtension($CandidateFile) -ne '.exe') { throw '候选后端必须是 backend 目录内的 EXE 文件名。' }
$candidateExe = Join-Path $appRoot ('backend\' + $CandidateFile)
if ([IO.Path]::GetFullPath($candidateExe) -eq [IO.Path]::GetFullPath($targetExe)) { throw '候选后端不能与运行中的文件相同。' }
$pidPath = Join-Path $appRoot 'pids.json'
$tracked = Get-Content -LiteralPath $pidPath -Raw | ConvertFrom-Json
$process = Get-CimInstance Win32_Process -Filter "ProcessId=$($tracked.backend)"
if ($process -and [IO.Path]::GetFullPath($process.ExecutablePath) -ne [IO.Path]::GetFullPath($targetExe)) { throw '后端进程路径与当前便携版不一致，停止部署。' }
if (-not $process -and (Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue)) { throw '8080 被其他进程占用，停止部署。' }
if (-not (Test-Path -LiteralPath $candidateExe -PathType Leaf)) { throw '缺少已构建的后端。' }
$backupExe = Join-Path $appRoot ('backend\server.before-production-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.exe')
Copy-Item -LiteralPath $targetExe -Destination $backupExe
if ($process) {
    Stop-Process -Id $process.ProcessId
    Wait-Process -Id $process.ProcessId -Timeout 15 -ErrorAction SilentlyContinue
}
for ($copyAttempt = 0; $copyAttempt -lt 10; $copyAttempt++) {
    try { Copy-Item -LiteralPath $candidateExe -Destination $targetExe -Force; break }
    catch { if ($copyAttempt -eq 9) { throw }; Start-Sleep -Milliseconds 500 }
}
$env:CANVAS_BACKEND_ADDR = '127.0.0.1:8080'
$env:CANVAS_BACKEND_DATA_DIR = Join-Path $appRoot 'data'
$env:CANVAS_CORS_ORIGINS = 'http://localhost:3000,http://127.0.0.1:3000'
$env:CANVAS_SELF_USE_MODE = '1'
$env:CANVAS_PORTABLE_NO_LOGIN = '1'
$env:CANVAS_INLINE_MEDIA_URLS = '1'
$env:ENABLE_PROVIDER_PLUGINS = 'false'
$env:CANVAS_AUTO_MIGRATE = 'true'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backendProcess = Start-Process -FilePath $targetExe -WorkingDirectory (Split-Path -Parent $targetExe) -WindowStyle Hidden -PassThru -RedirectStandardInput (Join-Path $appRoot 'runtime\stdin.txt') -RedirectStandardOutput (Join-Path $appRoot "logs\backend-production-$stamp.log") -RedirectStandardError (Join-Path $appRoot "logs\backend-production-$stamp.err.log")
$tracked.backend = $backendProcess.Id
$tracked | ConvertTo-Json | Set-Content -LiteralPath $pidPath -Encoding UTF8
for ($attempt = 0; $attempt -lt 30; $attempt++) {
    try {
        $health = Invoke-RestMethod -Uri 'http://127.0.0.1:8080/api/health' -TimeoutSec 2
        Write-Output (ConvertTo-Json -Compress @{backend=$backendProcess.Id;backup=$backupExe;health=$health})
        exit 0
    } catch { Start-Sleep -Milliseconds 500 }
}
throw '重启后的健康检查失败，请查看本次后端日志。'
