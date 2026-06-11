#!/usr/bin/env python3
"""
Script para instalar dependências necessárias para geração de PDF com merge
Executa uma única vez para preparar o ambiente
"""

import subprocess
import sys
import os

def install_dependencies():
    """Instala as bibliotecas necessárias"""
    
    print("=" * 60)
    print("  INSTALADOR DE DEPENDÊNCIAS - DDRINKS PDF")
    print("=" * 60)
    print()
    
    dependencies = {
        'PyPDF2': 'Necessário para mesclar PDFs (Design + Orçamento)',
        'weasyprint': 'Necessário para gerar PDFs (já deve estar instalado)',
    }
    
    for package, description in dependencies.items():
        print(f"📦 {package}: {description}")
    
    print()
    print("Instalando dependências...")
    print()
    
    # Tentar instalar PyPDF2
    try:
        import PyPDF2
        print(f"✓ PyPDF2 já está instalado")
    except ImportError:
        print(f"⏳ Instalando PyPDF2...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "PyPDF2", "-q"])
            print(f"✓ PyPDF2 instalado com sucesso")
        except Exception as e:
            print(f"❌ Erro ao instalar PyPDF2: {e}")
            print(f"   Tente instalar manualmente: pip install PyPDF2")
    
    # Verificar WeasyPrint
    try:
        import weasyprint
        print(f"✓ WeasyPrint já está instalado")
    except ImportError:
        print(f"⚠️  WeasyPrint não está instalado (necessário para gerar PDFs)")
        print(f"   Tente instalar manualmente: pip install weasyprint")
    
    print()
    print("=" * 60)
    print("  ✓ Setup concluído!")
    print("=" * 60)
    print()
    print("Agora você pode gerar PDFs com Design automaticamente incluído.")
    print()

if __name__ == "__main__":
    install_dependencies()
