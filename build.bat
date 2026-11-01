@echo off
rem Double-click: build and sign the app. Installs it if a phone is connected, otherwise opens the APK folder.
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\build-signed.ps1" -Auto
echo.
pause
