const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dataPath = path.join(root, 'data', 'precos.json');
const appPath = path.join(root, 'app.html');

const appHtml = fs.readFileSync(appPath, 'utf8');
const match = appHtml.match(/const\s+drinksList\s*=\s*\[(.*?)\]/s);
if (!match) {
  console.error('drinksList not found in app.html');
  process.exit(1);
}
const listStr = match[1];
const drinks = listStr.split(',').map(s => s.trim().replace(/['"\s]/g, '')).filter(Boolean);

const raw = fs.readFileSync(dataPath, 'utf8');
const json = JSON.parse(raw);

json.prata = json.prata || {};
json.ouro = json.ouro || {};

let updated = 0;

drinks.forEach(k => {
  if (json.bronze && Object.prototype.hasOwnProperty.call(json.bronze, k)) {
    const b = Number(json.bronze[k]);
    if (!isNaN(b)) {
      json.prata[k] = Number((b + 4).toFixed(2));
      json.ouro[k] = Number((b + 8).toFixed(2));
      updated++;
    }
  }
});

fs.writeFileSync(dataPath, JSON.stringify(json, null, 2), 'utf8');
console.log('Updated', dataPath, 'for', updated, 'drinks');
