@echo off
title Push TruckDriverJobs to GitHub
cd /d "C:\Users\PC\Desktop\truck driver jobs"

echo.
echo  ============================================
echo    TruckDriverJobs.co ^> GitHub Push
echo  ============================================
echo.

:: Init git if needed
if not exist ".git" (
    echo  Initializing git repository...
    git init
    git branch -M main
    echo.
)

:: Set remote
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo  Adding GitHub remote...
    git remote add origin https://github.com/Nikola0803/truck-driver-jobs.git
    echo.
) else (
    git remote set-url origin https://github.com/Nikola0803/truck-driver-jobs.git
)

:: Stage everything
git add -A

:: Commit if there are changes
git diff --cached --quiet
if %errorlevel% == 0 (
    echo  No new changes - pushing existing commits...
    echo.
) else (
    set TIMESTAMP=%date:~6,4%-%date:~3,2%-%date:~0,2% %time:~0,5%
    git commit -m "Update %TIMESTAMP%"
    echo.
)

:: Push
echo  Pushing to github.com/Nikola0803/truck-driver-jobs ...
echo.
git push -u origin main --force

echo.
if %errorlevel% == 0 (
    echo  ============================================
    echo    SUCCESS - code is on GitHub!
    echo  ============================================
    echo.
    echo  Next: SSH into your VPS and run setup-vps.sh
) else (
    echo  ============================================
    echo    Error - check output above.
    echo  ============================================
)
echo.
pause
