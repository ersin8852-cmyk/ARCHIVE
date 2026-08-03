window.ai = {
  getApiKey: () => localStorage.getItem('gemini_api_key'),
  
  setApiKey: (key) => {
    if (key) {
      localStorage.setItem('gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  },
  
  correctBookData: async (title, author, showToast = console.log) => {
    const apiKey = window.ai.getApiKey();
    if (!apiKey) return null;
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    const prompt = `Sen sadece kitap ve yazar isimlerindeki bozuk veya eksik Türkçe karakterleri düzelten bir araçsın (Deasciifier). 
Sana bir JSON vereceğim. İçindeki "title" ve "author" değerlerindeki Türkçe karakter hatalarını düzeltip (Örn: "Alayci Kus" -> "Alaycı Kuş", "Dostoyevski" -> "Dostoyevski") SADECE düzeltilmiş JSON'u döndür. Sadece düzelt, anlamını veya dilini değiştirme. İngilizce bir kitapsa dokunma. Markdown (backtick) kullanma, saf JSON metni döndür.

Girdi:
{ "title": "${title}", "author": "${author}" }
`;
    try {
      showToast(`AI'a gönderiliyor: ${title}`, 'info');
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1 }
        })
      });
      
      if (!response.ok) {
        const errText = await response.text();
        showToast(`AI API Hatası: ${errText.substring(0, 60)}`, 'error');
        return null;
      }
      
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        showToast('AI boş yanıt döndürdü!', 'error');
        return null;
      }
      
      showToast(`AI Ham Yanıtı: ${text.substring(0, 60)}`, 'info');
      
      const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      
      if (parsed.title === title && parsed.author === author) {
        showToast('AI: Değişikliğe gerek görmedi.', 'info');
        return null;
      }
      return parsed;
    } catch (err) {
      showToast(`AI Ayrıştırma Hatası: ${err.message}`, 'error');
      console.error("AI correction error:", err);
      return null;
    }
  }
};
