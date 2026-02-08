import os
import sys
from weasyprint import HTML, CSS

# Define o caminho base
base_path = os.path.dirname(os.path.abspath(__file__))
output_pdf = os.path.join(base_path, "orcamento_app_otimizado_v10.pdf")

# Dados das bebidas para simulação
bebidas_por_pacote = {
    'bronze': 'Vodka Smirnoff, Gin Seagers, Whisky Passport, Espumante Salton Series, Rum Bacardi, Campari, Martini Vermouth, Stock Triple Sec, Tequila Tequileiros, Aperol',
    'prata': 'Vodka Absolut, Gin Gordons, Whisky Ballantines, Stock Triple Sec, Campari, Martini Vermouth, Tequila Jose Cuervo, Cointreau, Espumante Freixenet, Aperol',
    'ouro': 'Vodka Grey Goose, Gin Tanqueray, Espumante Chandon, Whisky Jack Daniels, Rum Bacardi, Martini Vermouth, Campari, Aperol, Cointreau, Tequila Jose Cuervo'
}

# Conteúdo HTML estático (simulando o resultado final do orçamento com o estilo desejado)
html_content = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>DDrinks - Orçamento Otimizado (App V10)</title>
    <style>
        @page {
            size: A4;
            margin: 0;
        }
        body {
            font-family: 'Arial', sans-serif;
            background-color: #000000;
            color: #ffffff;
            margin: 0;
            padding: 0;
        }
        .pdf-container {
            width: 210mm; /* Largura A4 */
            min-height: 297mm; /* Altura A4 */
            margin: 0 auto;
            padding: 30px;
            box-sizing: border-box;
            background-color: #000000;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #d4170a;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #d4170a;
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .header h2 {
            color: #ffffff;
            margin: 10px 0;
            font-size: 20px;
            font-weight: normal;
        }
        .client-info {
            background: #1a1a1a;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            border-left: 4px solid #d4170a;
        }
        .client-info h3 {
            color: #d4170a;
            margin: 0 0 15px 0;
            font-size: 18px;
        }
        .client-details {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            font-size: 14px;
        }
        .client-details div {
            width: 48%;
            margin-bottom: 10px;
        }
        .client-details strong {
            color: #d4170a;
        }
        .packages-section {
            margin-bottom: 30px;
        }
        .packages-section h3 {
            color: #ffffff;
            border-bottom: 2px solid #d4170a;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        .packages-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
        }
        .package-card {
            border: 2px solid;
            border-radius: 10px;
            padding: 15px;
            text-align: center;
            background: #1a1a1a;
        }
        .package-card h4 {
            margin: 0 0 10px 0;
            font-size: 18px;
            text-transform: uppercase;
            font-weight: bold;
        }
        .package-total {
            color: #000000;
            padding: 10px;
            border-radius: 5px;
            margin-top: 10px;
        }
        .package-drinks {
            text-align: left;
            margin-top: 15px;
            font-size: 12px;
            color: #cccccc;
        }
        .package-drinks strong {
            color: #d4170a;
        }
        .drinks-section {
            margin-bottom: 30px;
        }
        .drinks-section h3 {
            color: #ffffff;
            border-bottom: 2px solid #d4170a;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        .drinks-list {
            background: #1a1a1a;
            padding: 20px;
            border-radius: 10px;
            display:flex; 
            gap:8px; 
            flex-wrap:wrap; 
            align-items:center;
        }
        .drink-tag {
            background: #222; 
            color: #d4170a; 
            padding: 8px 12px; 
            border-radius: 999px; 
            font-weight: 600;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #d4170a;
            color: #cccccc;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="pdf-container">
        <!-- Cabeçalho -->
        <div class="header">
            <h1>DDrinks</h1>
            <h2>Orçamento para Eventos</h2>
            <p style="color: #cccccc; margin: 5px 0; font-size: 14px;">Data: 13/12/2025</p>
        </div>

        <!-- Informações do Cliente -->
        <div class="client-info">
            <h3>INFORMAÇÕES DO CLIENTE</h3>
            <div class="client-details">
                <div><strong>Nome:</strong> <span>Carine</span></div>
                <div><strong>Telefone:</strong> <span>47</span></div>
                <div><strong>Cidade:</strong> <span>teste</span></div>
                <div><strong>Data do Evento:</strong> <span>31/12/2025</span></div>
                <div><strong>Convidados:</strong> <span>100 pessoas</span></div>
                <div><strong>Descrição:</strong> <span>teste</span></div>
            </div>
        </div>

        <!-- Totais por Pacote -->
        <div class="packages-section">
            <h3>TOTAIS POR PACOTE</h3>
            <div class="packages-grid">
                <!-- Pacote Bronze -->
                <div class="package-card" style="border-color: #CD7F32;">
                    <h4 style="color: #CD7F32;">Pacote Bronze</h4>
                    <div class="package-total" style="background: #CD7F32;">
                        <strong style="font-size: 16px;">Total: R$ 2.380,00</strong>
                    </div>
                    <div class="package-drinks">
                        <strong>Bebidas:</strong> {bebidas_por_pacote['bronze']}
                    </div>
                </div>
                <!-- Pacote Prata -->
                <div class="package-card" style="border-color: #C0C0C0;">
                    <h4 style="color: #C0C0C0;">Pacote Prata</h4>
                    <div class="package-total" style="background: #C0C0C0;">
                        <strong style="font-size: 16px;">Total: R$ 3.000,00</strong>
                    </div>
                    <div class="package-drinks">
                        <strong>Bebidas:</strong> {bebidas_por_pacote['prata']}
                    </div>
                </div>
                <!-- Pacote Ouro -->
                <div class="package-card" style="border-color: #FFD700;">
                    <h4 style="color: #FFD700;">Pacote Ouro</h4>
                    <div class="package-total" style="background: #FFD700;">
                        <strong style="font-size: 16px;">Total: R$ 4.500,00</strong>
                    </div>
                    <div class="package-drinks">
                        <strong>Bebidas:</strong> {bebidas_por_pacote['ouro']}
                    </div>
                </div>
            </div>
        </div>

        <!-- Drinks Selecionados -->
        <div class="drinks-section">
            <h3>DRINKS SELECIONADOS</h3>
            <div class="drinks-list">
                <span class="drink-tag">Gim Tropical</span>
                <span class="drink-tag">Negroni</span>
                <span class="drink-tag">Aperol Spritz</span>
                <span class="drink-tag">Tequila Sour</span>
            </div>
        </div>

        <!-- Rodapé -->
        <div class="footer">
            <p style="color: #ffffff;"><strong>DDrinks - Sistema de Orçamento para Eventos</strong></p>
            <p>Este orçamento é válido por 7 dias a partir da data de emissão.</p>
            <p>Para mais informações, entre em contato conosco.</p>
        </div>
    </div>
</body>
</html>
"""

try:
    # Gera o PDF
    HTML(string=html_content).write_pdf(output_pdf)
    print(f"PDF gerado com sucesso em: {output_pdf}")
except Exception as e:
    print(f"Erro ao gerar PDF: {e}", file=sys.stderr)
    sys.exit(1)
