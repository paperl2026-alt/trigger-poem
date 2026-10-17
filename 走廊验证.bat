@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在构建并打开「走廊技术验证」……
echo 操作：鼠标移动瞄准，按住左键探身射击，松开躲进掩体，右键放必杀。Esc 设置。
call npm run build
if errorlevel 1 (pause & exit /b)
call npx electron . --page=index.html?ep=corridor_test
