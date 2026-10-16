@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在打包 exe（约 1 分钟）……
call npm run exe
echo.
echo 打包好了：release\TriggerPoem-win32-x64\TriggerPoem.exe
pause
