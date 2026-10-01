@echo off
chcp 65001 > nul
title Habilitar Firewall - Alessandria POS
echo ========================================================
echo   CONFIGURANDO FIREWALL DE WINDOWS PARA COMANDERA MOVIL
echo ========================================================
echo.
echo Este script abrira el puerto 3000 para que los celulares
echo de los meseros puedan conectarse a la comandera via Wi-Fi.
echo.
echo Solicitando permisos de Administrador...

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [AVISO] Por favor ejecuta este archivo haciendo:
    echo Click derecho ^> 'Ejecutar como administrador'
    echo.
    pause
    exit /b 1
)

echo Agregando regla al Firewall de Windows (TCP Puerto 3000)...
netsh advfirewall firewall delete rule name="Alessandria POS Servidor Movil" >nul 2>&1
netsh advfirewall firewall add rule name="Alessandria POS Servidor Movil" dir=in action=allow protocol=TCP localport=3000 profile=any

echo.
echo [OK] Regla creada exitosamente. El puerto 3000 ya esta disponible en la red local.
echo.
pause
