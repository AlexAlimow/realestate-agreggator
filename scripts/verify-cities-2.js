const https = require('https');

function fetchStatus(url) {
  return new Promise((resolve) => {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };
    https.get(url, { headers }, (res) => {
      resolve({ code: res.statusCode, location: res.headers.location });
    }).on('error', () => resolve({ code: 500 }));
  });
}

const cities = [
  { name: 'Düsseldorf', id: 38, alt: 'Duesseldorf' },
  { name: 'Köln', id: 73, alt: 'Koeln' },
  { name: 'München', id: 90, alt: 'Muenchen' },
  { name: 'Münster', id: 91, alt: 'Muenster' },
  { name: 'Nürnberg', id: 96, alt: 'Nuernberg' },
  { name: 'Saarbrücken', id: 116, alt: 'Saarbruecken' },
  { name: 'Würzburg', id: 141, alt: 'Wuerzburg' },
  { name: 'Stuttgart', id: 124 }, // Re-check Stuttgart
  { name: 'Potsdam', id: 107 }    // Re-check Potsdam
];

(async () => {
  console.log('Verifying failed cities...');
  for (const city of cities) {
    const nameToCheck = city.alt || city.name;
    const url = `https://www.wg-gesucht.de/wg-zimmer-in-${nameToCheck}.${city.id}.0.1.0.html`;
    const res = await fetchStatus(url);
    if (res.code === 200 || res.code === 301 || res.code === 302) {
      console.log(`✅ ${city.name} (${nameToCheck}): ${city.id} -> ${res.code}`);
    } else {
      console.log(`❌ ${city.name} (${nameToCheck}): ${city.id} -> ${res.code}`);
    }
  }
})();
