import { useLanguage } from "../contexts/LanguageContext";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex space-x-2" role="group" aria-label="Language selector">
      <button
        onClick={() => setLanguage('ru')}
        type="button"
        aria-pressed={language === 'ru'}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          language === 'ru'
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
      >
        RU
      </button>
      <button
        onClick={() => setLanguage('de')}
        type="button"
        aria-pressed={language === 'de'}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          language === 'de'
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
      >
        DE
      </button>
      <button
        onClick={() => setLanguage('en')}
        type="button"
        aria-pressed={language === 'en'}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          language === 'en'
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
      >
        EN
      </button>
    </div>
  );
}
