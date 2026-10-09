@echo off
set "PATH=C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\mingit\cmd;%PATH%"
cd /d "%~dp0"
echo ========================================================
echo   Pushing QuickSync repository to GitHub...
echo ========================================================
git push -u origin main
echo.
echo If GitHub asked for your credentials and completed successfully,
echo your repository is now live at:
echo https://github.com/gokuldhasgovardhanan-crypto/QuickSync
echo.
pause
