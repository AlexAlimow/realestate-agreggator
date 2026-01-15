// Генератор мок-данных для недвижимости
export interface ListingFilters {
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

export interface Listing {
  source: string;
  title: string;
  price: number;
  rooms: number;
  bedrooms?: number;
  bathrooms?: number;
  city: string;
  area: number;
  furnished: boolean;
  petsAllowed: boolean;
  balcony: boolean;
  parking: boolean;
  url: string;
  date: string;
  image: string | null;
  address?: string;
  description?: string;
}

const cities = [
  "Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne", 
  "Stuttgart", "Düsseldorf", "Dortmund", "Essen", "Leipzig"
];

const sources = ["ImmoScout24", "Immowelt", "Kleinanzeigen", "WG-Gesucht"];

const titles = [
  "Modern apartment in city center",
  "Cozy apartment with balcony",
  "Spacious apartment near park",
  "Bright apartment with garden view",
  "Renovated apartment in quiet area",
  "Luxury apartment with parking",
  "Studio apartment for students",
  "Family-friendly apartment",
  "Apartment with terrace",
  "Newly built apartment"
];

const addresses = [
  "Hauptstraße 12", "Marienplatz 5", "Friedrichstraße 23", 
  "Königstraße 8", "Bahnhofstraße 15", "Parkstraße 42",
  "Gartenweg 7", "Lindenallee 19", "Sonnenstraße 31", "Waldweg 4"
];

const descriptions = [
  "Beautiful apartment in excellent condition. Close to public transport and shopping.",
  "Well-maintained apartment with modern amenities. Perfect for professionals.",
  "Charming apartment in a quiet neighborhood. Ideal for families.",
  "Stylish apartment with high-quality finishes. Great location.",
  "Comfortable apartment with all necessary amenities. Move-in ready."
];

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateListing(city: string): Listing {
  const rooms = randomInt(1, 4);
  const basePrice = rooms * 400 + randomInt(200, 600);
  const area = rooms * 25 + randomInt(10, 30);
  const bedrooms = Math.max(1, rooms - 1);
  const bathrooms = rooms > 2 ? 2 : 1;
  
  const furnished = Math.random() > 0.5;
  const petsAllowed = Math.random() > 0.6;
  const balcony = Math.random() > 0.4;
  const parking = Math.random() > 0.5;
  
  const source = randomElement(sources);
  const title = randomElement(titles);
  const address = randomElement(addresses);
  const description = randomElement(descriptions);
  
  // Генерируем реалистичную дату (последние 30 дней)
  const daysAgo = randomInt(0, 30);
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  
  // Генерируем URL
  const url = `https://${source.toLowerCase().replace(' ', '')}.de/listing/${randomInt(100000, 999999)}`;
  
  // Используем placeholder изображения
  const imageId = randomInt(1, 1000);
  const image = `https://picsum.photos/400/300?random=${imageId}`;
  
  return {
    source,
    title: `${title} - ${rooms} rooms`,
    price: basePrice,
    rooms,
    bedrooms,
    bathrooms,
    city,
    area,
    furnished,
    petsAllowed,
    balcony,
    parking,
    url,
    date: date.toISOString(),
    image,
    address: `${address}, ${city}`,
    description
  };
}

export function generateMockListings(city: string, count: number = 50): Listing[] {
  const listings: Listing[] = [];
  for (let i = 0; i < count; i++) {
    listings.push(generateListing(city));
  }
  return listings;
}

export function filterListings(listings: Listing[], filters: ListingFilters): Listing[] {
  return listings.filter(listing => {
    if (filters.city && listing.city.toLowerCase() !== filters.city.toLowerCase()) {
      return false;
    }
    
    if (filters.minPrice && listing.price < filters.minPrice) {
      return false;
    }
    
    if (filters.maxPrice && listing.price > filters.maxPrice) {
      return false;
    }
    
    if (filters.rooms && listing.rooms < filters.rooms) {
      return false;
    }
    
    if (filters.minArea && listing.area < filters.minArea) {
      return false;
    }
    
    if (filters.maxArea && listing.area > filters.maxArea) {
      return false;
    }
    
    if (filters.furnished !== undefined && listing.furnished !== filters.furnished) {
      return false;
    }
    
    if (filters.petsAllowed !== undefined && listing.petsAllowed !== filters.petsAllowed) {
      return false;
    }
    
    if (filters.balcony !== undefined && listing.balcony !== filters.balcony) {
      return false;
    }
    
    if (filters.parking !== undefined && listing.parking !== filters.parking) {
      return false;
    }
    
    return true;
  });
}

export function sortListings(listings: Listing[], sortBy: string): Listing[] {
  const sorted = [...listings];
  
  switch (sortBy) {
    case "priceAsc":
      return sorted.sort((a, b) => a.price - b.price);
    case "priceDesc":
      return sorted.sort((a, b) => b.price - a.price);
    case "areaAsc":
      return sorted.sort((a, b) => a.area - b.area);
    case "areaDesc":
      return sorted.sort((a, b) => b.area - a.area);
    case "newest":
    default:
      return sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}
