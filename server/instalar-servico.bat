@echo off
REM ============================================================
REM Instala o servidor do DDrinks como um Servico do Windows.
REM Depois disso, ele inicia sozinho com o Windows e fica rodando
REM em segundo plano (sem janela aberta) -- nao precisa mais abrir
REM o start.bat manualmente.
REM
REM IMPORTANTE: clique com o botao direito neste arquivo e escolha
REM "Executar como administrador". Rodando sem ser administrador,
REM a instalacao falha.
REM ============================================================

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo [ERRO] Este arquivo precisa ser executado como Administrador.
    echo Clique com o botao direito em "instalar-servico.bat" e escolha
    echo "Executar como administrador".
    echo.
    pause
    exit /b 1
)

set NSSM="C:\Users\CarineCavalheiro\AppData\Local\ddrinks-node\nssm-2.24\win64\nssm.exe"
set NODE="C:\Users\CarineCavalheiro\AppData\Local\ddrinks-node\node-v22.14.0-win-x64\node.exe"
set APPDIR=%~dp0
set SERVICO=DDrinksServer

echo Instalando o servico "%SERVICO%"...
%NSSM% install %SERVICO% %NODE% "server.js"
%NSSM% set %SERVICO% AppDirectory "%APPDIR%"
%NSSM% set %SERVICO% DisplayName "DDrinks - Servidor Local (MySQL)"
%NSSM% set %SERVICO% Description "Conecta o app DDrinks ao banco MySQL local. Inicia automaticamente com o Windows."
%NSSM% set %SERVICO% Start SERVICE_AUTO_START
%NSSM% set %SERVICO% AppStdout "%APPDIR%service-out.log"
%NSSM% set %SERVICO% AppStderr "%APPDIR%service-err.log"
%NSSM% set %SERVICO% AppRotateFiles 1
%NSSM% set %SERVICO% AppExit Default Restart

echo.
echo Iniciando o servico...
%NSSM% start %SERVICO%

echo.
echo ============================================================
echo Pronto! O servidor do DDrinks agora roda em segundo plano e
echo inicia sozinho sempre que o Windows ligar. Voce nao precisa
echo mais abrir o start.bat manualmente.
echo ============================================================
echo.
pause
