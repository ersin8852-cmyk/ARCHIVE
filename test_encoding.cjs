const fs = require('fs');

const map = {
  '\xC3\xBC': 'ü',
  '\xC3\x9C': 'Ü',
  '\xC3\xB6': 'ö',
  '\xC3\x96': 'Ö',
  '\xC3\xA7': 'ç',
  '\xC3\x87': 'Ç',
  '\xC4\x9F': 'ğ',
  '\xC4\x9E': 'Ğ',
  '\xC4\xB1': 'ı',
  '\xC4\xB0': 'İ',
  '\xC5\x9F': 'ş',
  '\xC5\x9E': 'Ş',
  '\xC3\xA2': 'â',
  '\xC3\xAE': 'î'
};

let content = fs.readFileSync('index.html', 'utf8');

for (const [bad, good] of Object.entries(map)) {
  content = content.split(bad).join(good);
}

console.log(content.match(/Archive .+/)[0]);
console.log(content.match(/K.+cebinde\.\.\./)[0]);
