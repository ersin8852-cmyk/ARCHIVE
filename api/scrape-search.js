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

  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Missing q parameter' });
  }

  try {
    const SCRAPER_API_KEY = 'c0d4a59821e1421aaaae1b259259c38e';
    const targetUrl = `https://www.kitapyurdu.com/index.php?route=product/search&filter_name=${encodeURIComponent(q)}`;
    const url = `http://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}`;
    
    const response = await axios.get(url, {
      timeout: 15000 // ScraperAPI can be a bit slower
    });

    const $ = cheerio.load(response.data);
    const results = [];

    $('.product-cr').each((i, el) => {
      if (i >= 8) return; // Maksimum 8 sonuç

      const title = $(el).find('.name a').text().trim();
      const author = $(el).find('.author a').text().trim() || $(el).find('.author').text().trim();
      const publisher = $(el).find('.publisher a').text().trim() || $(el).find('.publisher').text().trim();
      
      let cover = $(el).find('.image img').attr('src') || '';
      if (cover) {
        cover = cover.replace('/s/1/', '/s/0/');
      }

      const href = $(el).find('.name a').attr('href') || '';
      
      if (title) {
        results.push({
          title,
          author,
          publisher,
          cover,
          href
        });
      }
    });

    res.status(200).json(results);

  } catch (error) {
    console.error('Scrape Search Error:', error.message);
    res.status(500).json({ error: 'Failed to scrape search results', details: error.message });
  }
};
