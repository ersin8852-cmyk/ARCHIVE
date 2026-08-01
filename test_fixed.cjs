const fs = require('fs');
let content = fs.readFileSync('src/modals/AuthModal.jsx', 'utf8');
if (content.includes('Kullanıcı Adı')) {
    console.log("Success: Kullanıcı Adı");
} else {
    console.log("Failed to find Kullanıcı Adı");
}
if (content.includes('Hoş Geldiniz')) {
    console.log("Success: Hoş Geldiniz");
} else {
    console.log("Failed to find Hoş Geldiniz");
}
