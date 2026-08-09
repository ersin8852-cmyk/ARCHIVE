const WORKER_PROXY_URL = 'https://archivebook.ersin8852.workers.dev/?url=';

// Binlik ayracı (nokta) ve ondalık ayracını (virgül) doğru çözümleyen yardımcı fonksiyon
const parseTurkishPrice = (text) => {
  if (!text) return null;
  let clean = text.replace(/[^0-9.,]/g, '');
  clean = clean.replace(/\./g, ''); // Binlik ayracını sil (örn: 2.245,50 -> 2245,50)
  clean = clean.replace(',', '.'); // Ondalık ayracını noktaya çevir (örn: 2245,50 -> 2245.50)
  return parseFloat(clean) || null;
};

const extractMetadata = (doc) => {
  const meta = {};
  
  // JSON-LD (Schema.org) Yapılandırılmış Veri Taraması
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  scripts.forEach((el) => {
    try {
      const jsonStr = el.textContent;
      if (!jsonStr) return;
      const data = JSON.parse(jsonStr);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
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
      const el = doc.querySelector(s);
      if (el) {
        const txt = el.textContent.replace(/\n/g, ' ').trim();
        const lowerTxt = txt.toLowerCase();
        const isBadTitle = ['filtreler', 'kategoriler', 'markalar', 'yazarlar', 'yayınevleri'].includes(lowerTxt) || lowerTxt.includes('sepete ekle');
        if (txt && txt.length > 2 && !txt.includes('TL') && !isBadTitle) { meta.title = txt; break; }
      }
    }
  }
  
  if (!meta.author) {
    const authorSelectors = ['.author', '.product-author', '.writer', '.pr_producers__publisher', '.yazar'];
    for (let s of authorSelectors) {
      const el = doc.querySelector(s);
      if (el) {
        const txt = el.textContent.replace('Yazar:', '').replace(/\n/g, ' ').trim();
        if (txt && txt.length > 2 && !txt.includes('TL')) { meta.author = txt; break; }
      }
    }
  }
  
  if (!meta.publisher) {
    const pubSelectors = ['.publisher', '.product-publisher', '.yayinevi', '.pr_producers__manufacturer', '.brand', '.yayinevi-link'];
    for (let s of pubSelectors) {
      const el = doc.querySelector(s);
      if (el) {
        const txt = el.textContent.replace('Yayınevi:', '').replace(/\n/g, ' ').trim();
        if (txt && txt.length > 2 && !txt.includes('TL')) { meta.publisher = txt; break; }
      }
    }
  }
  
  if (!meta.pageCount) {
    const labels = doc.querySelectorAll('td, th, span, div, li, strong, b');
    for (const el of labels) {
      if (meta.pageCount) break;
      const text = el.textContent.replace(/\n/g, ' ').trim().toLowerCase();
      if (text === 'sayfa sayısı:' || text === 'sayfa sayısı' || text === 'sayfa sayisi:' || text === 'sayfa sayisi') {
        
        let val = null;

        // 1. Doğrudan Text Node kontrolü (<b>Sayfa Sayısı:</b> 1080)
        if (el.nextSibling && el.nextSibling.nodeType === 3) {
          val = el.nextSibling.nodeValue.trim();
        }
        
        // 2. Kardeş element kontrolü (<span>Sayfa Sayısı:</span> <span>1080</span>)
        if (!val && el.nextElementSibling) {
          val = el.nextElementSibling.textContent.trim();
        }

        // 3. Ebeveyn kontrolü (Geriye kalan tüm metin içinde, "sayfa sayısı" ifadesinden SONRAKİ ilk sayıyı bul)
        if (!val && el.parentElement) {
          const parentText = el.parentElement.textContent.replace(/\n/g, ' ');
          const labelIndex = parentText.toLowerCase().indexOf(text);
          if (labelIndex !== -1) {
             val = parentText.substring(labelIndex + text.length).trim();
          }
        }

        if (val) {
          const match = val.match(/\d+/);
          if (match && parseInt(match[0]) > 0 && parseInt(match[0]) < 5000) {
            meta.pageCount = match[0];
          }
        }
      }
    }
  }

  const titleEl = doc.querySelector('title');
  if (titleEl) {
    meta._debug_title = titleEl.textContent.trim().substring(0, 50);
  }

  return meta;
};

const extractCover = (doc) => {
  let cover = '';
  
  // Güvenilir CSS sınıfları (Öncelikli arama)
  const selectors = ['.pr-img-src', '.product-image img', '.image img', '.product-cr img', '.img-inner img', '.prd-img'];
  for (let selector of selectors) {
    const img = doc.querySelector(selector);
    if (img) {
      const src = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('src') || '';
      if (src && !src.includes('empty') && !src.includes('blank') && !src.includes('lazy') && !src.startsWith('data:')) {
        return src;
      }
    }
  }

  // Bulamazsa sayfadaki tüm resimleri tara
  const images = doc.querySelectorAll('img');
  for (const el of images) {
    if (cover) break;
    let src = el.getAttribute('data-src') || el.getAttribute('data-original') || el.getAttribute('src') || '';
    
    const alt = (el.getAttribute('alt') || '').toLowerCase();
    const lowerSrc = src.toLowerCase();
    
    const isBad = lowerSrc.includes('logo') || lowerSrc.includes('icon') || lowerSrc.includes('banner') || 
                  lowerSrc.includes('blank') || lowerSrc.includes('empty') || lowerSrc.includes('lazy') ||
                  lowerSrc.includes('menu_item') || lowerSrc.includes('footer') || lowerSrc.includes('.svg') ||
                  lowerSrc.includes('sprite') || src.startsWith('data:') || alt.includes('banner');

    if (src && !isBad) {
      if (lowerSrc.includes('product') || lowerSrc.includes('getimage') || lowerSrc.includes('katalog') || 
          lowerSrc.includes('kitap') || lowerSrc.includes('cover') || lowerSrc.includes('nemesis')) {
        cover = src;
      }
    }
  }
  return cover;
};

const fetchPrice = async (siteName, url, extractFn) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const fetchUrl = WORKER_PROXY_URL + encodeURIComponent(url);

    // Browser üzerinden fetch kullanıyoruz (Axios'a gerek yok)
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
       throw new Error(`HTTP Error ${response.status}`);
    }

    const html = await response.text();
    
    // Güvenlik Duvarı (WAF / Bot Koruması) Kontrolü
    const isWafBlocked = html.includes('cf-browser-verification') || 
                         html.includes('cf-turnstile') || 
                         html.includes('Just a moment...') || 
                         html.includes('Enable JavaScript and cookies to continue');
                         
    if (isWafBlocked) {
      return { site: siteName, price: null, cover: null, metadata: { WAF_Engeli: true, _debug_title: 'Cloudflare / Güvenlik Duvarı Engeli' }, status: 'waf_blocked' };
    }

    // DOMParser ile HTML'i Parse Et
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const result = extractFn(doc);
    if (!result) return { site: siteName, price: null, cover: null, metadata: {}, status: 'error' };

    const metadata = result.metadata || {};

    const status = result.price !== null && !isNaN(result.price) ? 'success' : 'failed_or_bot_blocked';

    return {
      site: siteName,
      price: result.price,
      cover: result.cover || null,
      metadata: metadata,
      status: status
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.log(`[Frontend Scraper] ${siteName} hatası: ${error.message}`);
    
    // Eğer 403 (Yasak) veya 503 (Servis Yok) hatası dönerse bu da kesin bir güvenlik duvarı engelidir.
    const isFirewallError = error.message.includes('403') || error.message.includes('503');
    
    return { 
      site: siteName, 
      price: null, 
      cover: null, 
      metadata: isFirewallError ? { WAF_Engeli: true, Hata: error.message, _debug_title: 'HTTP Güvenlik Duvarı Engeli' } : { Hata: error.message }, 
      status: 'error', 
      error: error.message 
    };
  }
};

const scrapeBookPrices = async (isbn) => {
  if (!isbn) return null;
  const cleanIsbn = isbn.replace(/-/g, '').trim();

  // Tüm siteleri aynı anda (paralel) tara
  const results = await Promise.all([
    // 1. Kitapyurdu
    fetchPrice('Kitapyurdu', `https://www.kitapyurdu.com/index.php?route=product/search&filter_name=${cleanIsbn}`, (doc) => {
      let el = doc.querySelector('.price-new .value') || doc.querySelector('.price .value') || doc.querySelector('.product-price') || doc.querySelector('.prc-dsc');
      let priceText = el ? el.textContent : '';
      const price = parseTurkishPrice(priceText);
      return { price, cover: null, metadata: extractMetadata(doc) };
    }),

    // 2. BKM Kitap
    fetchPrice('BKM Kitap', `https://www.bkmkitap.com/arama?q=${cleanIsbn}`, (doc) => {
      let el = doc.querySelector('.current-price') || doc.querySelector('.product-price') || doc.querySelector('.urun_fiyati') || doc.querySelector('.discount-price');
      let priceText = el ? el.textContent : '';
      const price = parseTurkishPrice(priceText);
      return { price, cover: null, metadata: extractMetadata(doc) };
    }),

    // 3. Kitapsepeti (SADECE GÖRSEL BURADAN ÇEKİLECEK)
    fetchPrice('Kitapsepeti', `https://www.kitapsepeti.com/arama?q=${cleanIsbn}`, (doc) => {
      let el = doc.querySelector('.current-price') || doc.querySelector('.product-price');
      let priceText = el ? el.textContent : '';
      const price = parseTurkishPrice(priceText);
      return { price, cover: extractCover(doc), metadata: extractMetadata(doc) };
    }),

    // 4. Amazon TR
    fetchPrice('Amazon', `https://www.amazon.com.tr/s?k=${cleanIsbn}`, (doc) => {
      let el = doc.querySelector('.a-price .a-offscreen');
      let priceText = el ? el.textContent : '';
      if (!priceText) {
        const wholeEl = doc.querySelector('.a-price-whole');
        const fractionEl = doc.querySelector('.a-price-fraction');
        const priceWhole = wholeEl ? wholeEl.textContent.replace(/[^0-9]/g, '') : '';
        const priceFraction = fractionEl ? fractionEl.textContent.replace(/[^0-9]/g, '') : '';
        if (priceWhole) priceText = `${priceWhole}.${priceFraction || '00'}`;
      }
      const price = parseTurkishPrice(priceText) || parseFloat(priceText);
      return { price, cover: null, metadata: extractMetadata(doc) };
    }),

    // 5. D&R
    fetchPrice('D&R', `https://www.dr.com.tr/search?q=${cleanIsbn}`, (doc) => {
      let el = doc.querySelector('.campaign-price') || doc.querySelector('.prd-price') || doc.querySelector('.current-price') || doc.querySelector('.price') || doc.querySelector('#salePrice') || doc.querySelector('.product-price');
      let priceText = el ? el.textContent : '';
      const price = parseTurkishPrice(priceText);
      return { price, cover: null, metadata: extractMetadata(doc) }; // D&R'dan asla görsel çekilmemesi istendi
    })
  ]);

  const validResults = results.filter(r => r.price !== null && r.price > 0);
  let cheapest = null;
  if (validResults.length > 0) {
    cheapest = validResults.reduce((prev, curr) => (curr.price < prev.price ? curr : prev));
  }

  return {
    isbn: cleanIsbn,
    cheapest,
    all_results: results
  };
};
