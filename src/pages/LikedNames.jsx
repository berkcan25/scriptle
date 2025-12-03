import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import { useLikes } from '../context/LikesContext';
import { namesData } from '../data';
import { Search, ArrowUp, ArrowDown, Trash2, Heart } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect'; 

export default function LikedNames() {
  const { t, lang } = useTranslation();
  const { likedNames, toggleLike, moveLike } = useLikes();
  const [search, setSearch] = useState("");
  
  const [filters, setFilters] = useState({
    gender: "all",
    origin: "all",
  });

  // 1. Data Processing (Get Liked names in order)
  const myNames = useMemo(() => {
    return likedNames.map(likedName => {
        const n = namesData.find(data => data.Name === likedName);
        if (!n) return null;

        const maleCount = n.Statistics?.Count?.male?.total?.total || 0;
        const femaleCount = n.Statistics?.Count?.female?.total?.total || 0;
        const totalCount = maleCount + femaleCount;
        
        let gender = 'unisex';
        if (maleCount > femaleCount * 10) gender = 'male';
        else if (femaleCount > maleCount * 10) gender = 'female';

        return {
            ...n,
            totalCount,
            gender,
            currentMeaning: lang === 'tr' ? (n.Meaning_TR || n.Meaning_EN) : (n.Meaning_EN || n.Meaning_TR)
        };
    }).filter(Boolean);
  }, [likedNames, lang]);

  // 2. Filter logic (Updated for Arrays)
  const filteredData = useMemo(() => {
    return myNames.filter(n => {
      const matchesSearch = n.Name.toLowerCase().includes(search.toLowerCase());
      const matchesGender = filters.gender === "all" || n.gender === filters.gender;
      
      // --- UPDATED: Check if array includes the filter ---
      const matchesOrigin = filters.origin === "all" || (Array.isArray(n.Etymology) && n.Etymology.includes(filters.origin));
      
      return matchesSearch && matchesGender && matchesOrigin;
    });
  }, [search, filters, myNames]);

  // --- UPDATED: Use .flat() to get all unique origins from arrays ---
  const uniqueOrigins = useMemo(() => {
      const allOrigins = myNames.map(n => n.Etymology).flat().filter(Boolean);
      return [...new Set(allOrigins)].sort();
  }, [myNames]);

  if (likedNames.length === 0) {
    return (
        <div className="p-6 bg-gray-50 dark:bg-zinc-950 min-h-screen flex flex-col items-center justify-center text-center">
            <div className="bg-white dark:bg-zinc-900 p-12 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800">
                <Heart className="w-16 h-16 text-gray-300 dark:text-zinc-700 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.noFavorites}</h2>
                <p className="text-gray-500 dark:text-zinc-400 mb-6">{t.addFavorites}</p>
                <Link to="/" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
                    {t.back}
                </Link>
            </div>
        </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-zinc-950 min-h-screen transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <Heart className="w-8 h-8 text-red-500 fill-red-500" />
                {t.favorites}
            </h1>
            <p className="text-gray-500 dark:text-zinc-400">{t.rankHelp}</p>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm mb-6 border dark:border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder={t.search}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-900 dark:text-white"
                    onChange={(e) => setSearch(e.target.value)}
                />
             </div>
             <SearchableSelect
                label=""
                placeholder={t.filter_gender}
                allLabel={t.all}
                options={[{ value: 'male', label: t.male }, { value: 'female', label: t.female }, { value: 'unisex', label: t.unisex }]}
                value={filters.gender}
                onChange={(val) => setFilters({...filters, gender: val})}
             />
             <SearchableSelect
                label=""
                placeholder={t.filter_origin}
                allLabel={t.all}
                options={uniqueOrigins}
                value={filters.origin}
                onChange={(val) => setFilters({...filters, origin: val})}
             />
        </div>

        {/* List */}
        <div className="space-y-3">
            {filteredData.map((name, index) => {
                // Ensure Etymology is always an array
                const etymologies = Array.isArray(name.Etymology) ? name.Etymology : [name.Etymology].filter(Boolean);
                
                const realIndex = likedNames.indexOf(name.Name);
                const isFirst = realIndex === 0;
                const isLast = realIndex === likedNames.length - 1;

                return (
                    <div key={name.Name} className="group bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
                        
                        {/* Rank Controls */}
                        <div className="flex flex-col items-center gap-1 pr-3 border-r border-gray-100 dark:border-zinc-800">
                            <button 
                                onClick={() => moveLike(realIndex, realIndex - 1)}
                                disabled={isFirst || search !== ""} 
                                className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded text-gray-400 hover:text-blue-600 disabled:opacity-20"
                            >
                                <ArrowUp className="w-4 h-4" />
                            </button>
                            <span className="text-xs font-bold text-gray-300 dark:text-zinc-700 font-mono">
                                {realIndex + 1}
                            </span>
                            <button 
                                onClick={() => moveLike(realIndex, realIndex + 1)}
                                disabled={isLast || search !== ""}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded text-gray-400 hover:text-blue-600 disabled:opacity-20"
                            >
                                <ArrowDown className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Link to={`/name/${name.Name}`} className="text-lg font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                        {name.Name}
                                    </Link>
                                    <p className="text-sm text-gray-500 dark:text-zinc-400 truncate">{name.currentMeaning}</p>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                        name.gender === 'male' ? 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' : 
                                        name.gender === 'female' ? 'bg-pink-50 border-pink-100 text-pink-700 dark:bg-pink-900/20 dark:border-pink-800 dark:text-pink-400' : 
                                        'bg-purple-50 border-purple-100 text-purple-700'
                                    }`}>
                                        {t[name.gender]}
                                    </span>
                                    
                                    {/* --- UPDATED: Render Etymology Badges --- */}
                                    <div className="flex flex-wrap justify-end gap-1 mt-1">
                                        {etymologies.map((etym, i) => (
                                            <span key={i} className="text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 px-1.5 py-0.5 rounded border border-gray-200 dark:border-zinc-700">
                                                {etym}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <button 
                            onClick={() => toggleLike(name.Name)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Remove"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                );
            })}
        </div>

      </div>
    </div>
  );
}