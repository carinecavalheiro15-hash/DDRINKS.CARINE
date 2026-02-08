# Script para mesclar PDFs - Design com Sistema DDrinks

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$baseDir = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $scriptPath))

$designPdf = Join-Path $baseDir "Design sem nome.pdf"
$outputPdf = Join-Path $baseDir "orcamento_completo_com_design.pdf"

# Procurar PDF do sistema
$systemPdf = $null
$candidates = @(
    (Join-Path $baseDir "orcamento_app_otimizado_v10.pdf"),
    (Join-Path $baseDir "orcamento_ddrinks_otimizado.pdf"),
    (Join-Path (Split-Path $baseDir) "orcamento_app_otimizado_v10.pdf"),
    (Join-Path (Split-Path $baseDir) "orcamento_ddrinks_otimizado.pdf")
)

foreach ($pdf in $candidates) {
    if (Test-Path $pdf) {
        $systemPdf = $pdf
        break
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "      MESCLADOR DE PDFs - DDrinks       " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar arquivos
if (-not (Test-Path $designPdf)) {
    Write-Host "[ERRO] Design PDF nao encontrado:" -ForegroundColor Red
    Write-Host "  $designPdf" -ForegroundColor Red
    exit 1
}

if (-not $systemPdf) {
    Write-Host "[ERRO] PDF do sistema nao encontrado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Procurados em:" -ForegroundColor Yellow
    foreach ($candidate in $candidates) {
        Write-Host "  - $candidate" -ForegroundColor Gray
    }
    exit 1
}

Write-Host "Design PDF: $(Split-Path $designPdf -Leaf)" -ForegroundColor Green
Write-Host "Sistema PDF: $(Split-Path $systemPdf -Leaf)" -ForegroundColor Green
Write-Host "Output: $(Split-Path $outputPdf -Leaf)" -ForegroundColor Green
Write-Host ""

# Tentar com GhostScript
Write-Host "Tentando mesclar com GhostScript..." -ForegroundColor Yellow

$gsPath = $null
@("gswin64c", "gswin32c", "gs") | ForEach-Object {
    if (-not $gsPath) {
        try {
            $version = & $_ --version 2>$null
            if ($version) {
                $gsPath = $_
            }
        } catch {}
    }
}

if ($gsPath) {
    Write-Host "GhostScript encontrado: $gsPath" -ForegroundColor Green
    
    try {
        & $gsPath -q -dNOPAUSE -dBATCH -dSAFER -sDEVICE=pdfwrite -sOutputFile="$outputPdf" "$designPdf" "$systemPdf"
        
        if ($LASTEXITCODE -eq 0) {
            $fileSize = (Get-Item $outputPdf).Length / 1MB
            Write-Host ""
            Write-Host "[OK] PDFs mesclados com sucesso!" -ForegroundColor Green
            Write-Host "Arquivo: $outputPdf" -ForegroundColor Green
            Write-Host "Tamanho: $([Math]::Round($fileSize, 2)) MB" -ForegroundColor Green
            Write-Host ""
            exit 0
        }
    } catch {
        Write-Host "Erro ao usar GhostScript: $_" -ForegroundColor Yellow
    }
}

# Tentar PDFtk
Write-Host "Tentando mesclar com PDFtk..." -ForegroundColor Yellow

try {
    pdftk "$designPdf" "$systemPdf" cat output "$outputPdf"
    
    if ($LASTEXITCODE -eq 0) {
        $fileSize = (Get-Item $outputPdf).Length / 1MB
        Write-Host ""
        Write-Host "[OK] PDFs mesclados com sucesso!" -ForegroundColor Green
        Write-Host "Arquivo: $outputPdf" -ForegroundColor Green
        Write-Host "Tamanho: $([Math]::Round($fileSize, 2)) MB" -ForegroundColor Green
        Write-Host ""
        exit 0
    }
} catch {
    Write-Host "PDFtk nao encontrado" -ForegroundColor Yellow
}

# Falha
Write-Host ""
Write-Host "[ERRO] Nao foi possivel mesclar os PDFs" -ForegroundColor Red
Write-Host ""
Write-Host "Para mesclar PDFs, instale uma dessas ferramentas:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. GhostScript (recomendado):" -ForegroundColor Cyan
Write-Host "   https://www.ghostscript.com/download/gsdnld.html" -ForegroundColor Gray
Write-Host ""
Write-Host "2. PDFtk:" -ForegroundColor Cyan
Write-Host "   https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Usar Adobe Acrobat/Reader:" -ForegroundColor Cyan
Write-Host "   Arquivo > Combinar > Mesclar arquivos" -ForegroundColor Gray
Write-Host ""

exit 1
