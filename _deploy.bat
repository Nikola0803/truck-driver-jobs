@echo off
cd /d "C:\Users\PC\Desktop\truck driver jobs"
echo Adding all changes...
git add -A
echo.
git status
echo.
echo Committing...
git commit -m "feat: SEO-friendly job URLs with title+company slugs"
echo.
echo Pushing to GitHub...
git push origin main
echo.
echo Done! Check GitHub Actions for deploy status.
pause
