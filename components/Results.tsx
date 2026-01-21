import { FC } from "react";
import Image from "next/image";
import { useLanguage } from "../contexts/LanguageContext";

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

const Results: FC<ResultsProps> = ({ results }) => {
  const { t } = useLanguage();

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t.results.time.today;
    if (diffDays === 1) return t.results.time.yesterday;
    if (diffDays < 7) return `${diffDays} ${t.results.time.daysAgo}`;
    if (diffDays < 30)
      return `${Math.floor(diffDays / 7)} ${t.results.time.weeksAgo}`;
    return `${Math.floor(diffDays / 30)} ${t.results.time.monthsAgo}`;
  };

  if (!results.length) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🏠</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          {t.results.notFoundTitle}
        </h3>
        <p className="text-gray-500">{t.results.notFoundDesc}</p>
      </div>
    );
  }

  return (
    <section aria-label={t.results.foundCount}>
      <p className="mb-4 text-gray-600">
        {t.results.foundCount}{" "}
        <span className="font-semibold text-gray-800">{results.length}</span>
      </p>

      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        role="list"
      >
        {results.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
            role="listitem"
          >
            {/* Изображение */}
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block relative h-48 bg-gray-200 overflow-hidden group"
            >
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  priority={false}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200 transition-transform duration-300 group-hover:scale-105">
                  <svg
                    className="w-16 h-16 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-xs text-gray-500">{item.source}</span>
                </div>
              )}
              <div className="absolute top-2 right-2">
                <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded">
                  {item.source}
                </span>
              </div>
            </a>

            {/* Контент */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                {item.title}
              </h3>

              {/* Цена */}
              <div className="mb-3">
                <span className="text-2xl font-bold text-blue-600">
                  €{item.price.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  {t.results.perMonth}
                </span>
              </div>

              {/* Основные характеристики */}
              <div className="flex flex-wrap gap-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  {item.rooms} {t.results.details.rooms}
                </div>
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                  {item.area} {t.results.details.area}
                </div>
                {item.furnished && (
                  <div className="flex items-center text-green-600">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {t.results.details.furnished}
                  </div>
                )}
              </div>

              {/* Футер карточки */}
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  {formatDate(item.date)}
                </span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {t.results.viewDeal} →
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Results;
