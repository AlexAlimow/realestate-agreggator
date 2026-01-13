import type { NextApiRequest, NextApiResponse } from "next";
import { fetchImmowelt } from "../../services/immowelt";
import { fetchKleinanzeigen } from "../../services/kleinanzeigen";
import { fetchWG } from "../../services/wgGesucht";

// -------------------------
// Временный кэш
// -------------------------
let cache: any = {};
const CACHE_TIME = 1000 * 60 * 5; // 5 минут

// -------------------------
// Функция для проверки булевых фильтров
// -------------------------
function isTrue(value: string | string[] | undefined): boolean {
  return value === "true";
}

function parseNumber(value: string | string[] | undefined): number | undefined {
  if (!value) return undefined;
  const num = typeof value === "string" ? parseInt(value, 10) : parseInt(value[0], 10);
  return isNaN(num) ? undefined : num;
}

// -------------------------
// Интерфейс для фильтров
// -------------------------
interface ListingFilters {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  rooms?: number;
  minArea?: number;
  maxArea?: number;
  furnished?: boolean;
  petsAllowed?: boolean;
  balcony?: boolean;
  parking?: boolean;
}

// -------------------------
// Функция фильтрации результатов
// -------------------------
function filterListings(listings: any[], filters: ListingFilters): any[] {
  return listings.filter(listing => {
    // Фильтр по цене
    if (filters.minPrice !== undefined && listing.price && listing.price < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice !== undefined && listing.price && listing.price > filters.maxPrice) {
      return false;
    }
    
    // Фильтр по комнатам (>= указанного значения)
    if (filters.rooms !== undefined && listing.rooms && listing.rooms < filters.rooms) {
      return false;
    }
    
    // Фильтр по площади
    if (filters.minArea !== undefined && listing.area && listing.area < filters.minArea) {
      return false;
    }
    if (filters.maxArea !== undefined && listing.area && listing.area > filters.maxArea) {
      return false;
    }
    
    // Булевы фильтры убраны - источники не предоставляют эту информацию при парсинге
    
    return true;
  });
}

// -------------------------
// Функция сортировки
// -------------------------
function sortListings(listings: any[], sortBy: string): any[] {
  const sorted = [...listings];
  switch (sortBy) {
    case "priceAsc":
      return sorted.sort((a, b) => a.price - b.price);
    case "priceDesc":
      return sorted.sort((a, b) => b.price - a.price);
    case "areaAsc":
      return sorted.sort((a, b) => (a.area || 0) - (b.area || 0));
    case "areaDesc":
      return sorted.sort((a, b) => (b.area || 0) - (a.area || 0));
    case "newest":
    default:
      return sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

// -------------------------
// API обработчик
// -------------------------
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const query = req.query;
  const city = (query.city as string) || "Berlin";

  // -------------------------
  // Кэш
  // -------------------------
  const cacheKey = JSON.stringify(query);
  if (cache[cacheKey] && cache[cacheKey].timestamp + CACHE_TIME > Date.now()) {
    return res.status(200).json(cache[cacheKey].data);
  }

  // -------------------------
  // Подготавливаем фильтры для сервисов
  // -------------------------
  const serviceFilters = {
    city,
    minPrice: parseNumber(query.minPrice),
    maxPrice: parseNumber(query.maxPrice),
    rooms: parseNumber(query.rooms),
    minArea: parseNumber(query.minArea),
    maxArea: parseNumber(query.maxArea),
  };

  // -------------------------
  // Запрашиваем данные параллельно со всех источников
  // -------------------------
  try {
    console.log(`[API] Starting search for city: ${city}`);
    
    const [immoweltResults, kleinanzeigenResults, wgResults] = await Promise.allSettled([
      fetchImmowelt(serviceFilters),
      fetchKleinanzeigen(serviceFilters),
      fetchWG(serviceFilters),
    ]);

    // Собираем результаты из всех источников
    let results: any[] = [];
    
    if (immoweltResults.status === "fulfilled") {
      console.log(`[API] Immowelt: ${immoweltResults.value.length} results`);
      results = results.concat(immoweltResults.value);
    } else {
      console.error("[API] Immowelt error:", immoweltResults.reason?.message || immoweltResults.reason);
    }
    
    if (kleinanzeigenResults.status === "fulfilled") {
      console.log(`[API] Kleinanzeigen: ${kleinanzeigenResults.value.length} results`);
      results = results.concat(kleinanzeigenResults.value);
    } else {
      console.error("[API] Kleinanzeigen error:", kleinanzeigenResults.reason?.message || kleinanzeigenResults.reason);
    }
    
    if (wgResults.status === "fulfilled") {
      console.log(`[API] WG-Gesucht: ${wgResults.value.length} results`);
      results = results.concat(wgResults.value);
    } else {
      console.error("[API] WG-Gesucht error:", wgResults.reason?.message || wgResults.reason);
    }
    
    console.log(`[API] Total results before filtering: ${results.length}`);
    console.log(`[API] Applied filters:`, {
      city,
      minPrice: serviceFilters.minPrice,
      maxPrice: serviceFilters.maxPrice,
      rooms: serviceFilters.rooms,
      minArea: serviceFilters.minArea,
      maxArea: serviceFilters.maxArea,
      furnished: query.furnished,
      petsAllowed: query.petsAllowed,
      balcony: query.balcony,
      parking: query.parking,
    });

    // -------------------------
    // Применяем фильтры (булевы фильтры убраны, так как они не парсятся из источников)
    // -------------------------
    const filters: ListingFilters = {
      ...serviceFilters,
      // Булевы фильтры не используются, так как источники не предоставляют эту информацию
    };

    const beforeFilterCount = results.length;
    results = filterListings(results, filters);
    console.log(`[API] Results after filtering: ${results.length} (filtered out ${beforeFilterCount - results.length})`);

    // -------------------------
    // Сортировка
    // -------------------------
    const sortBy = (query.sort as string) || "newest";
    results = sortListings(results, sortBy);

    // -------------------------
    // Удаляем дубликаты (по URL)
    // -------------------------
    const uniqueResults = results.filter((item, index, self) =>
      index === self.findIndex((t) => t.url === item.url)
    );

    console.log(`[API] Final unique results: ${uniqueResults.length}`);

    // -------------------------
    // Сохраняем в кэш
    // -------------------------
    cache[cacheKey] = { data: uniqueResults, timestamp: Date.now() };

    res.status(200).json(uniqueResults);
  } catch (error: any) {
    console.error("Search API error:", error);
    res.status(500).json({ error: "Ошибка при поиске недвижимости", message: error.message });
  }
}