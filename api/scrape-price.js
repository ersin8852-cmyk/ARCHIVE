const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  const { isbn } = req.query;

  if (!isbn) {
    return res.status(400).json({ error: 'ISBN gerekli.' });
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  };

  const results = [];

  const fetchPrice = async (siteName, url, parseCallback) => {
    try {
      const response = await axios.get(url, { headers, timeout: 8000 });
      const $ = cheerio.load(response.data);
      let price = parseCallback($);
      
      if (price && !isNaN(price) && price > 0) {
        results.push({ site: siteName, price: price });
      }
    } catch (error) {
      // Sessizce hatayı yut (site engellemiş veya zaman aşımı olabilir)
      console.log(`[Scraper] ${siteName} hatası: ${error.message}`);
    }
  };

  // Tüm siteleri aynı anda (paralel) tara
  await Promise.allSettled([
    // 1. Kitapyurdu
    fetchPrice('Kitapyurdu', `https://www.kitapyurdu.com/index.php?route=product/search&filter_name=${isbn}`, ($) => {
      const priceText = $('.price .value').first().text().trim();
      if (!priceText) return null;
      return parseFloat(priceText.replace(',', '.').replace(/[^0-9.]/g, ''));
    }),

    // 2. BKM Kitap
    fetchPrice('BKM Kitap', `https://www.bkmkitap.com/arama?q=${isbn}`, ($) => {
      const priceText = $('.current-price').first().text().trim();
      if (!priceText) return null;
      return parseFloat(priceText.replace(',', '.').replace(/[^0-9.]/g, ''));
    }),

    // 3. Kitapsepeti
    fetchPrice('Kitapsepeti', `https://www.kitapsepeti.com/arama?q=${isbn}`, ($) => {
      const priceText = $('.current-price').first().text().trim();
      if (!priceText) return null;
      return parseFloat(priceText.replace(',', '.').replace(/[^0-9.]/g, ''));
    }),

    // 4. D&R
    fetchPrice('D&R', `https://www.dr.com.tr/search?q=${isbn}`, ($) => {
      const priceText = $('.prd-price').first().text().trim();
      if (!priceText) return null;
      // D&R'da fiyat "120,50 TL" formatında, virgülden sonrası için özel ayar
      const clean = priceText.replace(' TL', '').replace(',', '.');
      return parseFloat(clean);
    }),

    // 5. Idefix
    fetchPrice('Idefix', `https://www.idefix.com/Arama?q=${isbn}`, ($) => {
      const priceText = $('.product-price').first().text().trim();
      if (!priceText) return null;
      const clean = priceText.replace(' TL', '').replace(',', '.');
      return parseFloat(clean);
    })
  ]);

  if (results.length === 0) {
    return res.status(404).json({ error: 'Hiçbir sitede fiyat bulunamadı veya bot korumasına takıldı.' });
  }

  // En ucuzunu bul
  const cheapest = results.reduce((min, curr) => curr.price < min.price ? curr : min, results[0]);

  return res.status(200).json({
    isbn: isbn,
    cheapest: cheapest,
    all_results: results
  });
};
