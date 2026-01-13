import { useState } from "react";
import SearchForm from "../components/SearchForm";
import Results, { Apartment } from "../components/Results";

export default function Home() {
  const [results, setResults] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSort = (sortType: string) => {
    if (results.length === 0) return;

    const sorted = [...results].sort((a, b) => {
      switch (sortType) {
        case "priceAsc":
          return a.price - b.price;
        case "priceDesc":
          return b.price - a.price;
        case "areaAsc":
          return a.area - b.area;
        case "areaDesc":
          return b.area - a.area;
        case "newest":
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    setResults(sorted);
  };

  const handleSearch = async (filters: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(filters as Record<string, string>);
      const res = await fetch(`/api/search?${params}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Ошибка ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Search error:", error);
      setError(error.message || "Произошла ошибка при поиске. Попробуйте позже.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            🏠 Поиск недвижимости в Германии
          </h1>
          <p className="text-gray-600 mt-2">
            Найдите идеальную квартиру или дом по всей Германии
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SearchForm onSearch={handleSearch} onSortChange={handleSort} />

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col justify-center items-center py-12">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <span className="mt-4 text-gray-600">Поиск объявлений на всех сайтах...</span>
            <span className="mt-2 text-sm text-gray-500">Это может занять несколько секунд</span>
          </div>
        )}

        {/* Results */}
        {!loading && <Results results={results} />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            © 2026 Поиск недвижимости. Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  );
}