/**
 * Kitap isimlerindeki ASCII karakterli kelimeleri sözlük yardımıyla düzeltir.
 * Orijinal büyük/küçük harf yapısını korur (Örn: ALAYCI -> ALAYCI, Alayci -> Alaycı)
 */
window.deasciifyTitle = (title) => {
  if (!title) return title;
  
  // Metni kelimelere ve noktalama işaretlerine ayır
  return title.split(/([a-zA-ZçğıöşüÇĞIÖŞÜ]+)/).map(word => {
    // Eğer parça sadece harflerden oluşmuyorsa (boşluk, tire vb.) aynen döndür
    if (!word.match(/^[a-zA-ZçğıöşüÇĞIÖŞÜ]+$/)) return word;
    
    const lowerWord = word.toLowerCase();
    
    // Eğer kelime sözlükte varsa düzelt
    if (window.turkishDictionary && window.turkishDictionary[lowerWord]) {
      const correctWord = window.turkishDictionary[lowerWord];
      
      // Orijinal kelimenin harf büyüklüğünü analiz et
      const isAllUpper = word === word.toUpperCase() && word.length > 1;
      const isCapitalized = word[0] === word[0].toUpperCase() && (word.length === 1 || word.slice(1) === word.slice(1).toLowerCase());
      
      if (isAllUpper) {
        // Türkçe özel büyük harf dönüşümü için toLocaleUpperCase kullanılır
        return correctWord.toLocaleUpperCase('tr-TR');
      } else if (isCapitalized) {
        return correctWord.charAt(0).toLocaleUpperCase('tr-TR') + correctWord.slice(1);
      } else {
        return correctWord;
      }
    }
    
    // Sözlükte yoksa orijinal halini koru
    return word;
  }).join('');
};
