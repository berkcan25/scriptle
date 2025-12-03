import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import { useLikes } from '../context/LikesContext';
import { namesData } from '../data';
import { Search, List, LayoutGrid, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Check, Heart } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect'; 

export default function NameList() {
  const { t, lang } = useTranslation();
  const { isLiked, toggleLike } = useLikes();
  
  const [showLikedOnly, setShowLikedOnly] = useState(false); 

  // --- LOCAL STORAGE FOR VIEW MODE ---
  const [viewMode, setViewMode] = useState(() => {
      return localStorage.getItem('viewMode') || 'table';
  });

  // Save to local storage whenever viewMode changes
  useEffect(() => {
      localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'totalCount', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const [filters, setFilters] = useState({
    gender: "all",
    origin: "all",
    cluster: "all",
    isQuranic: false,
  });

  // 1. Data Normalization
  const processedData = useMemo(() => {
    return namesData.map(n => {
      const maleCount = n.Statistics?.Count?.male?.total?.total || 0;
      const femaleCount = n.Statistics?.Count?.female?.total?.total || 0;
      const totalCount = maleCount + femaleCount;
      
      let gender = 'unisex';
      if (maleCount > femaleCount * 10) gender = 'male';
      else if (femaleCount > maleCount * 10) gender = 'female';

      const maleRank = n.Statistics?.Rank?.male || 999999;
      const femaleRank = n.Statistics?.Rank?.female || 999999;
      const bestRank = Math.min(maleRank, femaleRank);

      return {
        ...n,
        totalCount,
        gender,
        bestRank,
        currentMeaning: lang === 'tr' ? (n.Meaning_TR || n.Meaning_EN) : (n.Meaning_EN || n.Meaning_TR)
      };
    });
  }, [lang]);

  // 2. Filtering & Sorting
  const filteredAndSortedData = useMemo(() => {
    let data = processedData.filter(n => {
      const matchesSearch = n.Name.toLowerCase().includes(search.toLowerCase());
      const matchesGender = filters.gender === "all" || n.gender === filters.gender;
      
      // --- UPDATED: Origin Filter Logic for Arrays ---
      const matchesOrigin = filters.origin === "all" || (Array.isArray(n.Etymology) && n.Etymology.includes(filters.origin));
      
      const matchesCluster = filters.cluster === "all" || (n.clusterName && n.clusterName === filters.cluster);
      const matchesQuranic = !filters.isQuranic || n.Is_Quranic;
      
      const matchesLiked = !showLikedOnly || isLiked(n.Name);
      
      return matchesSearch && matchesGender && matchesOrigin && matchesQuranic && matchesCluster && matchesLiked;
    });

    if (sortConfig.key !== null) {
      data.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [search, filters, processedData, sortConfig, showLikedOnly, isLiked]);

  // 3. PAGINATION SLICE
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters, itemsPerPage, showLikedOnly]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(start, start + itemsPerPage);
  }, [currentPage, itemsPerPage, filteredAndSortedData]);

  // Helper Functions
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="w-4 h-4 text-gray-400 opacity-50" />;
    return sortConfig.direction === 'ascending' 
      ? <ArrowUp className="w-4 h-4 text-blue-600 dark:text-blue-400" /> 
      : <ArrowDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
  };

  // --- UPDATED: Unique Origins Extraction ---
  // We use .flat() because Etymology is now ['Farsça', 'Kürtçe']
  const uniqueOrigins = useMemo(() => {
      const allOrigins = namesData.map(n => n.Etymology).flat().filter(Boolean);
      return [...new Set(allOrigins)].sort();
  }, []);

  const uniqueClusters = useMemo(() => {
      return [...new Set(namesData.map(n => n.clusterName).filter(Boolean))].sort();
  }, []);

  return (
    <div className="p-6 bg-gray-50 dark:bg-zinc-950 min-h-screen transition-colors duration-200 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* ... (Controls Header) ... */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm mb-8 border border-gray-100 dark:border-zinc-800">
           <div className="flex flex-col md:flex-row gap-5 justify-between items-center mb-6">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder={t.search}
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-white transition-all"
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex bg-gray-100 dark:bg-zinc-950 p-1 rounded-xl border border-gray-200 dark:border-zinc-800">
              <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-zinc-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-zinc-500'}`}><List className="w-5 h-5" /></button>
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-zinc-500'}`}><LayoutGrid className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-end pt-2">
             <div className="w-full">
                <SearchableSelect label={t.showNum} placeholder="50" allLabel={t.showAll} options={[50, 100, 200, 500, 1000]} value={itemsPerPage === namesData.length ? "all" : itemsPerPage} onChange={(val) => setItemsPerPage(val === "all" ? namesData.length : val)} />
             </div>
             <div className="w-full">
                <SearchableSelect label={t.filter_gender} placeholder={t.all} allLabel={t.all} options={[{ value: 'male', label: t.male }, { value: 'female', label: t.female }, { value: 'unisex', label: t.unisex }]} value={filters.gender} onChange={(val) => setFilters({...filters, gender: val})} />
             </div>
             <div className="w-full">
                <SearchableSelect label={t.filter_origin} placeholder={t.all} allLabel={t.all} options={uniqueOrigins} value={filters.origin} onChange={(val) => setFilters({...filters, origin: val})} />
             </div>
             <div className="w-full">
                <SearchableSelect label={t.meaning} placeholder={t.all} allLabel={t.all} options={uniqueClusters} value={filters.cluster} onChange={(val) => setFilters({...filters, cluster: val})} />
             </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center pt-6 mt-4 border-t border-gray-100 dark:border-zinc-800 gap-4">
             <label className="flex items-center gap-3 cursor-pointer group select-none">
              <div className="relative flex items-center">
                <input type="checkbox" className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 checked:border-blue-500 checked:bg-blue-500 transition-all shadow-sm" onChange={(e) => setFilters({...filters, isQuranic: e.target.checked})} />
                <Check className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" strokeWidth={3} />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-zinc-400 group-hover:text-gray-900 dark:group-hover:text-zinc-200 transition-colors">{t.filter_quranic}</span>
            </label>
            <span className="text-xs font-medium text-gray-500 dark:text-zinc-500 bg-gray-100 dark:bg-zinc-900/80 px-3 py-1.5 rounded-full border border-gray-200 dark:border-zinc-800">{filteredAndSortedData.length.toLocaleString()} {t.results || "sonuç"}</span>
          </div>
        </div>

        {/* --- TABLE VIEW --- */}
        {viewMode === 'table' && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-zinc-800">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-zinc-800">
                <thead className="bg-gray-50/50 dark:bg-zinc-950/30">
                  <tr>
                    <th className="px-6 py-4 w-16 text-center cursor-pointer group select-none" onClick={() => setShowLikedOnly(!showLikedOnly)}>
                       <div title={showLikedOnly ? "Show All" : "Show Favorites Only"} className={`flex items-center justify-center p-1.5 rounded-full transition-all ${showLikedOnly ? 'bg-red-50 dark:bg-red-900/20' : 'hover:bg-gray-200 dark:hover:bg-zinc-800'}`}>
                         <Heart 
                           className={`w-4 h-4 transition-all ${
                             showLikedOnly 
                             ? 'fill-red-500 text-red-500 scale-110' 
                             : 'text-gray-400 group-hover:text-red-400'
                           }`} 
                         />
                       </div>
                    </th>
                    <th onClick={() => requestSort('bestRank')} className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider cursor-pointer group"><div className="flex items-center gap-1"># {t.rank} <SortIcon column="bestRank" /></div></th>
                    <th onClick={() => requestSort('Name')} className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider cursor-pointer"><div className="flex items-center gap-1">{t.name} <SortIcon column="Name" /></div></th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider">{t.filter_gender}</th>
                    <th onClick={() => requestSort('totalCount')} className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider cursor-pointer"><div className="flex items-center gap-1">{t.count} <SortIcon column="totalCount" /></div></th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider">{t.filter_origin}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider">{t.quranic}</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider">{t.details}</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-100 dark:divide-zinc-800/50">
                  {paginatedData.map((name) => (
                    <tr key={name.Name} className="hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleLike(name.Name);
                            }}
                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <Heart 
                                className={`w-5 h-5 transition-all ${
                                    isLiked(name.Name) 
                                    ? 'fill-red-500 text-red-500 scale-110' 
                                    : 'text-gray-400 hover:text-red-400'
                                }`} 
                            />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-zinc-400 font-mono">#{name.bestRank === 999999 ? '-' : name.bestRank}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900 dark:text-zinc-100">{name.Name}</div>
                        <div className="text-xs text-gray-500 dark:text-zinc-500 truncate max-w-[200px]">{name.currentMeaning}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-[11px] leading-4 font-semibold rounded-full border ${
                          name.gender === 'male' ? 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400' : 
                          name.gender === 'female' ? 'bg-pink-50 border-pink-100 text-pink-700 dark:bg-pink-500/10 dark:border-pink-500/20 dark:text-pink-400' :
                          'bg-purple-50 border-purple-100 text-purple-700 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-400'
                        }`}>
                          {t[name.gender]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-zinc-300 font-medium tabular-nums">{name.totalCount.toLocaleString()}</td>
                      
                      {/* --- UPDATED: Display joined array --- */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-zinc-400">
                        {Array.isArray(name.Etymology) ? name.Etymology.join(', ') : name.Etymology}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {name.Is_Quranic && (
                            <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">{t.isQuranic || "Evet"}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/name/${name.Name}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold text-xs uppercase tracking-wide">
                          {t.details || "İncele"}
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {paginatedData.length === 0 && (
                      <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-zinc-500">
                             {showLikedOnly ? "No liked names found." : "No names matching your criteria."}
                          </td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* --- GRID VIEW --- */}
        {viewMode === 'grid' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {paginatedData.map((name) => (
                    <Link to={`/name/${name.Name}`} key={name.Name} className="block group">
                        <div className={`
                            bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm hover:shadow-md transition-all 
                            border border-gray-200 dark:border-zinc-800 text-gray-900  dark:text-white
                            ${name.gender === 'male' ? 'hover:border-blue-400 dark:hover:border-blue-500/50' : 
                              name.gender === 'female' ? 'hover:border-pink-400 dark:hover:border-pink-500/50' : 
                              'hover:border-purple-400 dark:hover:border-purple-500/50'}
                               ${name.gender === 'male' ? 'hover:text-blue-400 dark:hover:text-blue-500/50' : 
                                    name.gender === 'female' ? 'hover:text-pink-400 dark:hover:text-pink-500/50' : 
                                    'hover:text-purple-400 dark:hover:text-purple-500/50'}
                        `}>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <h3 className={`text-lg font-bold`}>{name.Name}</h3>
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault(); 
                                            e.stopPropagation();
                                            toggleLike(name.Name);
                                        }}
                                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        <Heart 
                                            className={`w-4 h-4 transition-all ${
                                                isLiked(name.Name) 
                                                ? 'fill-red-500 text-red-500' 
                                                : 'text-gray-300 dark:text-zinc-600 hover:text-red-400'
                                            }`} 
                                        />
                                    </button>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${name.gender === 'male' ? 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400' : name.gender === 'female' ? 'bg-pink-50 border-pink-100 text-pink-700 dark:bg-pink-500/10 dark:border-pink-500/20 dark:text-pink-400' : 'bg-purple-50 border-purple-100 text-purple-700 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-400'}`}>{t[name.gender]}</span>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-zinc-400 mb-5 line-clamp-2 min-h-[40px] leading-relaxed">{name.currentMeaning}</div>
                            <div className="flex justify-between text-xs pt-4 border-t border-gray-100 dark:border-zinc-800 text-gray-500 dark:text-zinc-500">
                                <div className="flex flex-col gap-1"><span className="uppercase tracking-wider font-semibold opacity-70">{t.rank}</span><span className="font-bold text-gray-900 dark:text-zinc-200 text-sm font-mono">#{name.bestRank === 999999 ? '-' : name.bestRank.toLocaleString()}</span></div>
                                <div className="flex flex-col text-right gap-1"><span className="uppercase tracking-wider font-semibold opacity-70">{t.count}</span><span className="font-bold text-gray-900 dark:text-zinc-200 text-sm tabular-nums">{name.totalCount.toLocaleString()}</span></div>
                            </div>
                        </div>
                    </Link>
                 ))}
             </div>
        )}

        {/* ... (Pagination Controls) ... */}
         {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-4 pb-12">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all shadow-sm"><ChevronLeft className="w-5 h-5 text-gray-600 dark:text-zinc-400" /></button>
            <span className="text-sm font-medium text-gray-600 dark:text-zinc-400 tabular-nums">{t.page} <span className="text-gray-900 dark:text-white font-bold">{currentPage}</span> / {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all shadow-sm"><ChevronRight className="w-5 h-5 text-gray-600 dark:text-zinc-400" /></button>
          </div>
        )}

      </div>
    </div>
  );
}