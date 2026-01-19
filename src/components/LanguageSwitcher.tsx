'use client';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { i18n } from '@/i18n/settings';

const LANGUAGES = {
  en: { name: 'English', flagUrl: 'https://flagcdn.com/w40/us.png' },
  es: { name: 'Spanish', flagUrl: 'https://flagcdn.com/w40/es.png' }
};

export default function LanguageSwitcher({ initialLocale }: { initialLocale?: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [currentLocale, setCurrentLocale] = useState<string>(initialLocale || i18n.defaultLocale);

  useEffect(() => {
    // If we have an initialLocale prop, we might not need to read the cookie, 
    // unless the cookie changed elsewhere. But typically prop is truth.
    // However, for consistency, we could just stay with the prop.
    // If the prop is missing, we try cookie.
    if (!initialLocale) {
        // ... cookie logic
    }
  }, [initialLocale]);

  const handleLanguageChange = (locale: string) => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    setCurrentLocale(locale);
    setIsOpen(false);
    router.refresh();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-2 rounded-lg transition"
      >
        <img 
            src={LANGUAGES[currentLocale as keyof typeof LANGUAGES]?.flagUrl} 
            alt={LANGUAGES[currentLocale as keyof typeof LANGUAGES]?.name} 
            className="w-5 h-3.5 object-cover rounded-[1px]" 
        />
        <span className="text-xs font-bold text-gray-300 hidden md:inline-block">
          {LANGUAGES[currentLocale as keyof typeof LANGUAGES]?.name}
        </span>
        <i className={`fas fa-chevron-down text-[10px] text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-36 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          {i18n.locales.map((locale) => {
             const langKey = locale as keyof typeof LANGUAGES;
             return (
              <button
                key={locale}
                onClick={() => handleLanguageChange(locale)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-800 transition ${
                  currentLocale === locale ? 'bg-gray-800/50 text-white' : 'text-gray-400'
                }`}
              >
                <img 
                    src={LANGUAGES[langKey].flagUrl} 
                    alt={LANGUAGES[langKey].name} 
                    className="w-5 h-3.5 object-cover rounded-[1px]" 
                />
                <span className="font-medium">{LANGUAGES[langKey].name}</span>
                {currentLocale === locale && <i className="fas fa-check text-blue-500 ml-auto text-xs"></i>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
