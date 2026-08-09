export default {
  async fetch(request) {
    // 1. CORS Origin Whitelist Kontrolü
    const origin = request.headers.get('Origin') || '';
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5500',
      'http://127.0.0.1:5500'
    ];
    const isVercel = origin.endsWith('.vercel.app');
    const isAllowedOrigin = isVercel || allowedOrigins.includes(origin);

    // OPTIONS (Preflight) isteği için hızlı yanıt
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': isAllowedOrigin ? origin : '',
          'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Accept',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    const url = new URL(request.url);
    const target = url.searchParams.get('url');

    // Eğer parametre olarak URL verilmediyse hata dön
    if (!target) {
      return new Response('Lütfen ?url= parametresi ile hedef adresi belirtin.', { status: 400 });
    }

    try {
      const targetUrl = new URL(target);
      const hostname = targetUrl.hostname.toLowerCase();
      
      // 2. Hedef Site (Target) Whitelist Kontrolü
      const allowedDomains = [
        'kitapyurdu.com',
        'bkmkitap.com',
        'kitapsepeti.com',
        'amazon.com.tr',
        'dr.com.tr'
      ];
      
      // Domain veya subdomain (www.kitapyurdu.com) kontrolü
      const isAllowedDomain = allowedDomains.some(domain => hostname === domain || hostname.endsWith('.' + domain));
      
      if (!isAllowedDomain) {
        return new Response('Güvenlik İhlali: Bu proxy sadece izin verilen kitap sitelerine istek yapabilir.', { status: 403 });
      }
      
      // Gelen isteğin başlıklarını (headers) kopyala
      const proxyHeaders = new Headers(request.headers);
      
      // Bizi ele verebilecek başlıkları sil (CORS vs.)
      proxyHeaders.delete('Origin');
      proxyHeaders.delete('Referer');
      
      // Güçlü ve gerçekçi bir Tarayıcı (User-Agent) taklidi yap
      proxyHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      proxyHeaders.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8');
      proxyHeaders.set('Accept-Language', 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7');

      // Hedef siteye (Amazon, Kitapyurdu vb.) isteği gönder
      const response = await fetch(targetUrl.toString(), {
        method: request.method,
        headers: proxyHeaders,
        redirect: 'follow'
      });

      // Hedef siteden gelen yanıtı (HTML) al
      const responseBody = await response.text();
      const newResponse = new Response(responseBody, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });

      // Klinik Nokta: CORS Damgasını vur! (Sadece izin verilen originlere)
      if (isAllowedOrigin) {
        newResponse.headers.set('Access-Control-Allow-Origin', origin);
      }
      newResponse.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
      newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Accept');

      return newResponse;

    } catch (error) {
      return new Response('Proxy Hatası: ' + error.message, { status: 500 });
    }
  }
};
