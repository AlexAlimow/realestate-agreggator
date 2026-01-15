import type { NextApiRequest, NextApiResponse } from "next";
import { fetchImmowelt } from "../../services/immowelt";
import { fetchKleinanzeigen } from "../../services/kleinanzeigen";
import { fetchWG } from "../../services/wgGesucht";
import dbConnect from "../../utils/dbConnect";
import Listing from "../../models/Listing";

// -------------------------
// Временный кэш (in-memory) - оставим как короткий буфер
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
   maxRooms?: number;
   bedrooms?: number;
   bathrooms?: number;
  minArea?: number;
  maxArea?: number;
  furnished?: boolean;
  petsAllowed?: boolean;
  balcony?: boolean;
  parking?: boolean;
  kitchen?: boolean;
  garden?: boolean;
  lift?: boolean;
  sources?: string[];
  garage?: boolean;
  keller?: boolean;
  floor?: string;
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
    
    // Фильтр по комнатам (диапазон)
    if (filters.rooms !== undefined) {
      if (!listing.rooms || listing.rooms < filters.rooms) {
        return false;
      }
    }
    if (filters.maxRooms !== undefined) {
      if (!listing.rooms || listing.rooms > filters.maxRooms) {
        return false;
      }
    }

    // Фильтр по спальням (минимум)
    if (filters.bedrooms !== undefined) {
      if (!listing.bedrooms || listing.bedrooms < filters.bedrooms) {
        return false;
      }
    }

    // Фильтр по санузлам (минимум)
    if (filters.bathrooms !== undefined) {
      if (!listing.bathrooms || listing.bathrooms < filters.bathrooms) {
        return false;
      }
    }
    
    // Фильтр по площади
    if (filters.minArea !== undefined && listing.area && listing.area < filters.minArea) {
      return false;
    }
    if (filters.maxArea !== undefined && listing.area && listing.area > filters.maxArea) {
      return false;
    }
    
    // Булевы фильтры
    if (filters.balcony && !listing.balcony) return false;
    if (filters.kitchen && !listing.kitchen) return false;
    if (filters.garden && !listing.garden) return false;
    if (filters.lift && !listing.lift) return false;
    if (filters.furnished && !listing.furnished) return false;
    if (filters.parking && !listing.parking) return false;
    if (filters.petsAllowed && !listing.petsAllowed) return false;
    
    // Новые фильтры
    if (filters.garage && !listing.garage) return false;
    if (filters.keller && !listing.keller) return false;

    // Фильтр по этажу
    if (filters.floor) {
      if (!listing.floor) return false;
      
      const listingFloor = listing.floor.toString().toLowerCase();
      const filterFloor = filters.floor.toLowerCase();
      
      if (filterFloor === 'dachgeschoss') {
        if (!listingFloor.includes('dach') && !listingFloor.includes('dg')) return false;
      } else if (filterFloor === 'penthouse') {
        if (!listingFloor.includes('penthouse')) return false;
      } else if (filterFloor === '3+') {
        const floorNum = parseInt(listingFloor);
        if (isNaN(floorNum) || floorNum < 3) return false;
      } else {
        // Точное совпадение для 0, 1, 2
        // Нужно учитывать "eg" для 0
        if (filterFloor === '0') {
          if (listingFloor !== '0' && listingFloor !== 'eg' && !listingFloor.includes('erdgeschoss')) return false;
        } else {
          // Для 1, 2 ищем число
          if (!listingFloor.includes(filterFloor)) return false;
        }
      }
    }

    // Фильтр по источникам
    if (filters.sources && filters.sources.length > 0) {
      if (!listing.source || !filters.sources.includes(listing.source)) {
        return false;
      }
    }
    
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

  // 1. Подключение к БД
  try {
    await dbConnect();
  } catch (error) {
    console.error("[API] Database connection failed:", error);
    // Продолжаем выполнение, даже если БД недоступна (вернем только scraped данные)
  }

  // -------------------------
  // Кэш (In-memory) - проверка
  // -------------------------
  const cacheKey = JSON.stringify(query);
  if (cache[cacheKey] && cache[cacheKey].timestamp + CACHE_TIME > Date.now()) {
    console.log("[API] Returning cached results (memory)");
    return res.status(200).json(cache[cacheKey].data);
  }

  // -------------------------
  // Подготавливаем фильтры для сервисов
  // -------------------------
  const sources: string[] = [];
  if (isTrue(query.immowelt)) sources.push("Immowelt");
  if (isTrue(query.kleinanzeigen)) sources.push("Kleinanzeigen");
  if (isTrue(query.wg)) sources.push("WG-Gesucht");

  const serviceFilters: ListingFilters = {
    city,
    minPrice: parseNumber(query.minPrice),
    maxPrice: parseNumber(query.maxPrice),
    rooms: parseNumber(query.rooms),
    maxRooms: parseNumber(query.maxRooms),
    bedrooms: parseNumber(query.bedrooms),
    bathrooms: parseNumber(query.bathrooms),
    minArea: parseNumber(query.minArea),
    maxArea: parseNumber(query.maxArea),
    balcony: isTrue(query.balcony),
    kitchen: isTrue(query.kitchen),
    garden: isTrue(query.garden),
    lift: isTrue(query.lift),
    furnished: isTrue(query.furnished),
    parking: isTrue(query.parking),
    petsAllowed: isTrue(query.petsAllowed),
    garage: isTrue(query.garage),
    keller: isTrue(query.keller),
    floor: typeof query.floor === "string" ? query.floor : undefined,
    sources,
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

    // -------------------------
    // Сохранение в БД (Upsert)
    // -------------------------
    if (results.length > 0) {
      try {
        const operations = results.map((item) => ({
          updateOne: {
            filter: { url: item.url },
            update: { 
              $set: { ...item, updatedAt: new Date() },
              $setOnInsert: { createdAt: new Date() }
            },
            upsert: true,
          },
        }));

        await Listing.bulkWrite(operations);
        console.log(`[API] Saved/Updated ${results.length} listings in DB`);
      } catch (dbError) {
        console.error("[API] Failed to save listings to DB:", dbError);
      }
    }

    // -------------------------
    // Применяем фильтры
    // -------------------------
    const beforeFilterCount = results.length;
    results = filterListings(results, serviceFilters);
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
    
    // -------------------------
    // FALLBACK: Попытка достать данные из БД
    // -------------------------
    try {
      console.log("[API] Attempting fallback to DB...");
      const dbResults = await Listing.find({ city: new RegExp(city, 'i') }).lean();
      
      // Применяем те же фильтры к данным из БД
      let fallbackResults = filterListings(dbResults, serviceFilters);
      const sortBy = (query.sort as string) || "newest";
      fallbackResults = sortListings(fallbackResults, sortBy);
      
      console.log(`[API] Fallback successful. Found ${fallbackResults.length} items in DB.`);
      return res.status(200).json(fallbackResults);
      
    } catch (dbError) {
      console.error("[API] DB Fallback failed:", dbError);
    }

    res.status(500).json({ error: "Ошибка при поиске недвижимости", message: error.message });
  }
}
