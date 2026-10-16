@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在构建并启动《相对希望少女们的扣击诗》……
call npm run app
if errorlevel 1 pause
