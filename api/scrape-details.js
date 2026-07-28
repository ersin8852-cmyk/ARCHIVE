const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    // Kitapyurdu'nda ISBN/Barkod genellikle 'attributes' tablosunda yer alır.
    let isbn = '';
    let pageCount = 0;
    let year = '';

    $('table.attributes tr').each((i, el) => {
      const text = $(el).text().toLowerCase();
      if (text.includes('isbn') || text.includes('barkod')) {
        isbn = $(el).find('td').last().text().trim().replace(/\D/g, '');
      }
      if (text.includes('sayfa')) {
        pageCount = parseInt($(el).find('td').last().text().trim().replace(/\D/g, ''), 10) || 0;
      }
      if (text.includes('yayın tarihi') || text.includes('yayin tarihi')) {
        const yearMatch = $(el).find('td').last().text().match(/\d{4}/);
        if (yearMatch) year = yearMatch[0];
      }
    });

    res.status(200).json({
      isbn,
      pageCount,
      year
    });

  } catch (error) {
    console.error('Scrape Details Error:', error.message);
    res.status(500).json({ error: 'Failed to scrape detail page', details: error.message });
  }
};
