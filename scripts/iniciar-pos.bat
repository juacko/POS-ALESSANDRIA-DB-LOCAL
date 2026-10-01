@echo off
chcp 65001 > nul
title Alessandria POS - Heladeria & Cafeteria
echo ========================================================
echo       ALESSANDRIA POS - INICIANDO SISTEMA
echo ========================================================
echo.

cd /d "%~dp0\.."

echo [1/3] Verificando actualizaciones desde GitHub...
git pull --rebase origin main

echo.
echo [2/3] Verificando modulos y dependencias...
if not exist "node_modules" (
    echo Instalando paquetes por primera vez...
    call npm install --ignore-scripts
    call npm run rebuild
)

echo.
echo [3/3] Iniciando aplicacion POS y Servidor de Comandera...
call npm run dev

pause
