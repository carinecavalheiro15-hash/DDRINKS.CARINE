const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dataPath = path.join(root, 'data', 'precos.json');
const files = [path.join(root, 'index.html'), path.join(root, 'resultado.html'), path.join(root, 'app.html'), path.join(root, 'ddrinks.html')];

const json = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

function objToInline(o) {
  const parts = [];
  for (const k of Object.keys(o)) {
    // keep numeric formatting consistent
    parts.push(`${k}: ${Number(o[k])}`);
  }
  return `{ ${parts.join(', ')} }`;
}

const bronzeStr = `bronze: ${objToInline(json.bronze)},`;
const prataStr = `prata: ${objToInline(json.prata)},`;
const ouroStr = `ouro: ${objToInline(json.ouro)}`;

files.forEach(file => {
  let txt = fs.readFileSync(file, 'utf8');
  // Replace the three consecutive package objects if present
  txt = txt.replace(/bronze:\s*\{[\s\S]*?\},\n\s*prata:\s*\{[\s\S]*?\},\n\s*ouro:\s*\{[\s\S]*?\}/, `${bronzeStr}\n  ${prataStr}\n  ${ouroStr}`);
  fs.writeFileSync(file, txt, 'utf8');
  console.log('Updated fallbacks in', file);
});
