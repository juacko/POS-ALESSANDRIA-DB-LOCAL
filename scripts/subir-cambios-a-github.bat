@echo off
chcp 65001 > nul
title Alessandria POS - Subir Cambios a GitHub
echo ========================================================
echo       GUARDAR Y SUBIR AVANCES DE LA HELADERIA A GITHUB
echo ========================================================
echo.

cd /d "%~dp0\.."

set /p MSG="Escribe una breve descripcion del cambio realizado (o presiona Enter para usar mensaje por defecto): "

if "%MSG%"=="" (
    set MSG="feat: ajustes y pruebas realizadas desde la heladeria"
)

echo.
echo [1/3] Preparando archivos modificados...
git add .

echo.
echo [2/3] Creando commit: %MSG%
git commit -m %MSG%

echo.
echo [3/3] Subiendo cambios a GitHub...
git push origin main

echo.
if %errorLevel% equ 0 (
    echo [EXITO] Los cambios se subieron correctamente a GitHub.
    echo Ya puedes continuar trabajando desde tu Mac o laptop.
) else (
    echo [ATENCION] Hubo un error al subir los cambios.
    echo Asegurate de tener conexion a internet y permisos de Git.
)

echo.
pause
