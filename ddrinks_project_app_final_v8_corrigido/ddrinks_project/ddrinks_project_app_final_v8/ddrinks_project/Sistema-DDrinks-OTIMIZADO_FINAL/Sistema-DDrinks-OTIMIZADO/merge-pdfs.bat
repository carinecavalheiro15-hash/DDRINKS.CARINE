@echo off
REM Script simples para mesclar PDFs
REM Verifica qual ferramenta esta disponivel e usa

setlocal enabledelayedexpansion

REM Definir caminhos
set "BASE_DIR=%~dp0..\.."
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
    echo.
    echo Erro: Design PDF nao encontrado em: %DESIGN_PDF%
    echo.
    pause
    exit /b 1
)

if not exist "%SYSTEM_PDF%" (
    echo.
    echo Erro: Nenhum PDF do sistema encontrado
    echo Procurados em:
    echo  - %BASE_DIR%\orcamento_app_otimizado_v10.pdf
    echo  - %BASE_DIR%\orcamento_ddrinks_otimizado.pdf
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo        MESCLADOR DE PDFs - DDrinks
echo ============================================
echo.
echo Design PDF: %DESIGN_PDF%
echo Sistema PDF: %SYSTEM_PDF%
echo Output PDF: %OUTPUT_PDF%
echo.

REM Tentar usar GhostScript
gswin64c -q -dNOPAUSE -dBATCH -dSAFER -sDEVICE=pdfwrite -sOutputFile="%OUTPUT_PDF%" "%DESIGN_PDF%" "%SYSTEM_PDF%" 2>nul

if %errorlevel% == 0 (
    echo.
    echo [OK] PDFs mesclados com sucesso!
    echo [OK] Arquivo salvo em: %OUTPUT_PDF%
    echo.
    pause
    exit /b 0
)

REM Se GhostScript falhou, tentar PDFtk
pdftk "%DESIGN_PDF%" "%SYSTEM_PDF%" cat output "%OUTPUT_PDF%" 2>nul

if %errorlevel% == 0 (
    echo.
    echo [OK] PDFs mesclados com sucesso!
    echo [OK] Arquivo salvo em: %OUTPUT_PDF%
    echo.
    pause
    exit /b 0
)

REM Se tudo falhou
echo.
echo [ERRO] Nao foi possivel mesclar os PDFs
echo.
echo Solucoes disponiveis:
echo.
echo 1. Instalar GhostScript (recomendado):
echo    https://www.ghostscript.com/download/gsdnld.html
echo.
echo 2. Instalar PDFtk:
echo    https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/
echo.
echo 3. Usar Adobe Acrobat ou Leitor Adobe Acrobat DC
echo    Para mesclar: Arquivo > Combinar > Mesclar arquivos
echo.
pause
exit /b 1
