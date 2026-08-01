const fs = require('fs');
const path = require('path');
const lucideIcons = require('lucide-react');

const srcDir = path.join(__dirname, 'src');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.jsx')) arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });
  return arrayOfFiles;
}

const files = getAllFiles(srcDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Find all <Capitalized ...
  const regex = /<([A-Z][a-zA-Z0-9]+)/g;
  let match;
  const components = new Set();
  
  while ((match = regex.exec(content)) !== null) {
    components.add(match[1]);
  }
  
  // Also find icons used without JSX (e.g. icon: Book)
  const regex2 = /\b([A-Z][a-zA-Z0-9]+)\b/g;
  while ((match = regex2.exec(content)) !== null) {
      if (lucideIcons[match[1]]) {
          components.add(match[1]);
      }
  }

  const lucideImports = [];
  components.forEach(comp => {
    if (lucideIcons[comp]) {
      lucideImports.push(comp);
    }
  });
  
  if (lucideImports.length > 0) {
    // Check if they are already imported from lucide-react (not as * as)
    if (!content.includes('from "lucide-react"') && !content.includes("from 'lucide-react'")) {
        // We have import * as LucideIcons from 'lucide-react'; at the top
        // Let's replace it with the specific imports
        content = content.replace(/import \* as LucideIcons from 'lucide-react';/, "import { " + lucideImports.join(', ') + " } from 'lucide-react';");
        fs.writeFileSync(file, content, 'utf8');
    } else {
        // If it already has import * as, just replace it
        if(content.includes("import * as LucideIcons")) {
            content = content.replace(/import \* as LucideIcons from 'lucide-react';/, "import { " + lucideImports.join(', ') + " } from 'lucide-react';");
            fs.writeFileSync(file, content, 'utf8');
        }
    }
  }
});

console.log("Done");
