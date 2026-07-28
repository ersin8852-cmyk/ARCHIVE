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
      // Vercel function timeout is 10s, so we must fail fast (4s max per request)
      const response = await axios.get(url, { headers, timeout: 4000 });
      const $ = cheerio.load(response.data);
      let price = parseCallback($);
      
      if (price && !isNaN(price) && price > 0) {
        results.push({ site: siteName, price: price });
      }
    } catch (error) {
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
