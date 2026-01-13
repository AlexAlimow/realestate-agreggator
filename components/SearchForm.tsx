import { FC, useState, FormEvent } from "react";

interface SearchFormProps {
  onSearch: (filters: Record<string, any>) => void;
  onSortChange?: (sort: string) => void;
}

const SearchForm: FC<SearchFormProps> = ({ onSearch, onSortChange }) => {
  const [cityInput, setCityInput] = useState("Berlin");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [rooms, setRooms] = useState("");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [sort, setSort] = useState("newest");
  
  // Boolean filters
  const [balcony, setBalcony] = useState(false);
  const [kitchen, setKitchen] = useState(false);
  const [garden, setGarden] = useState(false);
  const [lift, setLift] = useState(false);
  const [furnished, setFurnished] = useState(false);
  const [parking, setParking] = useState(false);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    setSort(newSort);
    if (onSortChange) {
      onSortChange(newSort);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const city = cityInput.trim() || "Berlin";
    
    // Формируем объект фильтров, исключая пустые значения
    const filters: Record<string, any> = {
      city,
      sort,
      balcony,
      kitchen,
      garden,
      lift,
      furnished,
      parking,
    };
    
    // Добавляем числовые фильтры только если они заполнены
    if (minPrice && minPrice.trim()) filters.minPrice = minPrice.trim();
    if (maxPrice && maxPrice.trim()) filters.maxPrice = maxPrice.trim();
    if (rooms && rooms.trim()) filters.rooms = rooms.trim();
    if (minArea && minArea.trim()) filters.minArea = minArea.trim();
    if (maxArea && maxArea.trim()) filters.maxArea = maxArea.trim();
    
    onSearch(filters);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Поиск недвижимости</h2>
      <p className="text-sm text-gray-600 mb-6">
        Найдите идеальную квартиру по всей Германии. Используйте фильтры для уточнения поиска.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Город */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Город
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={cityInput}
              onChange={e => setCityInput(e.target.value)}
              placeholder="Введите название города (например: Berlin, Munich)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Цена */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Мин. цена (€)
          </label>
          <input
            type="number"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Макс. цена (€)
          </label>
          <input
            type="number"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            placeholder="10000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Комнаты */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Количество комнат (минимум)
          </label>
          <input
            type="number"
            value={rooms}
            onChange={e => setRooms(e.target.value)}
            placeholder="Любое"
            min="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Например: 2 для поиска 2+ комнат</p>
        </div>

        {/* Площадь */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Мин. площадь (м²)
          </label>
          <input
            type="number"
            value={minArea}
            onChange={e => setMinArea(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Макс. площадь (м²)
          </label>
          <input
            type="number"
            value={maxArea}
            onChange={e => setMaxArea(e.target.value)}
            placeholder="200"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Сортировка */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Сортировка
          </label>
          <select
            value={sort}
            onChange={handleSortChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="newest">Сначала новые</option>
            <option value="priceAsc">Цена: по возрастанию</option>
            <option value="priceDesc">Цена: по убыванию</option>
            <option value="areaAsc">Площадь: по возрастанию</option>
            <option value="areaDesc">Площадь: по убыванию</option>
          </select>
        </div>
      </div>

      {/* Дополнительные фильтры */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Дополнительно
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={balcony}
              onChange={e => setBalcony(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <span className="text-sm text-gray-700">Балкон/Терраса</span>
          </label>
          
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={kitchen}
              onChange={e => setKitchen(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <span className="text-sm text-gray-700">Встр. кухня</span>
          </label>
          
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={garden}
              onChange={e => setGarden(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <span className="text-sm text-gray-700">Сад</span>
          </label>
          
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={lift}
              onChange={e => setLift(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <span className="text-sm text-gray-700">Лифт</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={furnished}
              onChange={e => setFurnished(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <span className="text-sm text-gray-700">Мебель</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={parking}
              onChange={e => setParking(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <span className="text-sm text-gray-700">Парковка</span>
          </label>
        </div>
      </div>

      {/* Кнопка поиска */}
      <button
        type="submit"
        className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        Найти недвижимость
      </button>
    </form>
  );
};

export default SearchForm;