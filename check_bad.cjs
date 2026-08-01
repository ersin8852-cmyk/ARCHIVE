const fs = require('fs');
const path = require('path');

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
let found = false;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const badChars = ['ÅŸ', 'Ä±', 'Ã§', 'ÄŸ', 'Ã¶', 'Ã¼', 'Å', 'Ä'];
  let fileHasBad = false;
  for (const c of badChars) {
      if (content.includes(c)) {
          fileHasBad = true;
      }
  }
  if (fileHasBad) {
      console.log("Corrupted: " + file);
      found = true;
  }
});
if(!found) console.log("None");
