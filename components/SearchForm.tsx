import { FC, useState, FormEvent } from "react";
import { useLanguage } from "../contexts/LanguageContext";

interface SearchFormProps {
  onSearch: (filters: Record<string, any>) => void;
  onSortChange?: (sort: string) => void;
}

const SearchForm: FC<SearchFormProps> = ({ onSearch, onSortChange }) => {
  const { t } = useLanguage();
  const [cityInput, setCityInput] = useState("Berlin");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [rooms, setRooms] = useState("");
  const [maxRooms, setMaxRooms] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
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
  const [garage, setGarage] = useState(false);
  const [keller, setKeller] = useState(false);

  // New filters
  const [floor, setFloor] = useState("");
  const [source, setSource] = useState("all");


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
      garage,
      keller,
    };
    
    // Источники
    if (source === "all") {
      filters.immowelt = true;
      filters.kleinanzeigen = true;
      filters.wg = true;
    } else {
      filters[source] = true;
    }

    // Добавляем числовые фильтры только если они заполнены
    if (floor) filters.floor = floor;
    if (minPrice && minPrice.trim()) filters.minPrice = minPrice.trim();
    if (maxPrice && maxPrice.trim()) filters.maxPrice = maxPrice.trim();
    if (rooms && rooms.trim()) filters.rooms = rooms.trim();
    if (maxRooms && maxRooms.trim()) filters.maxRooms = maxRooms.trim();
    if (bedrooms && bedrooms.trim()) filters.bedrooms = bedrooms.trim();
    if (bathrooms && bathrooms.trim()) filters.bathrooms = bathrooms.trim();
    if (minArea && minArea.trim()) filters.minArea = minArea.trim();
    if (maxArea && maxArea.trim()) filters.maxArea = maxArea.trim();
    
    onSearch(filters);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">{t.searchForm.title}</h2>
      <p className="text-sm text-gray-600 mb-6">
        {t.searchForm.description}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Город */}
        <div>
          <label htmlFor="search-city" className="block text-sm font-medium text-gray-700 mb-2">
            {t.searchForm.city}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="search-city"
              value={cityInput}
              onChange={e => setCityInput(e.target.value)}
              placeholder={t.searchForm.cityPlaceholder}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Цена */}
        <div>
          <label htmlFor="search-min-price" className="block text-sm font-medium text-gray-700 mb-2">
            {t.searchForm.minPrice}
          </label>
          <input
            type="number"
            id="search-min-price"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="search-max-price" className="block text-sm font-medium text-gray-700 mb-2">
            {t.searchForm.maxPrice}
          </label>
          <input
            type="number"
            id="search-max-price"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Площадь */}
        <div>
          <label htmlFor="search-min-area" className="block text-sm font-medium text-gray-700 mb-2">
            {t.searchForm.minArea}
          </label>
          <input
            type="number"
            id="search-min-area"
            value={minArea}
            onChange={e => setMinArea(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="search-max-area" className="block text-sm font-medium text-gray-700 mb-2">
            {t.searchForm.maxArea}
          </label>
          <input
            type="number"
            id="search-max-area"
            value={maxArea}
            onChange={e => setMaxArea(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Комнаты (минимум) */}
        <div>
          <label htmlFor="search-rooms-min" className="block text-sm font-medium text-gray-700 mb-2">
          {t.searchForm.rooms}
          </label>
          <input
            type="number"
            id="search-rooms-min"
            value={rooms}
            onChange={e => setRooms(e.target.value)}
            placeholder="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Максимум комнат */}
        <div>
          <label htmlFor="search-rooms-max" className="block text-sm font-medium text-gray-700 mb-2">
            {t.searchForm.maxRooms}
          </label>
          <input
            type="number"
            id="search-rooms-max"
            value={maxRooms}
            onChange={e => setMaxRooms(e.target.value)}
            placeholder="10"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Спальни */}
        <div>
          <label htmlFor="search-bedrooms" className="block text-sm font-medium text-gray-700 mb-2">
            {t.searchForm.bedrooms}
          </label>
          <input
            type="number"
            id="search-bedrooms"
            value={bedrooms}
            onChange={e => setBedrooms(e.target.value)}
            placeholder="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Ванные/туалеты */}
        <div>
          <label htmlFor="search-bathrooms" className="block text-sm font-medium text-gray-700 mb-2">
            {t.searchForm.bathrooms}
          </label>
          <input
            type="number"
            id="search-bathrooms"
            value={bathrooms}
            onChange={e => setBathrooms(e.target.value)}
            placeholder="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Этаж */}
        <div>
          <label htmlFor="search-floor" className="block text-sm font-medium text-gray-700 mb-2">
            {t.searchForm.floor}
          </label>
          <select
            value={floor}
            onChange={e => setFloor(e.target.value)}
            id="search-floor"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">{t.searchForm.floorOptions.any}</option>
            <option value="0">{t.searchForm.floorOptions.ground}</option>
            <option value="1">{t.searchForm.floorOptions.floor1}</option>
            <option value="2">{t.searchForm.floorOptions.floor2}</option>
            <option value="3+">{t.searchForm.floorOptions.floor3plus}</option>
            <option value="dachgeschoss">{t.searchForm.floorOptions.dachgeschoss}</option>
            <option value="penthouse">{t.searchForm.floorOptions.penthouse}</option>
          </select>
        </div>
      </div>

      {/* Дополнительные фильтры */}
      <fieldset className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
        <legend className="sr-only">{t.searchForm.filters.legend}</legend>
        <label className="flex items-center space-x-2 cursor-pointer" htmlFor="filter-balcony">
          <input
            id="filter-balcony"
            type="checkbox"
            checked={balcony}
            onChange={e => setBalcony(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">{t.searchForm.filters.balcony}</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer" htmlFor="filter-kitchen">
          <input
            id="filter-kitchen"
            type="checkbox"
            checked={kitchen}
            onChange={e => setKitchen(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">{t.searchForm.filters.kitchen}</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer" htmlFor="filter-garden">
          <input
            id="filter-garden"
            type="checkbox"
            checked={garden}
            onChange={e => setGarden(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">{t.searchForm.filters.garden}</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer" htmlFor="filter-lift">
          <input
            id="filter-lift"
            type="checkbox"
            checked={lift}
            onChange={e => setLift(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">{t.searchForm.filters.lift}</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer" htmlFor="filter-furnished">
          <input
            id="filter-furnished"
            type="checkbox"
            checked={furnished}
            onChange={e => setFurnished(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">{t.searchForm.filters.furnished}</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer" htmlFor="filter-parking">
          <input
            id="filter-parking"
            type="checkbox"
            checked={parking}
            onChange={e => setParking(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">{t.searchForm.filters.parking}</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer" htmlFor="filter-garage">
          <input
            id="filter-garage"
            type="checkbox"
            checked={garage}
            onChange={e => setGarage(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">{t.searchForm.filters.garage}</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer" htmlFor="filter-keller">
          <input
            id="filter-keller"
            type="checkbox"
            checked={keller}
            onChange={e => setKeller(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">{t.searchForm.filters.keller}</span>
        </label>
      </fieldset>

      <div className="flex flex-col md:flex-row justify-between items-center pt-4 border-t border-gray-200 gap-4">
        <div className="flex flex-col sm:flex-row items-center w-full md:w-auto gap-4 md:space-x-4">
          {/* Сортировка */}
          <div className="flex items-center justify-between w-full sm:w-auto space-x-2">
            <label className="text-sm text-gray-600 whitespace-nowrap" htmlFor="search-sort">{t.searchForm.sort.label}:</label>
            <select
              value={sort}
              onChange={handleSortChange}
              id="search-sort"
              className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 flex-1 sm:flex-none"
            >
              <option value="newest">{t.searchForm.sort.newest}</option>
              <option value="priceAsc">{t.searchForm.sort.priceAsc}</option>
              <option value="priceDesc">{t.searchForm.sort.priceDesc}</option>
              <option value="areaAsc">{t.searchForm.sort.areaAsc}</option>
              <option value="areaDesc">{t.searchForm.sort.areaDesc}</option>
            </select>
          </div>

          {/* Источник */}
          <div className="flex items-center justify-between w-full sm:w-auto space-x-2">
            <label className="text-sm text-gray-600 whitespace-nowrap" htmlFor="search-source">{t.searchForm.sites.label}:</label>
            <select
              value={source}
              onChange={e => setSource(e.target.value)}
              id="search-source"
              className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 flex-1 sm:flex-none"
            >
              <option value="all">{t.searchForm.sites.all}</option>
              <option value="immowelt">{t.searchForm.sites.immowelt}</option>
              <option value="kleinanzeigen">{t.searchForm.sites.kleinanzeigen}</option>
              <option value="wg">{t.searchForm.sites.wg}</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full md:w-auto bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {t.searchForm.searchButton}
        </button>
      </div>
    </form>
  );
};

export default SearchForm;
