@echo off
chcp 936 >nul
echo 停止学立方后端服务 ...

for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3100" ^| findstr "LISTENING"') do (
  echo   结束 Node 进程 PID=%%p
  taskkill /f /pid %%p >nul 2>&1
)

for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3307" ^| findstr "LISTENING"') do (
  echo   结束 MySQL 进程 PID=%%p
  taskkill /f /pid %%p >nul 2>&1
)

echo 已停止。