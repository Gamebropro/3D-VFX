@echo off
title VFX Particle Studio - Production Builder
echo ===================================================
echo   VFX Particle Studio Production Builder (Tauri)
echo ===================================================
echo.

echo [1/2] Configuring environment paths...
:: Add Cargo to local PATH just in case terminal has not refreshed
set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"

:: Verify Rust is accessible
where cargo >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Rust / Cargo toolchain is not found.
    echo Please make sure Rust is installed and configured.
    pause
    exit /b 1
)

echo [2/2] Running Tauri Production Build...
echo.
call npx tauri build

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Production build failed.
    pause
    exit /b 1
)

echo.
echo ===================================================
echo   Build Successful!
echo   Installer has been generated under:
echo   src-tauri\target\release\bundle\nsis\
echo ===================================================
echo.
pause
