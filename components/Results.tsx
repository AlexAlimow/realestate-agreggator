import { FC } from "react";

export interface Apartment {
  source: string;
  title: string;
  price: number;
  rooms: number;
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

interface ResultsProps {
  results: Apartment[];
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Вчера";
  if (diffDays < 7) return `${diffDays} дней назад`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} недель назад`;
  return `${Math.floor(diffDays / 30)} месяцев назад`;
};

const Results: FC<ResultsProps> = ({ results }) => {
  if (!results.length) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🏠</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Ничего не найдено</h3>
        <p className="text-gray-500">Попробуйте изменить параметры поиска</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 text-gray-600">
        Найдено объявлений: <span className="font-semibold text-gray-800">{results.length}</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
          >
            {/* Изображение */}
            <div className="relative h-48 bg-gray-200 overflow-hidden">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    // Пробуем placeholder с цветом по источнику
                    const colors: Record<string, string> = {
                      "ImmoScout24": "3B82F6",
                      "Immowelt": "10B981",
                      "Kleinanzeigen": "F59E0B",
                      "WG-Gesucht": "8B5CF6",
                    };
                    const color = colors[item.source] || "6B7280";
                    target.src = `https://via.placeholder.com/400x300/${color}/FFFFFF?text=${encodeURIComponent(item.source)}`;
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200">
                  <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs text-gray-500">{item.source}</span>
                </div>
              )}
              <div className="absolute top-2 right-2">
                <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded">
                  {item.source}
                </span>
              </div>
            </div>

            {/* Контент */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                {item.title}
              </h3>

              {/* Цена */}
              <div className="mb-3">
                <span className="text-2xl font-bold text-blue-600">€{item.price.toLocaleString()}</span>
                <span className="text-sm text-gray-500 ml-1">/мес</span>
              </div>

              {/* Основные характеристики */}
              <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                {item.rooms > 0 && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>{item.rooms} комн.</span>
                  </div>
                )}
                {item.area > 0 && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    <span>{item.area} м²</span>
                  </div>
                )}
              </div>

              {/* Адрес */}
              {item.address && (
                <div className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{item.address}</span>
                </div>
              )}

              {/* Опции */}
              <div className="flex flex-wrap gap-2 mb-3">
                {item.furnished && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Меблировано
                  </span>
                )}
                {item.petsAllowed && (
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    Животные
                  </span>
                )}
                {item.balcony && (
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                    Балкон
                  </span>
                )}
                {item.parking && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Парковка
                  </span>
                )}
              </div>

              {/* Дата и ссылка */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className="text-xs text-gray-500">{formatDate(item.date)}</span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Подробнее
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Results;