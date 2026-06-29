@echo off
title VPS Setup - TruckDriverJobs.co
cd /d "C:\Users\PC\Desktop\truck driver jobs"

echo.
echo  ============================================
echo    TruckDriverJobs.co ^> VPS Setup
echo  ============================================
echo.
echo  STEP 1 of 3 — make sure you've already:
echo    [x] Created the repo on github.com/new
echo    [x] Run push-to-github.bat successfully
echo.
echo  STEP 2 of 3 — enter your VPS IP below
echo.
set /p VPS_IP="  VPS IP address: "

echo.
echo  ============================================
echo  STEP 3 of 3 — copy the command below,
echo  then SSH into your VPS and paste it.
echo  ============================================
echo.
echo  SSH command to connect to your VPS:
echo.
echo    ssh root@%VPS_IP%
echo.
echo  Once connected, paste this ONE command:
echo.
echo    bash ^<^(curl -fsSL https://raw.githubusercontent.com/Nikola0803/truck-driver-jobs/main/scripts/setup-vps.sh^)
echo.
echo  It will install everything and at the end
echo  print 3 secrets to add to GitHub.
echo.
echo  ============================================
echo  Opening SSH connection now...
echo  ============================================
echo.

:: Copy the setup command to clipboard so they can paste it
echo bash ^<^(curl -fsSL https://raw.githubusercontent.com/Nikola0803/truck-driver-jobs/main/scripts/setup-vps.sh^) | clip
echo  [Clipboard] Setup command copied to clipboard - just paste it after connecting!
echo.

:: Try to open SSH (works if OpenSSH is installed, which it is on Windows 10/11)
start cmd /k "ssh root@%VPS_IP%"

echo.
pause
