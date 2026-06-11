const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const bronzePath = path.join(root, 'precos', 'bronze.json');
const appPath = path.join(root, 'app.html');
const outCombinedPrecos = path.join(root, 'precos', 'precos.json');
const outDataPrecos = path.join(root, 'data', 'precos.json');

const bronzeRaw = fs.readFileSync(bronzePath, 'utf8');
const bronzeJson = JSON.parse(bronzeRaw).bronze;

// read drinksList from app.html to know which keys are drinks
const appHtml = fs.readFileSync(appPath, 'utf8');
const match = appHtml.match(/const\s+drinksList\s*=\s*\[(.*?)\]/s);
const drinks = match ? match[1].split(',').map(s => s.trim().replace(/['"\s]/g, '')).filter(Boolean) : [];

const prata = {};
const ouro = {};

// Drinks that are non-alcoholic and should keep the same price across packages
const nonAlcoholicSame = [
  'cotton_fairy_sem_alcool',
  'mojito_sem_alcool',
  'moscow_mule_sem_alcool',
  'pina_colada_sem_alcool',
  'sex_on_the_beach_sem_alcool',
  'soda_italiana_limao_siciliano_e_morango'
];

Object.keys(bronzeJson).forEach(k => {
  const b = Number(bronzeJson[k]);
  if (drinks.includes(k)) {
    if (nonAlcoholicSame.includes(k)) {
      // keep the same price across packages for these non-alcoholic items
      prata[k] = b;
      ouro[k] = b;
    } else {
      prata[k] = Number((b + 4).toFixed(2));
      ouro[k] = Number((b + 8).toFixed(2));
    }
  } else {
    // keep other items the same across packages
    prata[k] = b;
    ouro[k] = b;
  }
});

const combined = { bronze: bronzeJson, prata, ouro };

fs.writeFileSync(outCombinedPrecos, JSON.stringify(combined, null, 2), 'utf8');
fs.writeFileSync(outDataPrecos, JSON.stringify(combined, null, 2), 'utf8');
console.log('Generated', outCombinedPrecos, 'and', outDataPrecos);