#!/usr/bin/env node
/**
 * Script para mesclar o PDF do design com o PDF do sistema DDrinks
 * Requisitos: npm install pdf-merge
 */

const fs = require('fs');
const path = require('path');
const pdfMerge = require('pdf-merge');

async function mergePdfs() {
    try {
        // Definir caminhos
        const baseDir = path.join(__dirname, '..');
        const designPdf = path.join(baseDir, 'Design sem nome.pdf');
        const outputPdf = path.join(baseDir, 'orcamento_completo_com_design.pdf');
        
        // Encontrar PDF do sistema
        const possibleSystemPdfs = [
            path.join(baseDir, 'orcamento_app_otimizado_v10.pdf'),
            path.join(baseDir, 'orcamento_ddrinks_otimizado.pdf'),
        ];
        
        let systemPdf = null;
        for (const pdf of possibleSystemPdfs) {
            if (fs.existsSync(pdf)) {
                systemPdf = pdf;
                break;
            }
        }
        
        if (!systemPdf) {
            console.error('Erro: Nenhum PDF do sistema encontrado');
            process.exit(1);
        }
        
        // Verificar se o design PDF existe
        if (!fs.existsSync(designPdf)) {
            console.error(`Erro: Design PDF não encontrado: ${designPdf}`);
            process.exit(1);
        }
        
        console.log('Mesclando PDFs...');
        console.log(`- Design: ${path.basename(designPdf)}`);
        console.log(`- Sistema: ${path.basename(systemPdf)}`);
        
        // Mesclar PDFs
        await pdfMerge([designPdf, systemPdf], outputPdf);
        
        console.log('\n✓ PDFs mesclados com sucesso!');
        console.log(`Arquivo salvo em: ${outputPdf}`);
        
        // Verificar tamanho
        const stats = fs.statSync(outputPdf);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`Tamanho: ${sizeMB} MB`);
        
    } catch (error) {
        console.error('Erro ao mesclar PDFs:', error.message);
        process.exit(1);
    }
}

mergePdfs();
