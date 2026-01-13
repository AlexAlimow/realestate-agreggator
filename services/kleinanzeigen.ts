import * as cheerio from "cheerio";
import { fetchHtml } from "../utils/httpClient";
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

export async function fetchKleinanzeigen(filters: ListingFilters) {
  try {
    const city = filters.city || "Berlin";
    const citySlug = normalizeCityName(city);
    
    let url: string;

    if (citySlug === "trier") {
      url = "https://www.kleinanzeigen.de/s-wohnung-mieten/trier/c203l5432";
    } else {
      url = `https://www.kleinanzeigen.de/s-wohnungen/${citySlug}/c203`;
    }
    
    console.log(`[Kleinanzeigen] Fetching: ${url}`);
    
    const data = await fetchHtml(url, {
      headers: {
        'Referer': 'https://www.kleinanzeigen.de/',
      }
    });

    const $ = cheerio.load(data);
    const results: any[] = [];

    // Пробуем разные селекторы
    const selectors = [
      '[data-adid]',
      '.ad-listitem',
      'article[data-adid]',
      '.aditem',
      '[id^="ad-"]',
    ];

    let foundItems = false;

    for (const selector of selectors) {
      const items = $(selector);
      if (items.length > 0) {
        console.log(`[Kleinanzeigen] Found ${items.length} items with selector: ${selector}`);
        foundItems = true;
        
        items.each((i, el) => {
          try {
            const $el = $(el);
            const allText = $el.text();
            
            // Заголовок - пробуем разные варианты
            let title = '';
            const titleSelectors = [
              '.aditem-main h2 a',
              'h2 a',
              'h3 a',
              '.ellipsis a',
              'a[href*="/s-anzeige/"]',
              '.aditem-main--top--left a',
              '[class*="title"] a',
            ];
            
            for (const selector of titleSelectors) {
              title = $el.find(selector).first().text().trim();
              if (title) break;
            }
            
            // Если не нашли через селекторы, ищем любую ссылку с текстом
            if (!title) {
              $el.find('a').each((_, link) => {
                const linkText = $(link).text().trim();
                if (linkText && linkText.length > 10 && linkText.length < 200) {
                  title = linkText;
                  return false; // break
                }
              });
            }
            
            // Цена - пробуем разные варианты
            let price = 0;
            const priceSelectors = [
              '.aditem-main .aditem-price',
              '.aditem-price',
              '.aditem-details strong',
              '[class*="price"]',
            ];
            
            for (const selector of priceSelectors) {
              const priceText = $el.find(selector).first().text().trim();
              if (priceText) {
                price = parseInt(priceText.replace(/[^\d]/g, ""));
                if (price > 0) break;
              }
            }
            
            // Если не нашли через селекторы, ищем в тексте
            if (price === 0) {
              const priceMatch = allText.match(/(\d{1,3}(?:\.\d{3})*)\s*€/);
              if (priceMatch) {
                price = parseInt(priceMatch[1].replace(/\./g, ''));
              }
            }

            // Комнаты и площадь из всего текста элемента
            let rooms = 0;
            let area = 0;
            
            const roomsMatch = allText.match(/(\d+)\s*Zimmer/i) || allText.match(/(\d+)\s*ZKB/i);
            if (roomsMatch) {
              rooms = parseInt(roomsMatch[1]);
            }
            
            const areaMatch = allText.match(/(\d+)\s*m²/i) || allText.match(/(\d+)\s*qm/i);
            if (areaMatch) {
              area = parseInt(areaMatch[1]);
            }

            // Ссылка - пробуем разные варианты
            let href = '';
            const linkSelectors = [
              'a[href*="/s-anzeige/"]',
              'a[href*="/anzeige/"]',
              '.aditem-main a',
              'h2 a',
              'h3 a',
            ];
            
            for (const selector of linkSelectors) {
              href = $el.find(selector).first().attr('href') || '';
              if (href) break;
            }
            
            // Если не нашли, берем первую ссылку
            if (!href) {
              href = $el.find('a').first().attr('href') || '';
            }
            
            const url = href.startsWith('http') ? href : href ? `https://www.kleinanzeigen.de${href}` : '';

            // Изображение
            const image = 
              $el.find('img[data-src]').first().attr('data-src') ||
              $el.find('img[data-lazy]').first().attr('data-lazy') ||
              $el.find('img').first().attr('src') ||
              null;

            // Парсим характеристики из текста
            const lowerText = allText.toLowerCase();
            const balcony = lowerText.includes('balkon') || lowerText.includes('terrasse') || lowerText.includes('loggia');
            const kitchen = lowerText.includes('einbauküche') || lowerText.includes('ebk') || lowerText.includes('küche');
            const garden = lowerText.includes('garten');
            const lift = lowerText.includes('aufzug') || lowerText.includes('fahrstuhl') || lowerText.includes('lift');
            const furnished = lowerText.includes('möbliert');
            const parking = lowerText.includes('stellplatz') || lowerText.includes('garage') || lowerText.includes('parkplatz');
            const petsAllowed = lowerText.includes('haustier');

            // Проверяем, что есть хотя бы заголовок или цена
            if ((title || price > 0) && url) {
              results.push({
                source: "Kleinanzeigen",
                title: title || 'Wohnung',
                price: price || 0,
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
                url,
                date: new Date().toISOString(),
                image: image?.startsWith('http') ? image : image ? `https://www.kleinanzeigen.de${image}` : null,
              });
            }
          } catch (err) {
            console.error("[Kleinanzeigen] Error parsing item:", err);
          }
        });
        
        if (results.length > 0) break;
      }
    }

    if (!foundItems) {
      console.log("[Kleinanzeigen] No items found with any selector. HTML length:", data.length);
    }

    console.log(`[Kleinanzeigen] Found ${results.length} results`);
    
    // Если нашли элементы, но не смогли извлечь данные, выводим отладочную информацию
    if (foundItems && results.length === 0) {
      console.warn("[Kleinanzeigen] Found items but couldn't extract data. Trying to debug...");
      const firstItem = $('[data-adid], .ad-listitem').first();
      if (firstItem.length > 0) {
        console.log("[Kleinanzeigen] First item HTML sample:", firstItem.html()?.substring(0, 500));
        console.log("[Kleinanzeigen] First item text:", firstItem.text()?.substring(0, 200));
      }
    }
    
    return results.slice(0, 50);
  } catch (err: any) {
    console.error("[Kleinanzeigen] Fetch error:", err.message);
    if (err.response) {
      console.error("[Kleinanzeigen] Response status:", err.response.status);
    }
    return [];
  }
}

function parseDate(dateText: string): string | null {
  if (!dateText) return null;
  
  const now = new Date();
  const lowerText = dateText.toLowerCase();
  
  if (lowerText.includes('heute') || lowerText.includes('today')) {
    return now.toISOString();
  }
  if (lowerText.includes('gestern') || lowerText.includes('yesterday')) {
    now.setDate(now.getDate() - 1);
    return now.toISOString();
  }
  
  // Формат "vor X Stunden/Tagen"
  const hoursMatch = dateText.match(/vor\s+(\d+)\s+Stunden?/i);
  if (hoursMatch) {
    now.setHours(now.getHours() - parseInt(hoursMatch[1]));
    return now.toISOString();
  }
  
  const daysMatch = dateText.match(/vor\s+(\d+)\s+Tagen?/i);
  if (daysMatch) {
    now.setDate(now.getDate() - parseInt(daysMatch[1]));
    return now.toISOString();
  }
  
  const dateMatch = dateText.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    return new Date(`${year}-${month}-${day}`).toISOString();
  }
  
  return null;
}
