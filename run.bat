@echo off
title VFX Particle Studio - Launcher
echo ===================================================
echo   VFX Particle Studio Launcher (Tauri + Three.js)
echo ===================================================
echo.

echo [1/3] Configuring environment paths...
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

echo [2/3] Checking npm dependencies...
if not exist node_modules (
    echo node_modules not found. Executing npm install...
    call npm install
)

echo [3/3] Launching Tauri Desktop Dev Server...
echo.
call npm run tauri dev

if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Dev server exited with an error code.
    pause
)
