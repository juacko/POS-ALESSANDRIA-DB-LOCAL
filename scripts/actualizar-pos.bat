@echo off
chcp 65001 > nul
title Alessandria POS - Actualizar Sistema desde GitHub
echo ========================================================
echo       ALESSANDRIA POS - ACTUALIZAR SISTEMA
echo ========================================================
echo.

cd /d "%~dp0\.."

echo [1/4] Comprobando conexion y descargando actualizaciones desde GitHub...
git pull origin main

if %errorLevel% neq 0 (
    echo.
    echo [ADVERTENCIA] No se pudieron descargar las actualizaciones.
    echo Posibles causas:
    echo  1. No hay conexion a Internet en este momento.
    echo  2. Tienes cambios locales sin guardar en esta maquina.
    echo     ^(Si hiciste cambios locales, ejecuta primero 'scripts\subir-cambios-a-github.bat'^)
    echo.
    pause
    exit /b %errorLevel%
)

echo.
echo [2/4] Verificando paquetes y dependencias (npm install)...
call npm install --ignore-scripts

echo.
echo [3/4] Enlazando modulos nativos de Electron (better-sqlite3)...
call npm run rebuild

echo.
echo [4/4] Verificando integridad de TypeScript y componentes...
call npx vue-tsc --noEmit

if %errorLevel% equ 0 (
    echo.
    echo ========================================================
    echo  [EXITO] Sistema actualizado y verificado al 100%%.
    echo  Todo listo para operar en la heladeria.
    echo ========================================================
) else (
    echo.
    echo [AVISO] Se descargaron los cambios pero hubo advertencias de tipado.
)

echo.
pause
