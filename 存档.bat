@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "MSG="
set /p "MSG=这次存档写个备注（可以直接回车）："
if not defined MSG set "MSG=手动存档"
git add -A
git commit -q -m "%MSG%"
if errorlevel 1 (echo 没有新的改动，不用存档。) else (echo 已存档。)
echo.
echo 最近的存档（想回到哪个，把前面的编号告诉 Claude）：
git log -10 --date=format:"%%m-%%d %%H:%%M" --format="  %%h  %%ad  %%s"
pause
