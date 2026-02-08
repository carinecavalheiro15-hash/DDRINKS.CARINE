# GUIA: Mesclando PDFs no Projeto DDrinks

## ✓ Status Atual

- ✅ Design PDF encontrado: `Design sem nome.pdf`
- ✅ PDF do Sistema encontrado: `orcamento_app_otimizado.pdf`
- ⚠️ Ferramentas de merge: NÃO INSTALADAS

## 🎯 Seu Objetivo

Mesclar o PDF de design com o PDF do orçamento do sistema DDrinks em um único arquivo:
- **Entrada 1**: Design sem nome.pdf
- **Entrada 2**: orcamento_app_otimizado.pdf  
- **Saída**: orcamento_completo_com_design.pdf

## 📋 Opções para Mesclar

### Opção 1: GhostScript (Recomendado - Gratuito)

**Vantagens**: Rápido, gratuito, confiável

**Instalação**:
1. Acesse: https://www.ghostscript.com/download/gsdnld.html
2. Baixe o instalador **gswin64-10.x.x.exe** (64-bit)
3. Execute e instale com as configurações padrão
4. Depois, execute o script PowerShell:

```powershell
cd c:\Users\ddrin\Downloads\ddrinks_project_app_final_v8_corrigido
.\merge-pdfs-v3.ps1
```

### Opção 2: Adobe Acrobat (Método Manual)

**Vantagens**: Livre de termos de serviço

**Passos**:
1. Abra o Design PDF no Adobe Reader ou Acrobat
2. Vá em: **Ferramentas > Combinar > Mesclar arquivos**
3. Clique em **Adicionar arquivo** e selecione `orcamento_app_otimizado.pdf`
4. Salve o resultado como `orcamento_completo_com_design.pdf`

### Opção 3: PDFtk (Alternativa)

**Instalação**:
1. Acesse: https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/
2. Baixe e instale
3. Use o script PowerShell após a instalação

## 🚀 Próximas Etapas

Recomendo:
1. **Instalar GhostScript** (5 minutos)
2. **Executar o script PowerShell** automaticamente

Após a instalação, abra PowerShell e execute:

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
cd c:\Users\ddrin\Downloads\ddrinks_project_app_final_v8_corrigido
.\merge-pdfs-v3.ps1
```

O script automaticamente:
- ✅ Encontrará os PDFs
- ✅ Mesclará na ordem correta (Design primeiro, depois Sistema)
- ✅ Salvará em `orcamento_completo_com_design.pdf`
- ✅ Confirmará o sucesso com tamanho do arquivo

## 📁 Localização dos Arquivos

```
c:\Users\ddrin\Downloads\ddrinks_project_app_final_v8_corrigido\
├── Design sem nome.pdf (INPUT)
├── orcamento_app_otimizado.pdf (INPUT)
├── orcamento_completo_com_design.pdf (OUTPUT - será criado)
└── merge-pdfs-v3.ps1 (SCRIPT)
```

## ❓ Dúvidas?

Se tiver problemas:
1. Verifique se os 2 PDFs de entrada existem
2. Tente instalar o GhostScript
3. Se ainda não funcionar, use o método manual (Opção 2)

---

**Criado**: 2026-02-08
**Status**: ✅ Script pronto para uso
