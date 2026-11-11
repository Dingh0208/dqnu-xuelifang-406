@echo off
chcp 936 >nul
cd /d "%~dp0"

echo [1/3] 检查 MySQL 127.0.0.1:3307 ...
powershell -NoProfile -Command "if (Get-NetTCPConnection -State Listen -LocalPort 3307 -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if errorlevel 1 (
  echo       启动便携版 MySQL ...
  powershell -NoProfile -Command "Start-Process -FilePath '%CD%\mysql\mysql-8.0.28-winx64\bin\mysqld.exe' -ArgumentList '--defaults-file=%CD%\mysql\my.ini' -WindowStyle Hidden"
  timeout /t 5 /nobreak >nul
) else (
  echo       MySQL 已在运行
)

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
echo 停止全部服务：stop.cmd