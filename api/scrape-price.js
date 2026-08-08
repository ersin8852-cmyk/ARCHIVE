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
  let quotaExceeded = false;

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
        results.push({ site: siteName, price: price, cover: cover, metadata: metadata, status: 'success' });
      } else {
        results.push({ site: siteName, price: null, cover: null, metadata: {}, status: 'failed_or_bot_blocked' });
      }
    } catch (error) {
      console.log(`[Scraper] ${siteName} hatası: ${error.message}`);
      results.push({ site: siteName, price: null, cover: null, metadata: {}, status: 'error', error: error.message });
      if (useScraperApi && error.response && (error.response.status === 401 || error.response.status === 403 || error.response.status === 429)) {
        quotaExceeded = true;
      }
    }
  };

  const extractMetadata = ($) => {
    const meta = {};
    
    // JSON-LD (Schema.org) Yapılandırılmış Veri Taraması (Kitapsepeti vb. sitelerin sağladığı en temiz veri)
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const jsonStr = $(el).html();
        if (!jsonStr) return;
        const data = JSON.parse(jsonStr);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          // Bazen ana obje içinde itemListElement olur
          let products = [item];
          if (item['@type'] === 'ItemList' && item.itemListElement) {
             products = item.itemListElement.map(x => x.item || x);
          }
          
          for (const p of products) {
            if (p['@type'] === 'Product' || p['@type'] === 'Book') {
              if (p.name && !meta.title) meta.title = p.name.trim();
              if (p.author && p.author.name && !meta.author) meta.author = p.author.name.trim();
              if (p.publisher && p.publisher.name && !meta.publisher) meta.publisher = p.publisher.name.trim();
              if (p.brand && p.brand.name && !meta.publisher) meta.publisher = p.brand.name.trim();
              if (p.numberOfPages && !meta.pageCount) meta.pageCount = p.numberOfPages;
            }
          }
        }
      } catch (e) {}
    });

    if (!meta.title) {
      const titleSelectors = ['.name', '.product-title', '.product-name', '.pr_header__heading', '#product-name', '.a-size-medium', '.prd-name'];
      for (let s of titleSelectors) {
        const txt = $(s).first().text().replace(/\n/g, ' ').trim();
        const lowerTxt = txt.toLowerCase();
        const isBadTitle = ['filtreler', 'kategoriler', 'markalar', 'yazarlar', 'yayınevleri'].includes(lowerTxt) || lowerTxt.includes('sepete ekle');
        if (txt && txt.length > 2 && !txt.includes('TL') && !isBadTitle) { meta.title = txt; break; }
      }
    }
    
    if (!meta.author) {
      // DİKKAT: '.a-row .a-size-base' Amazon'un "Diğer satın alma seçenekleri" yazısını alıyordu, kaldırıldı!
      const authorSelectors = ['.author', '.product-author', '.writer', '.pr_producers__publisher', '.yazar'];
      for (let s of authorSelectors) {
        const txt = $(s).first().text().replace('Yazar:', '').replace(/\n/g, ' ').trim();
        if (txt && txt.length > 2 && !txt.includes('TL')) { meta.author = txt; break; }
      }
    }
    
    if (!meta.publisher) {
      const pubSelectors = ['.publisher', '.product-publisher', '.yayinevi', '.pr_producers__manufacturer', '.brand', '.yayinevi-link'];
      for (let s of pubSelectors) {
        const txt = $(s).first().text().replace('Yayınevi:', '').replace(/\n/g, ' ').trim();
        if (txt && txt.length > 2 && !txt.includes('TL')) { meta.publisher = txt; break; }
      }
    }
    
    if (!meta.pageCount) {
      const labels = $('td, th, span, div, li, strong, b');
      labels.each((i, el) => {
        if (meta.pageCount) return;
        const text = $(el).text().replace(/\n/g, ' ').trim().toLowerCase();
        if (text === 'sayfa sayısı:' || text === 'sayfa sayısı' || text === 'sayfa sayisi:' || text === 'sayfa sayisi') {
          let val = $(el).next().text().trim();
          if (!val) val = $(el).parent().text().replace($(el).text(), '').trim();
          const match = val.match(/\d+/);
          if (match && parseInt(match[0]) > 0 && parseInt(match[0]) < 5000) {
            meta.pageCount = match[0];
          }
        }
      });
    }

    meta._debug_title = $('title').text().trim().substring(0, 50);

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

  // Binlik ayracı (nokta) ve ondalık ayracını (virgül) doğru çözümleyen yardımcı fonksiyon
  const parseTurkishPrice = (text) => {
    if (!text) return null;
    let clean = text.replace(/[^0-9.,]/g, '');
    clean = clean.replace(/\./g, ''); // Binlik ayracını sil (örn: 2.245,50 -> 2245,50)
    clean = clean.replace(',', '.'); // Ondalık ayracını noktaya çevir (örn: 2245,50 -> 2245.50)
    return parseFloat(clean) || null;
  };

  // Tüm siteleri aynı anda (paralel) tara
  await Promise.allSettled([
    // 1. Kitapyurdu
    fetchPrice('Kitapyurdu', `https://www.kitapyurdu.com/index.php?route=product/search&filter_name=${cleanIsbn}`, ($) => {
      let priceText = $('.price-new .value').first().text() || $('.price .value').first().text() || $('.product-price').first().text() || $('.prc-dsc').first().text();
      const price = parseTurkishPrice(priceText);
      return { price, cover: extractCover($), metadata: extractMetadata($) };
    }),

    // 2. BKM Kitap
    fetchPrice('BKM Kitap', `https://www.bkmkitap.com/arama?q=${cleanIsbn}`, ($) => {
      let priceText = $('.current-price').first().text() || $('.product-price').first().text() || $('.urun_fiyati').first().text() || $('.discount-price').first().text();
      const price = parseTurkishPrice(priceText);
      return { price, cover: extractCover($), metadata: extractMetadata($) };
    }),

    // 3. Kitapsepeti (Normal Tarama)
    fetchPrice('Kitapsepeti', `https://www.kitapsepeti.com/arama?q=${cleanIsbn}`, ($) => {
      let priceText = $('.current-price').first().text() || $('.product-price').first().text();
      const price = parseTurkishPrice(priceText);
      return { price, cover: extractCover($), metadata: extractMetadata($) };
    }),

    // 4. Amazon TR (ScraperAPI ile Anti-Bot bypass)
    fetchPrice('Amazon', `https://www.amazon.com.tr/s?k=${cleanIsbn}`, ($) => {
      let priceText = $('.a-price .a-offscreen').first().text();
      if (!priceText) {
        const priceWhole = $('.a-price-whole').first().text().replace(/[^0-9]/g, '');
        const priceFraction = $('.a-price-fraction').first().text().replace(/[^0-9]/g, '');
        if (priceWhole) priceText = `${priceWhole}.${priceFraction || '00'}`;
      }
      const price = parseTurkishPrice(priceText) || parseFloat(priceText);
      return { price, cover: extractCover($), metadata: extractMetadata($) };
    }, true),

    // 5. D&R (ScraperAPI ile Anti-Bot bypass)
    fetchPrice('D&R', `https://www.dr.com.tr/search?q=${cleanIsbn}`, ($) => {
      let priceText = $('.prd-price').first().text() || $('.price').first().text() || $('#salePrice').text() || $('.product-price').first().text();
      const price = parseTurkishPrice(priceText);
      return { price, cover: extractCover($), metadata: extractMetadata($) };
    }, true)
  ]);

  const validResults = results.filter(r => r.price !== null && r.price > 0);

  if (validResults.length === 0) {
    if (quotaExceeded) {
      return res.status(429).json({ error: 'ScraperAPI kotası doldu (429).', all_results: results });
    }
    return res.status(200).json({ notFound: true, error: 'Hiçbir sitede fiyat bulunamadı.', all_results: results });
  }

  // En ucuzunu bul
  const cheapest = validResults.reduce((min, curr) => curr.price < min.price ? curr : min, validResults[0]);

  return res.status(200).json({
    isbn: cleanIsbn,
    cheapest: cheapest,
    all_results: results
  });
};
