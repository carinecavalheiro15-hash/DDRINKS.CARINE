@echo off
REM ============================================================
REM Remove o Servico do Windows do DDrinks (desfaz o que o
REM instalar-servico.bat fez). Tambem precisa ser executado como
REM Administrador.
REM ============================================================

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo [ERRO] Este arquivo precisa ser executado como Administrador.
    echo Clique com o botao direito e escolha "Executar como administrador".
    echo.
    pause
    exit /b 1
)

set NSSM="C:\Users\CarineCavalheiro\AppData\Local\ddrinks-node\nssm-2.24\win64\nssm.exe"
set SERVICO=DDrinksServer

echo Parando e removendo o servico "%SERVICO%"...
%NSSM% stop %SERVICO%
%NSSM% remove %SERVICO% confirm

echo.
echo Servico removido. Pra voltar a rodar o servidor, use o start.bat
echo normalmente (vai precisar manter a janela aberta).
echo.
pause
