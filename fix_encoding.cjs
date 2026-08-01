const fs = require('fs');
const path = require('path');

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

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
      }
    } else {
      if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.css') || file.endsWith('.json')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });
  return arrayOfFiles;
}

const files = getAllFiles(__dirname);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const [bad, good] of Object.entries(map)) {
    if (content.includes(bad)) {
        content = content.split(bad).join(good);
        changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log("Fixed: " + path.basename(file));
  }
});
console.log("Encoding fix complete.");
