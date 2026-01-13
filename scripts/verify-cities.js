const https = require('https');

function fetchStatus(url) {
  return new Promise((resolve) => {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };
    https.get(url, { headers }, (res) => {
      resolve(res.statusCode);
    }).on('error', () => resolve(500));
  });
}

const cities = [
  { name: 'Aachen', id: 1 },
  { name: 'Augsburg', id: 2 },
  { name: 'Berlin', id: 8 },
  { name: 'Bielefeld', id: 10 },
  { name: 'Bochum', id: 11 },
  { name: 'Bonn', id: 13 },
  { name: 'Bremen', id: 14 },
  { name: 'Dortmund', id: 33 },
  { name: 'Dresden', id: 27 },
  { name: 'Duisburg', id: 29 },
  { name: 'Düsseldorf', id: 38 },
  { name: 'Erfurt', id: 39 },
  { name: 'Essen', id: 40 },
  { name: 'Frankfurt', id: 41 },
  { name: 'Freiburg', id: 43 },
  { name: 'Hamburg', id: 55 },
  { name: 'Hannover', id: 57 },
  { name: 'Heidelberg', id: 59 },
  { name: 'Karlsruhe', id: 68 },
  { name: 'Kiel', id: 71 },
  { name: 'Köln', id: 73 },
  { name: 'Leipzig', id: 77 },
  { name: 'Mainz', id: 80 },
  { name: 'Mannheim', id: 81 },
  { name: 'München', id: 90 },
  { name: 'Münster', id: 91 },
  { name: 'Nürnberg', id: 96 },
  { name: 'Paderborn', id: 103 },
  { name: 'Potsdam', id: 107 },
  { name: 'Regensburg', id: 109 },
  { name: 'Rostock', id: 113 },
  { name: 'Saarbrücken', id: 116 },
  { name: 'Stuttgart', id: 124 }, 
  { name: 'Wiesbaden', id: 136 },
  { name: 'Würzburg', id: 141 }
];

(async () => {
  console.log('Verifying city IDs...');
  for (const city of cities) {
    // Normal format: wg-zimmer-in-[City].[ID].0.1.0.html
    const url = `https://www.wg-gesucht.de/wg-zimmer-in-${city.name}.${city.id}.0.1.0.html`;
    const status = await fetchStatus(url);
    if (status === 200) {
      console.log(`✅ ${city.name}: ${city.id}`);
    } else {
      console.log(`❌ ${city.name}: ${city.id} (Status: ${status})`);
      // Try nearby IDs if failed? No, too slow.
    }
  }
})();
