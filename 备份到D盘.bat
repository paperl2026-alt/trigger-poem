@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "DEST=D:\trigger-poem-backup"
if not exist "%DEST%" mkdir "%DEST%"
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmm"') do set TS=%%i
git add -A
git commit -q -m "备份前自动存档" >nul 2>&1
git bundle create "%DEST%\trigger-poem_%TS%.bundle" --all
if errorlevel 1 (echo 备份失败，把这个窗口截图发给 Claude。) else (echo 已备份到 %DEST%\trigger-poem_%TS%.bundle)
echo 这一个文件就是全部存档历史；C 盘坏了也能从它完整恢复。旧的备份不会自动删。
pause
