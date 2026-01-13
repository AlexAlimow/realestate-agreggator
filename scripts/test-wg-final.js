// const { fetchWG } = require('../services/wgGesucht'); 

const https = require('https');
const cheerio = require('cheerio');

// Mock helpers
function normalizeCityName(city) {
  const map = { "munich": "muenchen", "cologne": "koeln" };
  let n = map[city.toLowerCase()] || city.toLowerCase();
  return n.replace(/ü/g, 'ue').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ß/g, 'ss').replace(/\s+/g, '-');
}

const cityIdCache = {
  "Berlin": "8",
  "Potsdam": "107",
  "Stuttgart": "124",
  "Muenchen": "90",
  "Munich": "90"
};

async function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.wg-gesucht.de/'
    };
    https.get(url, { headers }, (res) => {
      let data = '';
      if (res.statusCode !== 200) {
         // Handle 301/302 redirects by following them (WG-Gesucht does this)
         if (res.statusCode === 301 || res.statusCode === 302) {
            console.log(`Following redirect to ${res.headers.location}`);
            return fetchHtml(res.headers.location).then(resolve).catch(reject);
         }
         return reject(new Error(`Status ${res.statusCode}`));
      }
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function testSearch(city) {
  console.log(`Testing search for ${city}...`);
  const cityId = cityIdCache[city] || cityIdCache[normalizeCityName(city)] || "8"; // Default to Berlin if missing for test
  // In real code we have a huge cache.
  
  const slug = normalizeCityName(city);
  const url = `https://www.wg-gesucht.de/wg-zimmer-in-${slug}.${cityId}.0.1.0.html?category=0&rent_type=0&sort_order=0&noDeact=1&city_id=${cityId}`;
  
  console.log(`URL: ${url}`);
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const count = $('.offer_list_item').length;
    console.log(`Found ${count} listings.`);
    
    // Check if we got listings
    if (count > 0) {
       const firstTitle = $('.offer_list_item').first().find('h3').text().trim();
       console.log(`First listing: ${firstTitle}`);
    } else {
       // Maybe layout changed?
       console.log("No listings found. HTML preview:");
       console.log(html.substring(0, 500));
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

(async () => {
  await testSearch("Berlin");
  await testSearch("Potsdam");
  await testSearch("Stuttgart");
  await testSearch("Munich"); // Should work now
})();
