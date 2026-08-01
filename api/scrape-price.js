const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Sadece GET isteklerine izin ver
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Sadece GET istekleri kabul edilir.' });
  }

  const { isbn } = req.query;

  if (!isbn) {
    return res.status(400).json({ error: 'ISBN gerekli.' });
  }

  // ISBN format doğrulaması (sadece rakam ve tire, 10 veya 13 karakter)
  const cleanIsbn = isbn.replace(/[-\s]/g, '');
  if (!/^\d{10}(\d{3})?$/.test(cleanIsbn)) {
    return res.status(400).json({ error: 'Geçersiz ISBN formatı. 10 veya 13 haneli olmalıdır.' });
  }

  // ScraperAPI Key - Environment Variable'dan okunuyor
  const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;
  if (!SCRAPER_API_KEY) {
    console.error('[Scraper] SCRAPER_API_KEY environment variable tanımlı değil!');
    return res.status(500).json({ error: 'Sunucu yapılandırma hatası.' });
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  };

  const results = [];

  const fetchPrice = async (siteName, url, parseCallback, useScraperApi = false) => {
    try {
      let fetchUrl = url;
      if (useScraperApi) {
        fetchUrl = `http://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}`;
      }

      // Vercel zaman aşımı 10sn'dir. İşlemin Vercel'i çökertmemesi için 8.5 saniyede iptal ediyoruz.
      const response = await axios.get(fetchUrl, { headers, timeout: 8500 });
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
    // 1. Kitapyurdu (Normal Tarama)
    fetchPrice('Kitapyurdu', `https://www.kitapyurdu.com/index.php?route=product/search&filter_name=${cleanIsbn}`, ($) => {
      const priceText = $('.price .value').first().text().trim();
      if (!priceText) return null;
      return parseFloat(priceText.replace(',', '.').replace(/[^0-9.]/g, ''));
    }),

    // 2. BKM Kitap (Normal Tarama)
    fetchPrice('BKM Kitap', `https://www.bkmkitap.com/arama?q=${cleanIsbn}`, ($) => {
      const priceText = $('.current-price').first().text().trim();
      if (!priceText) return null;
      return parseFloat(priceText.replace(',', '.').replace(/[^0-9.]/g, ''));
    }),

    // 3. Kitapsepeti (Normal Tarama)
    fetchPrice('Kitapsepeti', `https://www.kitapsepeti.com/arama?q=${cleanIsbn}`, ($) => {
      const priceText = $('.current-price').first().text().trim();
      if (!priceText) return null;
      return parseFloat(priceText.replace(',', '.').replace(/[^0-9.]/g, ''));
    }),

    // 4. Amazon TR (ScraperAPI ile Anti-Bot bypass)
    fetchPrice('Amazon', `https://www.amazon.com.tr/s?k=${cleanIsbn}`, ($) => {
      const priceWhole = $('.a-price-whole').first().text().replace(/[^0-9]/g, '');
      const priceFraction = $('.a-price-fraction').first().text().replace(/[^0-9]/g, '');
      if (!priceWhole) return null;
      return parseFloat(`${priceWhole}.${priceFraction || '00'}`);
    }, true),

    // 5. D&R (ScraperAPI ile Anti-Bot bypass)
    fetchPrice('D&R', `https://www.dr.com.tr/search?q=${cleanIsbn}`, ($) => {
      const priceText = $('.prd-price').first().text().trim();
      if (!priceText) return null;
      const clean = priceText.replace(' TL', '').replace(',', '.');
      return parseFloat(clean);
    }, true)
  ]);

  if (results.length === 0) {
    return res.status(404).json({ error: 'Hiçbir sitede fiyat bulunamadı veya tüm aramalar zaman aşımına uğradı.' });
  }

  // En ucuzunu bul
  const cheapest = results.reduce((min, curr) => curr.price < min.price ? curr : min, results[0]);

  return res.status(200).json({
    isbn: cleanIsbn,
    cheapest: cheapest,
    all_results: results
  });
};
