const fs = require('fs');
const path = require('path');

const precosPath = path.resolve(__dirname, '..', 'precos', 'precos.json');
const precos = JSON.parse(fs.readFileSync(precosPath, 'utf8'));

// Sample user inputs
const dados = { caipirinha_kiwi: 2, gelo: 20, copos: 30 };

function calcTotals(precosObj) {
  const totals = {};
  ['bronze', 'prata', 'ouro'].forEach(pkg => {
    let totalDrinks = 0;
    let totalOutros = 0;
    for (const id of Object.keys(dados)) {
      const qtd = dados[id];
      if (precos.bronze[id] !== undefined) {
        const price = precosObj[pkg][id] || 0;
        totalDrinks += qtd * price;
      } else {
        totalOutros += qtd;
      }
    }
    const base = totalDrinks + totalOutros;
    const taxa = base * 0.4;
    totals[pkg] = { subtotal: base, taxa, totalFinal: base + taxa };
  });
  return totals;
}

// Simulate creating an orcamento now
const currentTotals = calcTotals(precos);
const orcamento = {
  id: 1,
  pacote: 'prata',
  totaisPorPacote: currentTotals,
  valor: currentTotals.prata.totalFinal
};

// Simulate price update happening later (e.g., prata prices increase)
const updatedPrecos = JSON.parse(JSON.stringify(precos));
// bump prata drink prices by +10 to simulate change
Object.keys(updatedPrecos.prata).forEach(k => {
  if (updatedPrecos.bronze[k] !== undefined) {
    updatedPrecos.prata[k] = updatedPrecos.prata[k] + 10;
  }
});

// Acceptance logic: prefer stored totals
function aceitar(orcamento, pacoteAceito, updatedPrecos) {
  if (orcamento.totaisPorPacote && orcamento.totaisPorPacote[pacoteAceito]) {
    return orcamento.totaisPorPacote[pacoteAceito].totalFinal;
  }
  // fallback: recalc
  const recalculated = calcTotals(updatedPrecos)[pacoteAceito].totalFinal;
  return recalculated;
}

const acceptedTotal = aceitar(orcamento, 'prata', updatedPrecos);
console.log('Stored total (at creation):', currentTotals.prata.totalFinal.toFixed(2));
console.log('Accepted total (after price change):', acceptedTotal.toFixed(2));

if (acceptedTotal === currentTotals.prata.totalFinal) {
  console.log('OK: Acceptance used stored totals.');
} else {
  console.error('FAIL: Acceptance recomputed with new prices.');
}
