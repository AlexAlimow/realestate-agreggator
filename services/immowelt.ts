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

export async function fetchImmowelt(filters: ListingFilters) {
  try {
    const city = filters.city || "Berlin";
    const citySlug = normalizeCityName(city);
    
    // Construct URL with query parameters for better filtering at source
    const params = new URLSearchParams();
    if (filters.minPrice) params.append("pmi", filters.minPrice.toString());
    if (filters.maxPrice) params.append("pma", filters.maxPrice.toString());
    if (filters.minArea) params.append("ami", filters.minArea.toString());
    if (filters.maxArea) params.append("ama", filters.maxArea.toString());
    if (filters.rooms) params.append("r", filters.rooms.toString());
    
    // Feature filters for Immowelt (experimental mapping)
    // eq: Equipment IDs
    // 1: Balkon/Terrasse
    // 2: Garten
    // 3: Einbauküche
    // 4: Aufzug
    // 5: Garage/Stellplatz
    // This is a guess based on common patterns, but safer to rely on text parsing for now
    // or add them if we are sure. Let's try adding them to URL as it helps if it works.
    const equipment: number[] = [];
    if (filters.balcony) equipment.push(1);
    if (filters.garden) equipment.push(2);
    if (filters.kitchen) equipment.push(3);
    if (filters.lift) equipment.push(4);
    if (filters.parking) equipment.push(5);
    
    if (equipment.length > 0) {
      equipment.forEach(eq => params.append("eq", eq.toString()));
    }

    params.append("sort", "createdDate"); // Sort by newest

    const url = `https://www.immowelt.de/liste/${citySlug}/wohnungen/mieten?${params.toString()}`;
    
    console.log(`[Immowelt] Fetching: ${url}`);
    
    const data = await fetchHtml(url, {
      headers: {
        'Referer': 'https://www.immowelt.de/',
      }
    });

    const $ = cheerio.load(data);
    const results: any[] = [];

    // Пробуем разные селекторы
    const selectors = [
      '[data-estate-id]',
      '.EstateItem-1c115',
      '.estate-item',
      'article[data-estate-id]',
      '.estate',
      '[class*="EstateItem"]',
      '[class*="estate"]',
      'div[data-estate-id]',
      'a[href*="/immobilie/"]',
    ];

    let foundItems = false;

    for (const selector of selectors) {
      const items = $(selector);
      if (items.length > 0) {
        console.log(`[Immowelt] Found ${items.length} items with selector: ${selector}`);
        foundItems = true;
        
        // Если это ссылки, берем родительский элемент
        const itemsToProcess = selector.includes('a[href') 
          ? items.parent() 
          : items;
        
        itemsToProcess.each((i, el) => {
          try {
            const $el = $(el);
            const allText = $el.text();
            
            // Заголовок - пробуем разные варианты
            let title = '';
            const titleSelectors = [
              'h2 a',
              'h3 a',
              'h2',
              'h3',
              '[data-qa="estate-title"]',
              '.estate-title a',
              '.estate-title',
              'a[href*="/immobilie/"]',
              '[class*="title"]',
            ];
            
            for (const titleSelector of titleSelectors) {
              title = $el.find(titleSelector).first().text().trim();
              if (title && title.length > 5) break;
            }
            
            // Если не нашли, ищем любую ссылку с текстом
            if (!title) {
              $el.find('a').each((_, link) => {
                const linkText = $(link).text().trim();
                if (linkText && linkText.length > 10 && linkText.length < 200) {
                  title = linkText;
                  return false; // break
                }
              });
            }
            
            // Цена - ищем в тексте разными способами
            let price = 0;
            const pricePatterns = [
              /(\d{1,3}(?:\.\d{3})*)\s*€/,
              /(\d{1,3}(?:\s\d{3})*)\s*€/,
              /€\s*(\d{1,3}(?:\.\d{3})*)/,
              /(\d{1,3}(?:\.\d{3})*)\s*EUR/,
            ];
            
            for (const pattern of pricePatterns) {
              const match = allText.match(pattern);
              if (match) {
                price = parseInt(match[1].replace(/[.\s]/g, ''));
                if (price > 0) break;
              }
            }
            
            // Также пробуем найти через селекторы
            if (price === 0) {
              const priceSelectors = [
                '[class*="price"]',
                '[class*="Price"]',
                '[data-price]',
                '.key-facts',
              ];
              
              for (const priceSelector of priceSelectors) {
                const priceText = $el.find(priceSelector).first().text().trim();
                if (priceText) {
                  price = parseInt(priceText.replace(/[^\d]/g, ""));
                  if (price > 0) break;
                }
              }
            }

            // Комнаты и площадь
            let rooms = 0;
            let area = 0;
            
            const roomsMatch = allText.match(/(\d+[,.]?\d*)\s*Zimmer/i) || allText.match(/(\d+[,.]?\d*)\s*ZKB/i);
            if (roomsMatch) {
              rooms = Math.round(parseFloat(roomsMatch[1].replace(',', '.')));
            }
            
            const areaMatch = allText.match(/(\d+)\s*m²/i) || allText.match(/(\d+)\s*qm/i);
            if (areaMatch) {
              area = parseInt(areaMatch[1]);
            }

            // Ссылка - пробуем разные варианты
            let href = '';
            const linkSelectors = [
              'a[href*="/immobilie/"]',
              'a[href*="/expose/"]',
              'h2 a',
              'h3 a',
              '.estate-title a',
            ];
            
            for (const linkSelector of linkSelectors) {
              href = $el.find(linkSelector).first().attr('href') || '';
              if (href) break;
            }
            
            // Если не нашли, берем первую ссылку с /immobilie/
            if (!href) {
              $el.find('a').each((_, link) => {
                const linkHref = $(link).attr('href') || '';
                if (linkHref.includes('/immobilie/') || linkHref.includes('/expose/')) {
                  href = linkHref;
                  return false; // break
                }
              });
            }
            
            const url = href.startsWith('http') ? href : href ? `https://www.immowelt.de${href}` : '';

            // Изображение - пробуем разные варианты
            let image = null;
            const imageSelectors = [
              'img[data-src]',
              'img[data-lazy]',
              'img[data-original]',
              'picture img',
              '[class*="image"] img',
              '[class*="Image"] img',
              'img[src]',
            ];
            
            for (const imgSelector of imageSelectors) {
              const $img = $el.find(imgSelector).first();
              if ($img.length > 0) {
                image = 
                  $img.attr('data-src') ||
                  $img.attr('data-lazy') ||
                  $img.attr('data-original') ||
                  $img.attr('src') ||
                  null;
                
                if (image) {
                  image = sanitizeImageUrl(image);
                  break;
                }
              }
            }
            
            // Если не нашли в элементе, ищем в соседних элементах
            if (!image) {
              $el.siblings().each((_, sibling) => {
                const $sibling = $(sibling);
                const $img = $sibling.find('img').first();
                if ($img.length > 0) {
                  image = 
                    $img.attr('data-src') ||
                    $img.attr('data-lazy') ||
                    $img.attr('src') ||
                    null;
                  
                  if (image) {
                    image = sanitizeImageUrl(image);
                    return false; // break
                  }
                }
              });
            }

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
                source: "Immowelt",
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
                image: image ? sanitizeImageUrl(image) : null,
              });
            }
          } catch (err) {
            console.error("[Immowelt] Error parsing item:", err);
          }
        });
        
        if (results.length > 0) break;
      }
    }

    if (!foundItems) {
      console.log("[Immowelt] No items found with any selector. HTML length:", data.length);
      // Пробуем найти любые ссылки на недвижимость
      const links = $('a[href*="/immobilie/"], a[href*="/expose/"]');
      console.log(`[Immowelt] Found ${links.length} links to properties`);
      
      // Если нашли ссылки, пробуем парсить их напрямую
      if (links.length > 0 && results.length === 0) {
        console.log("[Immowelt] Trying to parse links directly...");
        links.slice(0, 20).each((i, link) => {
          try {
            const $link = $(link);
            const href = $link.attr('href') || '';
            const title = $link.text().trim() || $link.find('span').text().trim();
            
            // Ищем родительский контейнер объявления - более широкий поиск
            let $container = $link.closest('div[class*="estate"], div[class*="Estate"], article, li, section, div[class*="item"]');
            if ($container.length === 0) {
              $container = $link.closest('div, article, li, section');
            }
            if ($container.length === 0) {
              $container = $link.parent();
            }
            // Если контейнер слишком маленький, ищем выше
            if ($container.text().length < 50) {
              $container = $container.parent();
            }
            
            const allText = $container.text();
            
            // Ищем цену в тексте контейнера
            const priceMatch = allText.match(/(\d{1,3}(?:\.\d{3})*)\s*€/);
            const price = priceMatch ? parseInt(priceMatch[1].replace(/\./g, '')) : 0;
            
            // Ищем изображение в контейнере или рядом - более агрессивный поиск
            let image = null;
            
            // Функция для нормализации URL изображения
            const normalizeImageUrl = (imgSrc: string | null): string | null => {
              if (!imgSrc) return null;
              if (imgSrc.includes('placeholder') || imgSrc.includes('logo') || imgSrc.includes('icon')) return null;
              return sanitizeImageUrl(imgSrc);
            };
            
            // 1. Ищем все изображения в контейнере
            const allImages = $container.find('img');
            if (allImages.length > 0) {
              allImages.each((_, img) => {
                const $img = $(img);
                const imgSrc = 
                  $img.attr('data-src') ||
                  $img.attr('data-lazy') ||
                  $img.attr('data-original') ||
                  $img.attr('src') ||
                  null;
                
                image = normalizeImageUrl(imgSrc);
                if (image) return false; // break
              });
            }
            
            // 2. Если не нашли, ищем в родительском элементе (на уровень выше)
            if (!image) {
              const $parent = $container.parent();
              const parentImages = $parent.find('img');
              if (parentImages.length > 0) {
                parentImages.each((_, img) => {
                  const $img = $(img);
                  const imgSrc = 
                    $img.attr('data-src') ||
                    $img.attr('data-lazy') ||
                    $img.attr('src') ||
                    null;
                  
                  image = normalizeImageUrl(imgSrc);
                  if (image) return false; // break
                });
              }
            }
            
            // 3. Ищем в соседних элементах (предыдущий и следующий)
            if (!image) {
              $link.parent().siblings().each((_, sibling) => {
                const $sibling = $(sibling);
                const $img = $sibling.find('img').first();
                if ($img.length > 0) {
                  const imgSrc = 
                    $img.attr('data-src') ||
                    $img.attr('data-lazy') ||
                    $img.attr('src') ||
                    null;
                  
                  image = normalizeImageUrl(imgSrc);
                  if (image) return false; // break
                }
              });
            }
            
            // 4. Ищем в предыдущем/следующем элементе списка
            if (!image) {
              const $prev = $link.closest('li, div').prev();
              const $next = $link.closest('li, div').next();
              [$prev, $next].forEach($sibling => {
                if ($sibling.length > 0) {
                  const $img = $sibling.find('img').first();
                  if ($img.length > 0) {
                    const imgSrc = 
                      $img.attr('data-src') ||
                      $img.attr('data-lazy') ||
                      $img.attr('src') ||
                      null;
                    
                    image = normalizeImageUrl(imgSrc);
                    if (image) return false; // break
                  }
                }
              });
            }
            
            // 5. Пробуем найти изображение по ID объявления в HTML
            if (!image && href) {
              const idMatch = href.match(/\/immobilie\/(\d+)/);
              if (idMatch) {
                const estateId = idMatch[1];
                // Ищем элемент с data-estate-id или похожим атрибутом
                const $estateElement = $(`[data-estate-id="${estateId}"], [data-id="${estateId}"], [id*="${estateId}"]`);
                if ($estateElement.length > 0) {
                  const $img = $estateElement.find('img').first();
                  if ($img.length > 0) {
                    const imgSrc = 
                      $img.attr('data-src') ||
                      $img.attr('data-lazy') ||
                      $img.attr('src') ||
                      null;
                    image = normalizeImageUrl(imgSrc);
                  }
                }
              }
            }
            
            // 6. Последняя попытка - ищем все изображения на странице и пытаемся сопоставить по позиции
            // Это для случаев, когда изображения загружаются через JavaScript
            if (!image) {
              // Ищем все изображения Immowelt на странице
              const allPageImages = $('img[src*="immowelt"], img[data-src*="immowelt"], img[src*="mms.immowelt"]');
              if (allPageImages.length > 0) {
                // Пробуем найти изображение, которое находится рядом с нашей ссылкой по индексу
                const linkIndex = links.index(link);
                if (linkIndex >= 0 && linkIndex < allPageImages.length) {
                  const $nearbyImg = $(allPageImages[linkIndex]);
                  const imgSrc = 
                    $nearbyImg.attr('data-src') ||
                    $nearbyImg.attr('data-lazy') ||
                    $nearbyImg.attr('src') ||
                    null;
                  image = normalizeImageUrl(imgSrc);
                }
              }
            }
            
            // Логируем для отладки (только первые несколько)
            if (i < 5) {
              if (!image) {
                console.log(`[Immowelt] No image found for link ${i + 1}. Title: ${title.substring(0, 50)}`);
                console.log(`[Immowelt] Container has ${$container.find('img').length} images, parent has ${$container.parent().find('img').length} images`);
                // Пробуем найти любые изображения рядом
                const nearbyImages = $link.closest('div, article, li').find('img');
                console.log(`[Immowelt] Nearby images: ${nearbyImages.length}`);
              } else {
                console.log(`[Immowelt] ✓ Found image for link ${i + 1}: ${image.substring(0, 80)}...`);
              }
            }
            
            // Комнаты и площадь из текста
            let rooms = 0;
            let area = 0;
            
            const roomsMatch = allText.match(/(\d+[,.]?\d*)\s*Zimmer/i) || allText.match(/(\d+[,.]?\d*)\s*ZKB/i);
            if (roomsMatch) {
              rooms = Math.round(parseFloat(roomsMatch[1].replace(',', '.')));
            }
            
            const areaMatch = allText.match(/(\d+)\s*m²/i) || allText.match(/(\d+)\s*qm/i);
            if (areaMatch) {
              area = parseInt(areaMatch[1]);
            }
            
            // Парсим характеристики
            const lowerText = allText.toLowerCase();
            const balcony = lowerText.includes('balkon') || lowerText.includes('terrasse') || lowerText.includes('loggia');
            const kitchen = lowerText.includes('einbauküche') || lowerText.includes('ebk') || lowerText.includes('küche');
            const garden = lowerText.includes('garten');
            const lift = lowerText.includes('aufzug') || lowerText.includes('fahrstuhl') || lowerText.includes('lift');
            const furnished = lowerText.includes('möbliert');
            const parking = lowerText.includes('stellplatz') || lowerText.includes('garage') || lowerText.includes('parkplatz');
            const petsAllowed = lowerText.includes('haustier');

            if (title && href) {
              results.push({
                source: "Immowelt",
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
                url: href.startsWith('http') ? href : `https://www.immowelt.de${href}`,
                date: new Date().toISOString(),
                image,
              });
            }
          } catch (err) {
            console.error("[Immowelt] Error parsing link:", err);
          }
        });
      }
    }

    console.log(`[Immowelt] Found ${results.length} results`);
    return results.slice(0, 50);
  } catch (err: any) {
    console.error("[Immowelt] Fetch error:", err.message);
    if (err.response) {
      console.error("[Immowelt] Response status:", err.response.status);
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
  
  const dateMatch = dateText.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    return new Date(`${year}-${month}-${day}`).toISOString();
  }
  
  return null;
}

function sanitizeImageUrl(img: string | null): string | null {
  if (!img) return null;
  let s = img.trim();
  s = s.replace(/[)'" ]+$/g, '').replace(/^[('" ]+/g, '');
  if (s.startsWith('//')) s = `https:${s}`;
  if (!s.startsWith('http')) s = `https://www.immowelt.de${s}`;
  return s;
}
