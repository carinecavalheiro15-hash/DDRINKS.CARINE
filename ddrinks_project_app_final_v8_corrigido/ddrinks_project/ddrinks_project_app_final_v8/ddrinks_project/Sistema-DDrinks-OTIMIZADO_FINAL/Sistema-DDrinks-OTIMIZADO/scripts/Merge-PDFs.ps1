#Requires -Version 5.0
<#
    Script para mesclar o PDF do Design com o PDF do Sistema DDrinks
    Usa biblioteca .NET para mesclar PDFs
    
    Requisitos: A DLL iTextSharp ou similar (ou instalar via NuGet)
#>

param(
    [string]$DesignPdf = $null,
    [string]$SystemPdf = $null,
    [string]$OutputPdf = $null
)

function Merge-PDFs {
    param(
        [string]$InputPdf1,
        [string]$InputPdf2,
        [string]$OutputPdfPath
    )
    
    try {
        # Verificar se os arquivos existem
        if (-not (Test-Path $InputPdf1)) {
            Write-Host "❌ Erro: Arquivo não encontrado: $InputPdf1" -ForegroundColor Red
            return $false
        }
        
        if (-not (Test-Path $InputPdf2)) {
            Write-Host "❌ Erro: Arquivo não encontrado: $InputPdf2" -ForegroundColor Red
            return $false
        }
        
        Write-Host "📄 Adicionando Design: $(Split-Path $InputPdf1 -Leaf)" -ForegroundColor Cyan
        Write-Host "📄 Adicionando Sistema: $(Split-Path $InputPdf2 -Leaf)" -ForegroundColor Cyan
        Write-Host "⏳ Mesclando PDFs..." -ForegroundColor Yellow
        
        # Tentar com COM do Acrobat (se disponível)
        try {
            $acrobat = New-Object -ComObject AcroExch.App
            
            if ($acrobat) {
                Write-Host "✓ Adobe Acrobat detectado" -ForegroundColor Green
                
                # Abrir primeiro PDF
                $pdDoc = $acrobat.NewPDF()
                $pdDoc.Open([System.IO.Path]::GetFullPath($InputPdf1))
                
                # Inserir segundo PDF
                $pdDoc.InsertPages(0, [System.IO.Path]::GetFullPath($InputPdf2), 1, -1, $true)
                
                # Salvar
                $pdDoc.Save(1, [System.IO.Path]::GetFullPath($OutputPdfPath))
                $pdDoc.Close()
                $acrobat.Exit()
                
                Write-Host "✓ PDFs mesclados com sucesso!" -ForegroundColor Green
                Write-Host "📁 Arquivo: $OutputPdfPath" -ForegroundColor Green
                
                # Mostrar tamanho
                $fileSize = (Get-Item $OutputPdfPath).Length / 1MB
                Write-Host "💾 Tamanho: $([Math]::Round($fileSize, 2)) MB" -ForegroundColor Green
                
                return $true
            }
        } catch {
            Write-Host "⚠️  Adobe Acrobat não disponível, tentando alternativa..." -ForegroundColor Yellow
        }
        
        # Alternativa: Usar PowerShell .NET para manipular PDFs
        Write-Host "⚠️  Para mesclar PDFs, instale uma das opções:" -ForegroundColor Yellow
        Write-Host "   1. Adobe Acrobat (Recomendado)" -ForegroundColor Gray
        Write-Host "   2. GhostScript: https://www.ghostscript.com/download/gsdnld.html" -ForegroundColor Gray
        Write-Host "   3. PDFtk: https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/" -ForegroundColor Gray
        
        return $false
        
    } catch {
        Write-Host "❌ Erro ao mesclar PDFs: $_" -ForegroundColor Red
        return $false
    }
}

# Definir caminhos padrão
if (-not $DesignPdf) {
    $baseDir = Split-Path $MyInvocation.MyCommand.Path -Parent
    $baseDir = Split-Path $baseDir -Parent
    $DesignPdf = Join-Path $baseDir "Design sem nome.pdf"
}

if (-not $SystemPdf) {
    $baseDir = Split-Path $MyInvocation.MyCommand.Path -Parent
    $baseDir = Split-Path $baseDir -Parent
    
    # Procurar pelos PDFs do sistema
    $candidates = @(
        (Join-Path $baseDir "orcamento_app_otimizado_v10.pdf"),
        (Join-Path $baseDir "orcamento_ddrinks_otimizado.pdf")
    )
    
    foreach ($pdf in $candidates) {
        if (Test-Path $pdf) {
            $SystemPdf = $pdf
            break
        }
    }
}

if (-not $OutputPdf) {
    $baseDir = Split-Path $MyInvocation.MyCommand.Path -Parent
    $baseDir = Split-Path $baseDir -Parent
    $OutputPdf = Join-Path $baseDir "orcamento_completo_com_design.pdf"
}

# Executar merge
$result = Merge-PDFs -InputPdf1 $DesignPdf -InputPdf2 $SystemPdf -OutputPdfPath $OutputPdf

if ($result) {
    Write-Host "`n✓ Processo concluído!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n❌ Falha no processo de merge" -ForegroundColor Red
    exit 1
}
