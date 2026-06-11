# Script para mesclar PDFs - Design com Sistema DDrinks
# Procura arquivos nas pastas corretas

# Encontrar o Design PDF
$designPdf = "c:\Users\ddrin\Downloads\ddrinks_project_app_final_v8_corrigido\Design sem nome.pdf"

# Encontrar PDF do sistema
$baseDir = "c:\Users\ddrin\Downloads\ddrinks_project_app_final_v8_corrigido"
$systemPdf = $null

# Procurar em diferentes locais
$candidates = @(
    "$baseDir\orcamento_app_otimizado_v10.pdf",
    "$baseDir\orcamento_ddrinks_otimizado.pdf",
    "$baseDir\ddrinks_project\orcamento_app_otimizado_v10.pdf",
    "$baseDir\ddrinks_project\orcamento_ddrinks_otimizado.pdf",
    "$baseDir\ddrinks_project\ddrinks_project_app_final_v8\orcamento_app_otimizado_v10.pdf",
    "$baseDir\ddrinks_project\ddrinks_project_app_final_v8\orcamento_ddrinks_otimizado.pdf",
    (Get-ChildItem "$baseDir" -Recurse -Filter "orcamento_*.pdf" -ErrorAction SilentlyContinue | Select-Object -First 1).FullName
)

foreach ($pdf in $candidates) {
    if ($pdf -and (Test-Path $pdf)) {
        $systemPdf = $pdf
        break
    }
}

$outputPdf = "$baseDir\orcamento_completo_com_design.pdf"

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
    Write-Host "Procurados:" -ForegroundColor Yellow
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
                Write-Host "GhostScript encontrado: $gsPath" -ForegroundColor Green
            }
        } catch {}
    }
}

if ($gsPath) {
    try {
        & $gsPath -q -dNOPAUSE -dBATCH -dSAFER -sDEVICE=pdfwrite -sOutputFile="$outputPdf" "$designPdf" "$systemPdf"
        
        if ($LASTEXITCODE -eq 0) {
            if (Test-Path $outputPdf) {
                $fileSize = (Get-Item $outputPdf).Length / 1MB
                Write-Host ""
                Write-Host "[OK] PDFs mesclados com sucesso!" -ForegroundColor Green
                Write-Host "Arquivo: $outputPdf" -ForegroundColor Green
                Write-Host "Tamanho: $([Math]::Round($fileSize, 2)) MB" -ForegroundColor Green
                Write-Host ""
                exit 0
            }
        }
    } catch {
        Write-Host "Erro ao usar GhostScript: $($_)" -ForegroundColor Yellow
    }
}

# Tentar PDFtk
Write-Host "Tentando mesclar com PDFtk..." -ForegroundColor Yellow

try {
    pdftk "$designPdf" "$systemPdf" cat output "$outputPdf"
    
    if ($LASTEXITCODE -eq 0 -and (Test-Path $outputPdf)) {
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
Write-Host "3. Usar Adobe Acrobat/Reader (manual):" -ForegroundColor Cyan
Write-Host "   Arquivo > Combinar > Mesclar arquivos" -ForegroundColor Gray
Write-Host ""

exit 1
