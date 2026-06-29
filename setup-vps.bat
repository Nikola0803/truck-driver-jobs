@echo off
title VPS Setup - TruckDriverJobs.co
cd /d "C:\Users\PC\Desktop\truck driver jobs"

echo.
echo  ============================================
echo    TruckDriverJobs.co ^> VPS Setup
echo  ============================================
echo.
echo  This will SSH into 72.62.97.74 and run
echo  the full setup automatically.
echo.
echo  When asked for password — type it and hit Enter.
echo  Then wait ~5 minutes for everything to install.
echo.
pause

echo.
echo  Connecting and running setup...
echo.

ssh -o StrictHostKeyChecking=no root@72.62.97.74 "bash -s" < scripts\setup-vps.sh

echo.
if %errorlevel% == 0 (
    echo  ============================================
    echo    SUCCESS - VPS is set up!
    echo    Check the output above for the 3 GitHub
    echo    secrets you need to add.
    echo  ============================================
) else (
    echo  ============================================
    echo    Something went wrong - check output above
    echo  ============================================
)
echo.
pause
