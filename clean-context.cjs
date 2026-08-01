const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'src', 'context', 'context.jsx');
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/const FallbackIcon[\s\S]*?const pickIcon[^\n]*\n[^\n]*\n[^\n]*;/g, '');
c = c.replace(/const\s+[A-Z][a-zA-Z0-9]*\s*=\s*pickIcon\(['"].*?['"]\);/g, '');

fs.writeFileSync(p, c, 'utf8');
console.log('Cleaned context.jsx');
