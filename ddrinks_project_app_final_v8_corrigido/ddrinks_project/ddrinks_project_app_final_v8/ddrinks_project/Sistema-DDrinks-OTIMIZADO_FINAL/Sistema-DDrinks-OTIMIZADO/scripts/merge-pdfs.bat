@echo off
REM Script para mesclar PDFs usando GhostScript
REM Este script mescla o Design PDF com o PDF do sistema

setlocal enabledelayedexpansion

REM Definir caminhos
set "BASE_DIR=%~dp0.."
set "DESIGN_PDF=%BASE_DIR%\Design sem nome.pdf"
set "OUTPUT_PDF=%BASE_DIR%\orcamento_completo_com_design.pdf"

REM Procurar pelos PDFs do sistema
set "SYSTEM_PDF="
if exist "%BASE_DIR%\orcamento_app_otimizado_v10.pdf" (
    set "SYSTEM_PDF=%BASE_DIR%\orcamento_app_otimizado_v10.pdf"
) else if exist "%BASE_DIR%\orcamento_ddrinks_otimizado.pdf" (
    set "SYSTEM_PDF=%BASE_DIR%\orcamento_ddrinks_otimizado.pdf"
)

REM Verificar se os arquivos existem
if not exist "%DESIGN_PDF%" (
    echo Erro: Design PDF nao encontrado em: %DESIGN_PDF%
    pause
    exit /b 1
)

if not exist "%SYSTEM_PDF%" (
    echo Erro: Nenhum PDF do sistema encontrado
    pause
    exit /b 1
)

REM Tentar usar GhostScript
where gswin64c >nul 2>&1
if %errorlevel% == 0 (
    echo Mesclando PDFs com GhostScript...
    gswin64c -q -dNOPAUSE -dBATCH -dSAFER -sDEVICE=pdfwrite -sOutputFile="%OUTPUT_PDF%" "%DESIGN_PDF%" "%SYSTEM_PDF%"
    
    if %errorlevel% == 0 (
        echo.
        echo PDFs mesclados com sucesso!
        echo Arquivo: %OUTPUT_PDF%
        pause
        exit /b 0
    ) else (
        echo Erro ao mesclar PDFs
        pause
        exit /b 1
    )
) else (
    echo GhostScript nao foi encontrado
    echo Para mesclar PDFs, instale o GhostScript:
    echo https://www.ghostscript.com/download/gsdnld.html
    pause
    exit /b 1
)
