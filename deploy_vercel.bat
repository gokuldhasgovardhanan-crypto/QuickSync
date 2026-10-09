@echo off
set "PATH=C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\nodejs;%PATH%"
cd /d "%~dp0frontend"
echo ===================================================
echo   Deploying QuickSync to Vercel...
echo ===================================================
call npm run build
call vercel --prod
pause
