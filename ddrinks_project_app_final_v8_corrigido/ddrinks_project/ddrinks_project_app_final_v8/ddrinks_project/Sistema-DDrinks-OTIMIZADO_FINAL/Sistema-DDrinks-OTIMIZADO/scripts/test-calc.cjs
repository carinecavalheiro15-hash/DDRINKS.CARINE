const p = require('../precos/precos.json');

// Sample user inputs: 2 caipirinha (drinks), gelo = 20 (user-provided), copos = 30
const dados = { caipirinha: 2, gelo: 20, copos: 30 };

function calcForPackage(pkg) {
  let totalDrinks = 0;
  let totalOutros = 0;
  for (const id of Object.keys(dados)) {
    const qtd = dados[id];
    if (p.bronze[id] !== undefined) {
      // it's a drink (present in bronze), multiply by package price
      const price = pkg[id] !== undefined ? pkg[id] : 0;
      totalDrinks += qtd * price;
    } else {
      // others: value is taken directly
      totalOutros += qtd;
    }
  }
  const base = totalDrinks + totalOutros;
  const taxa = base * 0.4;
  return { base, taxa, total: base + taxa };
}

console.log('Bronze calc:', calcForPackage(p.bronze));
console.log('Prata calc:', calcForPackage(p.prata));
console.log('Ouro calc:', calcForPackage(p.ouro));
