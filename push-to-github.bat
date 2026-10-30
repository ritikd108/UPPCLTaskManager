@echo off
title Push Task & Requirement Portal to GitHub
color 0b

echo ========================================================
echo    Task & Requirement Portal - GitHub Uploader
echo ========================================================
echo.

cd /d "%~dp0"

echo Enter your GitHub Repository URL (or press Enter if already configured):
echo Example: https://github.com/your-username/task-requirement-portal.git
set /p REPO_URL="Repository URL: "

if not "%REPO_URL%"=="" (
    git remote remove origin 2>nul
    git remote add origin %REPO_URL%
    echo Remote 'origin' set to: %REPO_URL%
)

echo.
echo Pushing code to GitHub 'main' branch...
echo (A GitHub browser sign-in prompt will appear if not already signed in)
echo.

git branch -M main
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   SUCCESS! All files uploaded to GitHub successfully!
    echo ========================================================
) else (
    echo.
    echo [!] Push failed. Please check your repository URL and permissions.
)

echo.
pause
