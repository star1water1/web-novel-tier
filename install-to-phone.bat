@echo off
rem Double-click: build the app, sign it, and install it on the connected phone.
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\build-signed.ps1" -Install
echo.
pause
