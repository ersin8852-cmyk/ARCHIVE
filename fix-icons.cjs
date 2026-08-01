const fs = require('fs');
const path = require('path');
const lucide = require('lucide-react');
const lucideIcons = Object.keys(lucide);

function getJsxTags(content) {
    const tags = new Set();
    const regex = /<([A-Z][a-zA-Z0-9]*)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        tags.add(match[1]);
    }
    return Array.from(tags);
}

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const tags = getJsxTags(content);
            const usedIcons = tags.filter(tag => lucideIcons.includes(tag));
            
            if (usedIcons.length > 0) {
                // Remove List from icons if this is ListsView because ListsView has a component named List? No, ListsView does not export List. 
                // Wait, if it imports List from lucide-react but also defines List, it might clash. I'll just let it import and we'll see.
                
                const importMatch = content.match(/import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/);
                let currentImports = importMatch ? importMatch[1].split(',').map(s => s.trim()) : [];
                
                let missingIcons = usedIcons.filter(icon => !currentImports.includes(icon) && !content.includes(`import ${icon}`));
                
                if (missingIcons.length > 0) {
                    if (importMatch) {
                        const newImports = [...currentImports, ...missingIcons].join(', ');
                        content = content.replace(importMatch[0], `import { ${newImports} } from 'lucide-react'`);
                    } else {
                        const lastImportIndex = content.lastIndexOf('import ');
                        const endOfLastImport = content.indexOf('\n', lastImportIndex);
                        const insertStr = `\nimport { ${missingIcons.join(', ')} } from 'lucide-react';`;
                        content = content.slice(0, endOfLastImport) + insertStr + content.slice(endOfLastImport);
                    }
                    fs.writeFileSync(fullPath, content, 'utf8');
                }
            }
        }
    }
}
processDir(path.join(process.cwd(), 'src'));
console.log('Icons imported');
