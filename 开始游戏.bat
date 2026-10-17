@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo    相对希望少女们的扣击诗
echo.
echo    [回车]  开始游戏
echo    [1]     走廊验证（现在在做的关卡）
echo    [2]     晃动技术验证
echo    [3]     打包 exe
echo    [4]     存档并同步到 GitHub
echo    [5]     备份全部存档到 D 盘
echo.
set "C="
set /p "C=选一个，直接回车就是开始游戏："
if "%C%"=="" goto game
if "%C%"=="1" goto corridor
if "%C%"=="2" goto jiggle
if "%C%"=="3" goto exe
if "%C%"=="4" goto save
if "%C%"=="5" goto backup
goto game

:game
echo 正在构建并启动……
call npm run app
if errorlevel 1 pause
exit /b

:corridor
echo 正在构建并打开走廊验证……
echo 操作：鼠标瞄准，按住左键探身射击，松开躲进掩体，右键放必杀，Esc 设置。
call npm run build
if errorlevel 1 (pause & exit /b)
call npx electron . --page=index.html?ep=corridor_test
exit /b

:jiggle
echo 正在构建并打开晃动技术验证……
call npm run build
if errorlevel 1 (pause & exit /b)
call npx electron . --page=jiggle.html
exit /b

:exe
echo 正在打包 exe（约 1 分钟）……
call npm run exe
echo.
echo 打包好了：release\TriggerPoem-win32-x64\TriggerPoem.exe
pause
exit /b

:save
set "MSG="
set /p "MSG=这次存档写个备注（可以直接回车）："
if not defined MSG set "MSG=手动存档"
git add -A
git commit -q -m "%MSG%"
if errorlevel 1 (echo 没有新的改动，不用存档。) else (echo 已存档。)
echo 正在同步到 GitHub……
git push -q origin main
if errorlevel 1 (echo GitHub 同步失败（可能没网），本地存档已保存，下次存档会一起补传。) else (echo GitHub 已同步。)
echo.
echo 最近的存档（想回到哪个，把前面的编号告诉 Claude）：
git log -10 --date=format:"%%m-%%d %%H:%%M" --format="  %%h  %%ad  %%s"
pause
exit /b

:backup
set "DEST=D:\trigger-poem-backup"
if not exist "%DEST%" mkdir "%DEST%"
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmm"') do set TS=%%i
git add -A
git commit -q -m "备份前自动存档" >nul 2>&1
git bundle create "%DEST%\trigger-poem_%TS%.bundle" --all
if errorlevel 1 (echo 备份失败，把这个窗口截图发给 Claude。) else (echo 已备份到 %DEST%\trigger-poem_%TS%.bundle)
echo 这一个文件就是全部存档历史；C 盘坏了也能从它完整恢复。旧的备份不会自动删。
pause
exit /b
