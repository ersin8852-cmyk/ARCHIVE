const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  // CORS headers — sadece kendi domain'lerimizden gelen isteklere izin ver
  const origin = req.headers.origin || '';
  const isAllowed = origin.endsWith('.vercel.app') || origin === 'http://localhost:3000' || origin === 'http://localhost:5500' || origin === 'http://127.0.0.1:5500';
  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
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

      const response = await axios.get(fetchUrl, { headers, timeout: 8500 });
      const $ = cheerio.load(response.data);
      let parsed = parseCallback($);
      let price = null;
      let cover = '';
      let metadata = {};
      
      if (typeof parsed === 'number') {
        price = parsed;
      } else if (parsed && typeof parsed === 'object') {
        price = parsed.price;
        cover = parsed.cover || '';
        metadata = parsed.metadata || {};
      }
      
      if (price && !isNaN(price) && price > 0) {
        results.push({ site: siteName, price: price, cover: cover, metadata: metadata });
      }
    } catch (error) {
      console.log(`[Scraper] ${siteName} hatası: ${error.message}`);
    }
  };

  const extractMetadata = ($) => {
    const meta = {};
    
    const titleSelectors = ['.name', '.product-title', '.product-name', '.pr_header__heading', '#product-name', '.a-size-medium', '.prd-name'];
    for (let s of titleSelectors) {
      const txt = $(s).first().text().replace(/\n/g, ' ').trim();
      if (txt && txt.length > 2 && !txt.includes('TL')) { meta.title = txt; break; }
    }
    
    const authorSelectors = ['.author', '.product-author', '.writer', '.pr_producers__publisher', '.a-row .a-size-base', '.yazar'];
    for (let s of authorSelectors) {
      const txt = $(s).first().text().replace('Yazar:', '').replace(/\n/g, ' ').trim();
      if (txt && txt.length > 2 && !txt.includes('TL')) { meta.author = txt; break; }
    }
    
    const pubSelectors = ['.publisher', '.product-publisher', '.yayinevi', '.pr_producers__manufacturer', '.brand', '.yayinevi-link'];
    for (let s of pubSelectors) {
      const txt = $(s).first().text().replace('Yayınevi:', '').replace(/\n/g, ' ').trim();
      if (txt && txt.length > 2 && !txt.includes('TL')) { meta.publisher = txt; break; }
    }
    
    return meta;
  };

  const extractCover = ($) => {
    let cover = '';
    
    // Güvenilir CSS sınıfları (Öncelikli arama)
    const selectors = ['.pr-img-src', '.product-image img', '.image img', '.product-cr img', '.img-inner img', '.prd-img'];
    for (let selector of selectors) {
      const img = $(selector).first();
      if (img.length > 0) {
        // data-src ve data-original her zaman src'den daha gerçektir (lazy load siteleri)
        const src = img.attr('data-src') || img.attr('data-original') || img.attr('src') || '';
        if (src && !src.includes('empty') && !src.includes('blank') && !src.includes('lazy') && !src.startsWith('data:')) {
          return src;
        }
      }
    }

    // Bulamazsa sayfadaki tüm resimleri tara (Agresif ama akıllı arama)
    $('img').each((i, el) => {
      if (cover) return;
      // Yine data-src ve data-original öncelikli
      let src = $(el).attr('data-src') || $(el).attr('data-original') || $(el).attr('src') || '';
      
      const alt = ($(el).attr('alt') || '').toLowerCase();
      const lowerSrc = src.toLowerCase();
      
      // Kesinlikle engellenecek (Çöp) kelimeler
      const isBad = lowerSrc.includes('logo') || lowerSrc.includes('icon') || lowerSrc.includes('banner') || 
                    lowerSrc.includes('blank') || lowerSrc.includes('empty') || lowerSrc.includes('lazy') ||
                    lowerSrc.includes('menu_item') || lowerSrc.includes('footer') || lowerSrc.includes('.svg') ||
                    lowerSrc.includes('sprite') || src.startsWith('data:') || alt.includes('banner');

      if (src && !isBad) {
        // Kapağa benzeyen (product, kitap, getimage vb.) ilk resmi al
        if (lowerSrc.includes('product') || lowerSrc.includes('getimage') || lowerSrc.includes('katalog') || 
            lowerSrc.includes('kitap') || lowerSrc.includes('cover') || lowerSrc.includes('nemesis')) {
          cover = src;
        }
      }
    });
    return cover;
  };

  // Tüm siteleri aynı anda (paralel) tara
  await Promise.allSettled([
    // 1. Kitapyurdu (Normal Tarama)
    fetchPrice('Kitapyurdu', `https://www.kitapyurdu.com/index.php?route=product/search&filter_name=${cleanIsbn}`, ($) => {
      const priceText = $('.price .value').first().text().trim();
      const price = priceText ? parseFloat(priceText.replace(',', '.').replace(/[^0-9.]/g, '')) : null;
      return { price, cover: extractCover($), metadata: extractMetadata($) };
    }),

    // 2. BKM Kitap (Normal Tarama)
    fetchPrice('BKM Kitap', `https://www.bkmkitap.com/arama?q=${cleanIsbn}`, ($) => {
      const priceText = $('.current-price').first().text().trim();
      const price = priceText ? parseFloat(priceText.replace(',', '.').replace(/[^0-9.]/g, '')) : null;
      return { price, cover: extractCover($), metadata: extractMetadata($) };
    }),

    // 3. Kitapsepeti (Normal Tarama)
    fetchPrice('Kitapsepeti', `https://www.kitapsepeti.com/arama?q=${cleanIsbn}`, ($) => {
      const priceText = $('.current-price').first().text().trim();
      const price = priceText ? parseFloat(priceText.replace(',', '.').replace(/[^0-9.]/g, '')) : null;
      return { price, cover: extractCover($), metadata: extractMetadata($) };
    }),

    // 4. Amazon TR (ScraperAPI ile Anti-Bot bypass)
    fetchPrice('Amazon', `https://www.amazon.com.tr/s?k=${cleanIsbn}`, ($) => {
      const priceWhole = $('.a-price-whole').first().text().replace(/[^0-9]/g, '');
      const priceFraction = $('.a-price-fraction').first().text().replace(/[^0-9]/g, '');
      if (!priceWhole) return null;
      const price = parseFloat(`${priceWhole}.${priceFraction || '00'}`);
      return { price, cover: extractCover($), metadata: extractMetadata($) };
    }, true),

    // 5. D&R (ScraperAPI ile Anti-Bot bypass)
    fetchPrice('D&R', `https://www.dr.com.tr/search?q=${cleanIsbn}`, ($) => {
      const priceText = $('.prd-price').first().text().trim();
      if (!priceText) return null;
      const clean = priceText.replace(' TL', '').replace(',', '.');
      const price = parseFloat(clean);
      return { price, cover: extractCover($), metadata: extractMetadata($) };
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
