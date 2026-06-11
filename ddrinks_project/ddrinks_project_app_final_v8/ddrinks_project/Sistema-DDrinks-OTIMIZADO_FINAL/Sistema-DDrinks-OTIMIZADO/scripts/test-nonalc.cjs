const p = require('../precos/precos.json');

// Sample with only non-alcoholic drinks selected
const dados = { mojito_sem_alcool: 10, cotton_fairy_sem_alcool: 5, soda_italiana_limao_siciliano_e_morango: 3 };

function calcForPackage(pkg) {
  let totalDrinks = 0;
  let totalOutros = 0;
  for (const id of Object.keys(dados)) {
    const qtd = dados[id];
    if (p.bronze[id] !== undefined) {
      const price = pkg[id] !== undefined ? pkg[id] : 0;
      totalDrinks += qtd * price;
    } else {
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
