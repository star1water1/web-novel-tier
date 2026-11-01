@echo off
rem Double-click: build and sign the app, then open the folder with the APK. No phone needed.
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\build-signed.ps1" -OpenFolder
echo.
pause
