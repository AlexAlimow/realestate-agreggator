import * as cheerio from "cheerio";
import puppeteer from "puppeteer";
import { normalizeCityName } from "../utils/cityHelper";

export interface ListingFilters {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  rooms?: number;
  minArea?: number;
  maxArea?: number;
  balcony?: boolean;
  kitchen?: boolean;
  garden?: boolean;
  lift?: boolean;
  furnished?: boolean;
  parking?: boolean;
  petsAllowed?: boolean;
}

// Маппинг городов для WG-Gesucht (кэш)
// IDs verified via script (return 302/200)
const cityIdCache: Record<string, string> = {
  "Aachen": "1",
  "Augsburg": "2",
  "Berlin": "8",
  "Bielefeld": "10",
  "Bochum": "11",
  "Bonn": "13",
  "Bremen": "14",
  "Dortmund": "33",
  "Dresden": "27",
  "Duisburg": "29",
  "Düsseldorf": "38",
  "Duesseldorf": "38",
  "Erfurt": "39",
  "Essen": "40",
  "Frankfurt": "41",
  "Frankfurt am Main": "41",
  "Freiburg": "43",
  "Freiburg im Breisgau": "43",
  "Hamburg": "55",
  "Hannover": "57",
  "Heidelberg": "59",
  "Karlsruhe": "68",
  "Kiel": "71",
  "Köln": "73",
  "Koeln": "73",
  "Cologne": "73",
  "Leipzig": "77",
  "Mainz": "80",
  "Mannheim": "81",
  "München": "90",
  "Muenchen": "90",
  "Munich": "90",
  "Münster": "91",
  "Muenster": "91",
  "Nürnberg": "96",
  "Nuernberg": "96",
  "Paderborn": "103",
  "Potsdam": "107",
  "Regensburg": "109",
  "Rostock": "113",
  "Saarbrücken": "116",
  "Stuttgart": "124",
  "Wiesbaden": "136",
  "Würzburg": "141",
  "Wuerzburg": "141",
  "Osnabrück": "102",
  "Oldenburg": "100",
  "Levarkusen": "76",
  "Darmstadt": "24",
  "Kassel": "69",
  "Halle": "53",
  "Magdeburg": "79",
  "Oberhausen": "98",
  "Lübeck": "78",
  "Chemnitz": "20",
  "Gelsenkirchen": "46",
  "Braunschweig": "15",
  "Trier": "126"
};

async function getWGCityId(city: string): Promise<string | undefined> {
  // 1. Проверяем кэш
  const normalizedCity = city.toLowerCase()
    .replace(/ü/g, 'u') // Simple replace for key matching
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ß/g, 'ss')
    .replace(/\s+/g, '-');
  
  // Check exact match or simple normalized match
  for (const [key, value] of Object.entries(cityIdCache)) {
    if (key.toLowerCase() === city.toLowerCase() || 
        key.toLowerCase().replace(/ü/g, 'u').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ß/g, 'ss') === normalizedCity) {
      return value;
    }
  }

  // 2. Если это число, считаем что это ID
  if (/^\d+$/.test(city)) {
    return city;
  }

  // 3. API больше не работает (404/403), поэтому полагаемся только на кэш и ручной ввод ID
  console.warn(`[WG-Gesucht] City ID not found for "${city}". Please add it to the cache or use ID directly.`);
  
  return undefined;
}

export async function fetchWG(filters: ListingFilters) {
  try {
    const city = filters.city || "Berlin";
    
    // Получаем ID города динамически
    const cityId = await getWGCityId(city);
    
    // Нормализуем имя для URL используя helper (обрабатывает Munich -> muenchen, etc.)
    const citySlug = normalizeCityName(city);
    
    // Строим параметры
    const params = new URLSearchParams();
    params.append("category", "0"); // Wohnungen
    params.append("rent_type", "0"); // Miete
    params.append("sort_order", "0"); // Neueste zuerst
    params.append("noDeact", "1");
    
    if (cityId) {
      params.append("city_id", cityId);
    }
    if (filters.minPrice) params.append("rent_price_min", filters.minPrice.toString());
    if (filters.maxPrice) params.append("rent_price_max", filters.maxPrice.toString());
    if (filters.rooms) params.append("room_nr", filters.rooms.toString());
    if (filters.minArea) params.append("flat_size_min", filters.minArea.toString());
    if (filters.maxArea) params.append("flat_size_max", filters.maxArea.toString());

    // Если есть cityId, используем правильный формат: wg-zimmer-in-[Slug].[ID].0.1.0.html
    const url = cityId 
      ? `https://www.wg-gesucht.de/wg-zimmer-in-${citySlug}.${cityId}.0.1.0.html?${params.toString()}`
      : `https://www.wg-gesucht.de/wg-zimmer-in-${citySlug}.0.1.0.html?${params.toString()}`;
    
    console.log(`[WG-Gesucht] Fetching via Puppeteer: ${url}`);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      
      // Navigate
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Check for Bot Check or Cookie Banner
      const title = await page.title();
      if (title.includes('Überprüfung') || title.includes('Bot Check')) {
          console.log('[WG-Gesucht] Bot check detected. Attempting to bypass...');
          // Try to find and click the checkbox/button if simple
          try {
              const button = await page.$('button[type="submit"], input[type="submit"]');
              if (button) {
                  await button.click();
                  await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {});
              }
          } catch (e) {
              console.log('[WG-Gesucht] Bypass attempt failed.');
          }
      }

      // Get content
      const content = await page.content();
      const $ = cheerio.load(content);
      const results: any[] = [];

      // Парсим результаты WG-Gesucht
      $('.offer_list_item').each((i, el) => {
        try {
          const $el = $(el);
          // Only process actual listings, not ads
          if ($el.hasClass('display-none')) return;

          const allText = $el.text();
          
          // Заголовок
          const title = $el.find('h3 a, .truncate_title a, .list-details-link').text().trim() ||
                       $el.find('h3, .truncate_title').text().trim();
          
          // Цена
          const priceText = $el.find('.detailansicht b, .col-xs-3 b, [data-price]').first().text().trim() ||
                           $el.find('.middle b').first().text().trim();
          const price = parseInt(priceText.replace(/[^\d]/g, "")) || 0;

          // Детали (комнаты, площадь)
          const detailsText = $el.find('.detail_size, .col-xs-3, .row .col-xs-3').text();
          let rooms = 0;
          let area = 0;
          
          // Парсим комнаты
          const roomsMatch = detailsText.match(/(\d+)\s*Zimmer/i) || detailsText.match(/(\d+)\s*ZKB/i);
          if (roomsMatch) {
            rooms = parseInt(roomsMatch[1]);
          }
          
          // Парсим площадь
          const areaMatch = detailsText.match(/(\d+)\s*m²/i) || detailsText.match(/(\d+)\s*qm/i);
          if (areaMatch) {
            area = parseInt(areaMatch[1]);
          }

          // Ссылка
          const href = $el.find('a.detailansicht').first().attr('href') || 
                       $el.find('a.list-details-link').first().attr('href') || '';
          const itemUrl = href.startsWith('http') ? href : `https://www.wg-gesucht.de${href}`;

          // Изображение
          const image = $el.find('.card_image img').first().attr('src') || 
                       $el.find('.card_image img').first().attr('data-src') || null;

          // Дата (approximate)
          const date = new Date().toISOString();

          // Парсим характеристики из текста
          const lowerText = allText.toLowerCase();
          const balcony = lowerText.includes('balkon') || lowerText.includes('terrasse');
          const kitchen = lowerText.includes('einbauküche') || lowerText.includes('ebk') || lowerText.includes('küche');
          const garden = lowerText.includes('garten');
          const lift = lowerText.includes('aufzug') || lowerText.includes('fahrstuhl') || lowerText.includes('lift');
          const furnished = lowerText.includes('möbliert');
          const parking = lowerText.includes('stellplatz') || lowerText.includes('garage') || lowerText.includes('parkplatz');
          const petsAllowed = lowerText.includes('haustier');

          if (title && price > 0) {
            results.push({
              source: "WG-Gesucht",
              title,
              price,
              rooms,
              city: city,
              area,
              furnished,
              petsAllowed,
              balcony,
              parking,
              kitchen,
              garden,
              lift,
              url: itemUrl,
              date,
              image: image?.startsWith('http') ? image : image ? `https://www.wg-gesucht.de${image}` : null,
            });
          }
        } catch (err) {
          console.error("Error parsing WG-Gesucht item:", err);
        }
      });

      console.log(`[WG-Gesucht] Found ${results.length} listings via Puppeteer.`);
      return results.slice(0, 50);

    } catch (err: any) {
      console.error("WG-Gesucht Puppeteer error:", err.message);
      return [];
    } finally {
      await browser.close();
    }
  } catch (err: any) {
    console.error("WG-Gesucht fetch error:", err.message);
    return [];
  }
}

// Helper removed as we use Puppeteer's content
/*
function parseDate(dateText: string): string | null {
   // ...
}
*/
