#!/usr/bin/env python3
"""
Script para mesclar o PDF do design com o PDF do sistema DDrinks
Requisitos: pip install PyPDF2
"""

import os
import sys
from pathlib import Path

try:
    from PyPDF2 import PdfMerger
except ImportError:
    print("Erro: PyPDF2 não está instalado.")
    print("Execute: pip install PyPDF2")
    sys.exit(1)


def merge_pdfs(design_pdf_path, system_pdf_path, output_pdf_path):
    """
    Mescla dois PDFs em um único arquivo.
    
    Args:
        design_pdf_path: Caminho para o PDF do design
        system_pdf_path: Caminho para o PDF do sistema
        output_pdf_path: Caminho para o PDF de saída mesclado
    """
    try:
        # Verificar se os arquivos existem
        if not os.path.exists(design_pdf_path):
            print(f"Erro: Arquivo não encontrado: {design_pdf_path}")
            return False
            
        if not os.path.exists(system_pdf_path):
            print(f"Erro: Arquivo não encontrado: {system_pdf_path}")
            return False
        
        # Criar merger
        merger = PdfMerger()
        
        # Adicionar o design primeiro (como capa)
        print(f"Adicionando design: {os.path.basename(design_pdf_path)}")
        merger.append(design_pdf_path)
        
        # Adicionar o PDF do sistema
        print(f"Adicionando PDF do sistema: {os.path.basename(system_pdf_path)}")
        merger.append(system_pdf_path)
        
        # Criar diretório de saída se não existir
        output_dir = os.path.dirname(output_pdf_path)
        os.makedirs(output_dir, exist_ok=True)
        
        # Salvar o PDF mesclado
        merger.write(output_pdf_path)
        merger.close()
        
        print(f"✓ PDF mesclado com sucesso!")
        print(f"Arquivo salvo em: {output_pdf_path}")
        
        # Verificar tamanho do arquivo
        file_size = os.path.getsize(output_pdf_path) / (1024 * 1024)  # Em MB
        print(f"Tamanho do arquivo: {file_size:.2f} MB")
        
        return True
        
    except Exception as e:
        print(f"Erro ao mesclar PDFs: {str(e)}")
        return False


if __name__ == "__main__":
    # Definir caminhos
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Caminho para o design PDF (ajuste conforme necessário)
    design_pdf = os.path.join(base_path, "Design sem nome.pdf")
    
    # Caminhos dos PDFs do sistema (tente encontrar)
    system_pdfs = [
        os.path.join(base_path, "orcamento_app_otimizado_v10.pdf"),
        os.path.join(base_path, "orcamento_ddrinks_otimizado.pdf"),
    ]
    
    # Encontrar qual PDF do sistema existe
    system_pdf = None
    for pdf in system_pdfs:
        if os.path.exists(pdf):
            system_pdf = pdf
            break
    
    if not system_pdf:
        print(f"Erro: Nenhum PDF do sistema encontrado em:")
        for pdf in system_pdfs:
            print(f"  - {pdf}")
        sys.exit(1)
    
    # Define o PDF de saída
    output_pdf = os.path.join(base_path, "orcamento_completo_com_design.pdf")
    
    # Mesclar PDFs
    success = merge_pdfs(design_pdf, system_pdf, output_pdf)
    
    sys.exit(0 if success else 1)
