@echo off
set "PATH=C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\mingit\cmd;%PATH%"
cd /d "%~dp0"
echo ========================================================
echo   Pushing QuickSync repository to GitHub...
echo ========================================================
echo.
echo Note: GitHub requires a Personal Access Token (starts with ghp_...).
echo If you need one, create it here with 'repo' checked:
echo https://github.com/settings/tokens/new
echo.
set /p TOKEN="Enter your GitHub Token (or press ENTER if already authenticated): "

if "%TOKEN%"=="" (
    git push -u origin main
) else (
    git push https://%TOKEN%@github.com/gokuldhasgovardhanan-crypto/QuickSync.git main
)

echo.
echo ========================================================
echo Check your repository:
echo https://github.com/gokuldhasgovardhanan-crypto/QuickSync
echo ========================================================
pause
