window.api = {
  fetchByIsbn: async (isbn) => {
    // 1. Barkodu Kitapyurdu'nda arat
    const searchRes = await fetch(`/api/scrape-search?q=${isbn}`);
    if (!searchRes.ok) throw new Error('API Hatası');
    const searchResults = await searchRes.json();
    
    if (!searchResults || searchResults.length === 0) return [];
    
    const book = searchResults[0]; // Barkod araması tek ve kesin sonuç verir
    
    // 2. Kitabın detay sayfasına girip sayfa sayısı, basım yılı gibi ekstra bilgileri al
    if (book.href) {
      try {
        const detailsRes = await fetch(`/api/scrape-details?url=${encodeURIComponent(book.href)}`);
        if (detailsRes.ok) {
          const details = await detailsRes.json();
          if (details.pageCount) book.pageCount = details.pageCount;
          if (details.year) book.year = details.year;
        }
      } catch (err) {
        console.log('Detay çekilemedi', err);
      }
    }
    
    book.isbn = isbn; // Barkodu zaten biliyoruz
    
    return [book];
  },

  fetchByTitle: async (q) => {
    let searchQ = q || '';
    const res = await fetch(`/api/scrape-search?q=${encodeURIComponent(searchQ)}`);
    if (!res.ok) throw new Error('API Hatası');
    const results = await res.json();
    return results; // Başlık, yazar, yayınevi, kapak ve detay linki döner
  }
};
