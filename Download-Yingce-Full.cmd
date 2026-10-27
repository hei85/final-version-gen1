@echo off
chcp 65001 >nul
setlocal
rem Respect an already configured HTTPS_PROXY. Otherwise reuse an enabled local Windows proxy.
for /f "tokens=3" %%P in ('reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyEnable 2^>nul ^| find /i "ProxyEnable"') do set "YINGCE_PROXY_ENABLED=%%P"
if "%YINGCE_PROXY_ENABLED%"=="0x1" (
  for /f "tokens=3" %%P in ('reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyServer 2^>nul ^| find /i "ProxyServer"') do set "YINGCE_PROXY_SERVER=%%P"
)
if not defined HTTPS_PROXY if defined YINGCE_PROXY_SERVER (
  echo %YINGCE_PROXY_SERVER%| findstr /r /x "127\.0\.0\.1:[0-9][0-9]*" >nul
  if not errorlevel 1 set "HTTPS_PROXY=http://%YINGCE_PROXY_SERVER%"
)
cd /d "%~dp0"
if exist "%~dp0衍图便携版" (
  echo 当前目录已有衍图便携版，请把本下载器放到一个新的空文件夹后运行，避免覆盖原有数据。
  pause
  exit /b 1
)
where curl.exe >nul 2>nul
if errorlevel 1 (
  echo 当前系统没有curl，请从GitHub发行页手动下载全部分卷和7za.exe。
  pause
  exit /b 1
)
if not exist "%~dp0downloads" mkdir "%~dp0downloads"
set "RELEASE_BASE=https://github.com/hei85/final-version-gen1/releases/download/v2026.10.27-agent-auto-full"
for %%F in (yingce-windows-x64-full-20261027.zip.001 yingce-windows-x64-full-20261027.zip.002 7za.exe 7zip-notice.txt 7zip-LICENSE.txt) do (
  if not exist "%~dp0downloads\%%F" (
    echo 正在下载 %%F ...
    curl.exe --fail --location --retry 3 --continue-at - --output "%~dp0downloads\%%F.download" "%RELEASE_BASE%/%%F"
    if errorlevel 1 goto failed
    move /y "%~dp0downloads\%%F.download" "%~dp0downloads\%%F" >nul
  )
)
call :verify "%~dp0downloads\yingce-windows-x64-full-20261027.zip.001" "8f13a491e2ab89db03d4d04b61e0ddc5d2f3b5a3e087fd6d47b21d9f734563bf"
if errorlevel 1 goto failed
call :verify "%~dp0downloads\yingce-windows-x64-full-20261027.zip.002" "5f1ff41b889a58385f427c5f12773ceb8624930c79947b4eeba9a194cb84e914"
if errorlevel 1 goto failed
call :verify "%~dp0downloads\7za.exe" "7ddf0a3bc451e166679296be630d6f0573eb386159c04184761c43020c484291"
if errorlevel 1 goto failed
call :verify "%~dp0downloads\7zip-notice.txt" "34b4b38ec96fd061b62461830feb6263eaad5455bd9e6285537db15fa845e62e"
if errorlevel 1 goto failed
call :verify "%~dp0downloads\7zip-LICENSE.txt" "39d2187b942cc88818dd959e53c6b7dddd152097a42061467c4d56050168d646"
if errorlevel 1 goto failed
echo 正在解压完整版，请稍候...
"%~dp0downloads\7za.exe" x "%~dp0downloads\yingce-windows-x64-full-20261027.zip.001" -o"%~dp0." -y
if errorlevel 1 goto failed
echo 解压完成，正在启动衍图...
call "%~dp0衍图便携版\启动衍图.cmd"
exit /b 0
:failed
echo 下载或解压未完成。网络恢复后可重新运行，下载会续传。
pause
exit /b 1
:verify
"%SystemRoot%\System32\certutil.exe" -hashfile "%~1" SHA256 2>nul | "%SystemRoot%\System32\find.exe" /i "%~2" >nul
if errorlevel 1 (
  echo 文件校验未通过：%~nx1。请删除该下载文件后重新运行。
  exit /b 1
)
exit /b 0
