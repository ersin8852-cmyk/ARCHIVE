window.googleBooksAPI = {
  searchTurkishBooks: async (query) => {
    try {
      // Remove common question words to improve search relevance
      const cleanQuery = query.replace(/(nedir|bul|ver|isbn|numarası|yazarı|sayfa sayısı)/gi, '').trim();
      if (!cleanQuery) return [];

      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cleanQuery)}&langRestrict=tr&maxResults=4`);
      
      if (!response.ok) {
        console.error("Google Books API error:", response.status);
        return [];
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return [];
      }

      return data.items.map(item => {
        const info = item.volumeInfo;
        let isbn10 = 'Bulunamadı';
        let isbn13 = 'Bulunamadı';
        
        if (info.industryIdentifiers) {
          info.industryIdentifiers.forEach(id => {
            if (id.type === 'ISBN_10') isbn10 = id.identifier;
            if (id.type === 'ISBN_13') isbn13 = id.identifier;
          });
        }

        return {
          title: info.title || 'Bilinmiyor',
          authors: info.authors ? info.authors.join(', ') : 'Bilinmiyor',
          publisher: info.publisher || 'Bilinmiyor',
          pageCount: info.pageCount || 'Bilinmiyor',
          isbn: isbn13 !== 'Bulunamadı' ? isbn13 : (isbn10 !== 'Bulunamadı' ? isbn10 : 'Bulunamadı')
        };
      });
    } catch (error) {
      console.error("Google Books Fetch Error:", error);
      return [];
    }
  }
};
