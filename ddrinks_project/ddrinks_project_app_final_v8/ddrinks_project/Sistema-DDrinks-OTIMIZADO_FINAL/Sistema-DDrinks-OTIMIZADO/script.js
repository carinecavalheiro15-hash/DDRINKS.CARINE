function calcularOrcamento(fatorPreco = 1) {
    const precosBase = {
        "caipirinha": 10.00,
        "mojito": 3.43,
        "sex_on_the_beach": 5.50,
        "gin_tonica": 5.95,
        "moscow_mule": 4.55,
        "gim_tropical": 6.00,
        "gin_tropical": 7.27,
        "negroni": 7.58,
        "aperol_spritz": 12.00,
        "whisky_sour": 6.26,
        "cosmopolitan": 4.80,
        "caipirinha_morango": 5.73,
        "caipirinha_limao": 4.83,
        "caipirinha_kiwi": 9.50,
        "pina_colada": 5.90,
        "alexander": 5.74,
        "tequila_sour": 5.75,
        "tequila_sunrise": 5.73,
        "pink_lady": 5.00,
        "limonada_suica": 3.40,
        "lagoa_azul": 4.82,
        "caipirinha_cachaca": 3.50,
        "caipirinha_vinho": 4.00,
        "cream_pink": 6.50,
        "cotton_fairy": 5.50,
        "marguerita": 6.00,
        "amaretto_sour": 8.00,
        "hold_hup": 8.50,
        "passion": 8.50,
        "cookie_drink": 9.50,
        "mirtilo_sour": 7.50,
        "toscano": 8.50,
        "oreo_yin": 8.50
    };

    let totalDrinks = 0;
    let detalhesDrinks = "";

    for (let drink in precosBase) {
        const quantidade = parseInt(document.getElementById(drink)?.value) || 0;

        if (quantidade > 0) {
            const precoUnitario = precosBase[drink] * fatorPreco;
            const subtotal = precoUnitario * quantidade;
            totalDrinks += subtotal;

            const nomeFormatado = drink.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
            detalhesDrinks += `${nomeFormatado}: ${quantidade} x R$ ${precoUnitario.toFixed(2)} = R$ ${subtotal.toFixed(2)}<br>`;
        }
    }

    // Calcular outros gastos
    const outrosGastosIds = [
        { id: "gelo", nome: "Gelo" },
        { id: "copos", nome: "Copos" },
        { id: "decoracao", nome: "Decoração" },
        { id: "carretinha", nome: "Aluguel Carretinha" },
        { id: "flores", nome: "Flores Comestíveis" },
        { id: "papelaria", nome: "Papelaria" },
        { id: "funcionarios", nome: "Funcionários" },
        { id: "alimentacao", nome: "Alimentação" },
        { id: "canudos", nome: "Canudos" },
        { id: "gasolina", nome: "Gasolina" }
    ];

    let totalOutros = 0;
    let detalhesOutros = "";

    outrosGastosIds.forEach(item => {
        const valor = parseFloat(document.getElementById(item.id)?.value) || 0;
        if (valor > 0) {
            totalOutros += valor;
            detalhesOutros += `${item.nome}: R$ ${valor.toFixed(2)}<br>`;
        }
    });

    const totalGeral = totalDrinks + totalOutros;

    if (totalDrinks === 0 && totalOutros === 0) {
        document.getElementById('resultado').innerHTML = `<strong>Por favor, informe a quantidade de pelo menos um drink ou um gasto adicional.</strong>`;
        return;
    }

    document.getElementById('resultado').innerHTML = `
        <h3>Resumo do Orçamento:</h3>
        ${detalhesDrinks}
        ${detalhesOutros ? `<h4>Outros Gastos:</h4>${detalhesOutros}` : ""}
        <strong>Total Geral: R$ ${totalGeral.toFixed(2)}</strong>
    `;
}
