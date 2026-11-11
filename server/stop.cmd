@echo off
chcp 936 >nul
echo 停止学立方后端（Node 服务）...

for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3100" ^| findstr "LISTENING"') do (
  echo   结束 Node 进程 PID=%%p
  taskkill /f /pid %%p >nul 2>&1
)

echo 已停止。MySQL 作为系统服务 MySQL80 继续运行；
echo 如需停止数据库，请用管理员身份执行： net stop MySQL80