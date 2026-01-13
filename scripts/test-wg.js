const https = require('https');

// Mimic fetchHtml for testing
function fetchHtml(url, options = {}) {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      ...options.headers
    };

    https.get(url, { headers }, (res) => {
      let data = '';

      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log(`Redirecting to ${res.headers.location}`);
        return fetchHtml(res.headers.location, options).then(resolve).catch(reject);
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`URL: ${url} | Status: ${res.statusCode}`);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          resolve(`Error: ${res.statusCode}`);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

(async () => {
  // Test "No ID" URLs
  const urls = [
    'https://www.wg-gesucht.de/wg-zimmer-in-Potsdam.html',
    'https://www.wg-gesucht.de/wohnungen-in-Potsdam.html',
    'https://www.wg-gesucht.de/1-zimmer-wohnungen-in-Potsdam.html',
    'https://www.wg-gesucht.de/wg-zimmer-in-Berlin.html' // Berlin is ID 8, usually works with ID
  ];

  for (const url of urls) {
    await fetchHtml(url);
  }
})();
