export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.searchParams.get('url');

    // Eğer parametre olarak URL verilmediyse hata dön
    if (!target) {
      return new Response('Lütfen ?url= parametresi ile hedef adresi belirtin.', { status: 400 });
    }

    try {
      const targetUrl = new URL(target);
      
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

      // Kritik Nokta: CORS Damgasını vur! (Tarayıcının okumasına izin ver)
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      newResponse.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
      newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');

      return newResponse;

    } catch (error) {
      return new Response('Proxy Hatası: ' + error.message, { status: 500 });
    }
  }
};
