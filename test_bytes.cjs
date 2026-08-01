const fs = require('fs');
let content = fs.readFileSync('src/modals/AuthModal.jsx', 'utf8');
let match = content.match(/Kullan(.*?)\s+Ad(.*?)"/);
if (match) {
    let bad1 = match[1];
    let bad2 = match[2];
    console.log("bad1:", bad1.charCodeAt(0).toString(16), bad1.charCodeAt(1).toString(16));
    console.log("bad2:", bad2.charCodeAt(0).toString(16), bad2.charCodeAt(1).toString(16));
}
