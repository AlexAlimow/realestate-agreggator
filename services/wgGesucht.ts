import axios from "axios";
import * as cheerio from "cheerio";

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export interface ListingFilters {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  rooms?: number;
  minArea?: number;
  maxArea?: number;
}

// Маппинг городов для WG-Gesucht
const cityMapping: Record<string, string> = {
  "Berlin": "8",
  "Munich": "90",
  "Hamburg": "55",
  "Frankfurt": "41",
  "Cologne": "73",
  "Stuttgart": "127",
  "Düsseldorf": "38",
  "Dortmund": "33",
  "Essen": "40",
  "Leipzig": "78",
};

export async function fetchWG(filters: ListingFilters) {
  try {
    const city = filters.city || "Berlin";
    // Пробуем найти ID города, если не найден - используем slug напрямую
    let cityId = cityMapping[city];
    if (!cityId) {
      // Для неизвестных городов пробуем найти по ключу без учета регистра
      const cityKey = Object.keys(cityMapping).find(
        key => key.toLowerCase() === city.toLowerCase()
      );
      cityId = cityKey ? cityMapping[cityKey] : null;
    }
    
    // Если город не найден в маппинге, пробуем использовать slug напрямую
    const citySlug = city.toLowerCase().replace(/\s+/g, "-");
    
    // Строим URL с параметрами
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

    // Если есть cityId, используем старый формат, иначе пробуем новый
    const url = cityId 
      ? `https://www.wg-gesucht.de/wg-zimmer-in-${citySlug}.${cityId}.0.1.0.html?${params.toString()}`
      : `https://www.wg-gesucht.de/wg-zimmer-in-${citySlug}.0.1.0.html?${params.toString()}`;
    
    let data = '';
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
          'Referer': 'https://www.wg-gesucht.de/',
        },
        timeout: 10000,
        validateStatus: (status) => status < 500, // Принимаем все кроме 5xx
      });
      
      // Если получили 404, значит город не поддерживается
      if (response.status === 404) {
        console.log(`[WG-Gesucht] City "${city}" not found (404). This city may not be supported by WG-Gesucht.`);
        return [];
      }
      
      data = response.data;
    } catch (err: any) {
      if (err.response?.status === 404) {
        console.log(`[WG-Gesucht] City "${city}" not found (404). This city may not be supported by WG-Gesucht.`);
        return [];
      }
      // Для других ошибок просто логируем и возвращаем пустой массив
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        console.warn(`[WG-Gesucht] Timeout for city "${city}"`);
      } else {
        console.warn(`[WG-Gesucht] Error for city "${city}":`, err.message || err);
      }
      return [];
    }

    const $ = cheerio.load(data);
    const results: any[] = [];

    // Парсим результаты WG-Gesucht
    $('.offer_list_item, [data-id]').each((i, el) => {
      try {
        const $el = $(el);
        
        // Заголовок
        const title = $el.find('h3 a, .truncate_title a, .list-details-link').text().trim() ||
                     $el.find('h3, .truncate_title').text().trim();
        
        // Цена
        const priceText = $el.find('.detailansicht, .col-xs-3, [data-price]').first().text().trim() ||
                         $el.find('.middle').first().text().trim();
        const price = parseInt(priceText.replace(/[^\d]/g, "")) || 0;

        // Детали (комнаты, площадь)
        const detailsText = $el.find('.detail_size, .col-xs-3').text();
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
        const href = $el.find('a').first().attr('href') || '';
        const url = href.startsWith('http') ? href : `https://www.wg-gesucht.de${href}`;

        // Изображение
        const image = $el.find('img').first().attr('src') || 
                     $el.find('img').first().attr('data-src') ||
                     $el.find('img').first().attr('data-lazy') || null;

        // Дата
        const dateText = $el.find('.detailansicht, .col-xs-3').last().text().trim();
        const date = parseDate(dateText) || new Date().toISOString();

        if (title && price > 0) {
          results.push({
            source: "WG-Gesucht",
            title,
            price,
            rooms,
            city: city,
            area,
            furnished: false,
            petsAllowed: false,
            balcony: false,
            parking: false,
            url,
            date,
            image: image?.startsWith('http') ? image : image ? `https://www.wg-gesucht.de${image}` : null,
          });
        }
      } catch (err) {
        console.error("Error parsing WG-Gesucht item:", err);
      }
    });

    return results.slice(0, 50);
  } catch (err: any) {
    console.error("WG-Gesucht fetch error:", err.message);
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