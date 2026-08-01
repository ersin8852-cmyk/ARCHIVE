const fs = require('fs');
const path = require('path');

const map = {
  'ÅŸ': 'ş',
  'Åž': 'Ş',
  'Ä±': 'ı',
  'Ä°': 'İ',
  'Ã§': 'ç',
  'Ã‡': 'Ç',
  'Ã¶': 'ö',
  'Ã–': 'Ö',
  'Ã¼': 'ü',
  'Ãœ': 'Ü',
  'ÄŸ': 'ğ',
  'Äž': 'Ğ',
  'Ã¢': 'â',
  'Ã®': 'î',
  // Sometimes it's A with circumflex or similar due to slightly different codepages
  'Åy': 'ş', // In case
  'Ã½': 'ı'
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
      if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.html')) {
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
