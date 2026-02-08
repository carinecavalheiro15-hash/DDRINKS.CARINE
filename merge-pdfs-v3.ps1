# Script para mesclar PDFs usando .NET
# Sem dependências externas - usa apenas PowerShell e .NET

Add-Type -AssemblyName System.Drawing

$designPdfPath = "c:\Users\ddrin\Downloads\ddrinks_project_app_final_v8_corrigido\Design sem nome.pdf"

# Encontrar um PDF do sistema
$systemPdfPath = (Get-ChildItem "c:\Users\ddrin\Downloads\ddrinks_project_app_final_v8_corrigido\" -Recurse -Filter "orcamento_*.pdf" | Select-Object -First 1).FullName

$outputPdfPath = "c:\Users\ddrin\Downloads\ddrinks_project_app_final_v8_corrigido\orcamento_completo_com_design.pdf"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "      MESCLADOR DE PDFs - DDrinks       " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar arquivos
if (-not (Test-Path $designPdfPath)) {
    Write-Host "[ERRO] Design PDF nao encontrado" -ForegroundColor Red
    exit 1
}

if (-not $systemPdfPath) {
    Write-Host "[ERRO] PDF do sistema nao encontrado" -ForegroundColor Red
    exit 1
}

Write-Host "Design PDF: $(Split-Path $designPdfPath -Leaf)" -ForegroundColor Green
Write-Host "Sistema PDF: $(Split-Path $systemPdfPath -Leaf)" -ForegroundColor Green
Write-Host ""

# Tentar mesclar com Adobe Acrobat (COM)
Write-Host "Buscando Adobe Acrobat..." -ForegroundColor Yellow

try {
    $acrobat = New-Object -ComObject AcroExch.App -ErrorAction Stop
    Write-Host "Adobe Acrobat encontrado!" -ForegroundColor Green
    
    # Abrir primeiro PDF
    $pdDoc = $acrobat.NewPDF()
    $pdDoc.Open([System.IO.Path]::GetFullPath($designPdfPath))
    
    # Inserir segundo PDF no final
    $pdDoc.InsertPages(-1, [System.IO.Path]::GetFullPath($systemPdfPath), 1, -1, $false)
    
    # Salvar mesclado
    $pdDoc.Save(1, [System.IO.Path]::GetFullPath($outputPdfPath))
    $pdDoc.Close()
    $acrobat.Quit()
    
    Write-Host ""
    Write-Host "[OK] PDFs mesclados com sucesso!" -ForegroundColor Green
    Write-Host "Arquivo: $outputPdfPath" -ForegroundColor Green
    
    $fileSize = (Get-Item $outputPdfPath).Length / 1MB
    Write-Host "Tamanho: $([Math]::Round($fileSize, 2)) MB" -ForegroundColor Green
    Write-Host ""
    exit 0
    
} catch {
    Write-Host "Adobe Acrobat nao disponivel ou erro: $($_)" -ForegroundColor Yellow
}

# Tentar com GhostScript
Write-Host "Buscando GhostScript..." -ForegroundColor Yellow

$gsPath = $null
@("gswin64c", "gswin32c", "gs") | ForEach-Object {
    try {
        $test = & $_ --version 2>&1
        if ($test) {
            $gsPath = $_
            Write-Host "GhostScript encontrado: $_" -ForegroundColor Green
        }
    } catch {}
}

if ($gsPath) {
    try {
        & $gsPath -q -dNOPAUSE -dBATCH -dSAFER -sDEVICE=pdfwrite -sOutputFile="$outputPdfPath" "$designPdfPath" "$systemPdfPath" 2>&1 | Out-Null
        
        if (Test-Path $outputPdfPath) {
            Write-Host ""
            Write-Host "[OK] PDFs mesclados com sucesso!" -ForegroundColor Green
            Write-Host "Arquivo: $outputPdfPath" -ForegroundColor Green
            
            $fileSize = (Get-Item $outputPdfPath).Length / 1MB
            Write-Host "Tamanho: $([Math]::Round($fileSize, 2)) MB" -ForegroundColor Green
            Write-Host ""
            exit 0
        }
    } catch {
        Write-Host "Erro ao usar GhostScript: $($_)" -ForegroundColor Yellow
    }
}

# PDFtk
Write-Host "Buscando PDFtk..." -ForegroundColor Yellow

try {
    pdftk "$designPdfPath" "$systemPdfPath" cat output "$outputPdfPath" 2>&1 | Out-Null
    
    if (Test-Path $outputPdfPath) {
        Write-Host ""
        Write-Host "[OK] PDFs mesclados com sucesso!" -ForegroundColor Green
        Write-Host "Arquivo: $outputPdfPath" -ForegroundColor Green
        
        $fileSize = (Get-Item $outputPdfPath).Length / 1MB
        Write-Host "Tamanho: $([Math]::Round($fileSize, 2)) MB" -ForegroundColor Green
        Write-Host ""
        exit 0
    }
} catch {
    Write-Host "PDFtk nao encontrado" -ForegroundColor Yellow
}

# Nenhuma ferramenta disponível
Write-Host ""
Write-Host "[ERRO] Nao foi possivel mesclar os PDFs" -ForegroundColor Red
Write-Host ""
Write-Host "Nenhuma ferramenta de merge foi detectada." -ForegroundColor Yellow
Write-Host ""
Write-Host "Opcoes de instalacao:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Instalar GhostScript (recomendado, gratuito):" -ForegroundColor Cyan
Write-Host "   https://www.ghostscript.com/download/gsdnld.html" -ForegroundColor Gray
Write-Host "   Escolha o instalador de 64-bit para Windows" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Usar Adobe Acrobat Reader (gratuito com funcoes basicas):" -ForegroundColor Cyan
Write-Host "   https://get.adobe.com/pt_pt/reader/" -ForegroundColor Gray
Write-Host ""
Write-Host "3. PDFtk (gratuito):" -ForegroundColor Cyan
Write-Host "   https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/" -ForegroundColor Gray
Write-Host ""
Write-Host "Apos instalar, execute este script novamente." -ForegroundColor Yellow
Write-Host ""

exit 1
