import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext'; // Çeviri hook'unu import et

export default function SearchableSelect({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  label = "",
  allLabel
}) {
  const { t } = useTranslation(); // Hook'u kullan
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);

  // Varsayılan değerleri context'ten alacak şekilde ayarla
  const effectivePlaceholder = placeholder || t.searchBar; // Varsayılan placeholder
  const effectiveAllLabel = allLabel || t.all; // Varsayılan 'Tümü' etiketi

  // Dışarı tıklayınca kapatma mantığı
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Seçenekleri filtreleme (String veya Obje desteği)
  const filteredOptions = options.filter(opt => {
    const labelToCheck = typeof opt === 'object' ? opt.label : opt;
    return labelToCheck.toString().toLowerCase().includes(search.toLowerCase());
  });

  // Seçili değeri bulma (Görünen etiket için)
  const getDisplayValue = () => {
    if (value === "all") return effectiveAllLabel;
    const selectedOption = options.find(opt => (typeof opt === 'object' ? opt.value === value : opt === value));
    return selectedOption ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption) : value;
  };

  return (
    <div className="w-full relative group" ref={wrapperRef}>
      {label && (
        <label className="block text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
          {label}
        </label>
      )}
      
      {/* Tetikleyici Buton */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full h-[42px] px-3 flex items-center justify-between
          bg-white dark:bg-zinc-900 
          border transition-all duration-200 ease-in-out rounded-lg cursor-pointer select-none
          ${isOpen 
            ? 'border-blue-500 ring-2 ring-blue-500/20 dark:ring-blue-500/30 z-20 relative' 
            : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
          }
        `}
      >
        <span className={`block truncate text-sm mr-2 flex-1 min-w-0 ${value === 'all' ? 'text-gray-500 dark:text-zinc-400' : 'text-gray-900 dark:text-zinc-100 font-medium'}`}>
          {getDisplayValue()}
        </span>

        <div className="flex items-center gap-1 flex-shrink-0">
            {value !== "all" && (
                <div 
                    onClick={(e) => { e.stopPropagation(); onChange("all"); }}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-red-500 transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </div>
            )}
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Açılır Menü */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-left ring-1 ring-black/5">
          
          {/* Arama Alanı */}
          <div className="p-2 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-transparent border border-gray-200 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white placeholder-gray-400 transition-all"
                placeholder={t.searchBar}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Liste */}
          <div className="max-h-[240px] overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-zinc-700">
            {/* Tümü Seçeneği */}
            <div
                onClick={() => { onChange("all"); setIsOpen(false); }}
                className={`px-3 py-2 text-sm rounded-md cursor-pointer flex items-center justify-between transition-colors mb-0.5 ${
                    value === "all" 
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 font-medium' 
                    : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                }`}
            >
                <span>{effectiveAllLabel}</span>
                {value === "all" && <Check className="w-4 h-4" />}
            </div>

            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const optValue = typeof opt === 'object' ? opt.value : opt;
                const optLabel = typeof opt === 'object' ? opt.label : opt;
                const isSelected = value === optValue;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      onChange(optValue);
                      setIsOpen(false);
                      setSearch(""); 
                    }}
                    className={`px-3 py-2 text-sm rounded-md cursor-pointer flex items-center justify-between transition-colors mb-0.5 ${
                      isSelected
                      ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 font-medium' 
                      : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="truncate mr-2">{optLabel}</span>
                    {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-zinc-500 italic">
                {t.results} yok
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}