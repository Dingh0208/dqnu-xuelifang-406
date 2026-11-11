@echo off
chcp 936 >nul
cd /d "%~dp0"

echo [1/3] 检查 MySQL 服务 127.0.0.1:3306 ...
powershell -NoProfile -Command "if (Get-NetTCPConnection -State Listen -LocalPort 3306 -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if errorlevel 1 (
  echo       尝试启动服务 MySQL80 ...
  net start MySQL80 >nul 2>&1
  timeout /t 5 /nobreak >nul
)
powershell -NoProfile -Command "if (Get-NetTCPConnection -State Listen -LocalPort 3306 -ErrorAction SilentlyContinue) { Write-Host '      MySQL 已就绪' } else { Write-Host '      [警告] MySQL 未启动，请用管理员身份执行: net start MySQL80' }"

echo [2/3] 检查后端 127.0.0.1:3100 ...
powershell -NoProfile -Command "if (Get-NetTCPConnection -State Listen -LocalPort 3100 -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if errorlevel 1 (
  echo       启动 Node 后端 ...
  powershell -NoProfile -Command "Start-Process -FilePath 'node' -ArgumentList 'src\server.js' -WorkingDirectory '%CD%' -WindowStyle Hidden"
  timeout /t 3 /nobreak >nul
) else (
  echo       后端已在运行
)

echo [3/3] 打开后台管理台 ...
start "" "http://127.0.0.1:3100/admin/"

echo.
echo 管理员账号 admin / admin123
echo 停止后端：stop.cmd（MySQL 作为系统服务常驻）