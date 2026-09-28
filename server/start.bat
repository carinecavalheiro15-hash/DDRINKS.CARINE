@echo off
setlocal
set NODE_DIR=C:\Users\CarineCavalheiro\AppData\Local\ddrinks-node\node-v22.14.0-win-x64
set PATH=%NODE_DIR%;%PATH%
cd /d "%~dp0"

if not exist node_modules (
    echo Instalando dependencias, so na primeira vez...
    call "%NODE_DIR%\npm.cmd" install
)

echo.
echo Iniciando servidor do DDrinks...
echo.
call "%NODE_DIR%\node.exe" server.js

pause
