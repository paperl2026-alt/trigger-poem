@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在构建并打开「晃动技术验证」……
call npm run build
if errorlevel 1 (pause & exit /b)
call npx electron . --page=jiggle.html
