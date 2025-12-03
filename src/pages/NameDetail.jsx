import { useParams, Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import { useLikes } from '../context/LikesContext';
import { namesData } from '../data';
import { useTheme } from '../context/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowLeft, BookOpen, Copy, GitBranch, Heart, Share2, Users } from 'lucide-react'; 
import { useMemo } from 'react';

export default function NameDetail() {
  const { id } = useParams();
  const { t, lang } = useTranslation();
  const { isLiked, toggleLike } = useLikes();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const nameData = namesData.find(n => n.Name === id);

  // --- Share Logic ---
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `İsimBul: ${nameData.Name}`,
          text: `${nameData.Name} isminin anlamını ve istatistiklerini incele!`,
          url: window.location.href,
        });
      } catch (err) { console.error(err); }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(t.linkCopied || "Link copied!");
    }
  };

  if (!nameData) return <div className="dark:text-white p-6">Name not found</div>;

  const stats = nameData.Statistics?.Count || {};
  
  const chartData = [
    {
      name: '> 1923',
      Male: stats.male?.post1923?.total || 0,
      Female: stats.female?.post1923?.total || 0
    },
    {
      name: '> 1980',
      Male: stats.male?.post1980?.total || 0,
      Female: stats.female?.post1980?.total || 0
    },
    {
      name: '> 2008',
      Male: stats.male?.post2008?.total || 0,
      Female: stats.female?.post2008?.total || 0
    },
    {
      name: t.total,
      Male: stats.male?.total?.total || 0,
      Female: stats.female?.total?.total || 0
    },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: isDarkMode ? 'rgba(24, 24, 27, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(4px)',
          padding: '12px',
          borderRadius: '12px',
          border: `1px solid ${isDarkMode ? 'rgba(63, 63, 70, 0.5)' : 'rgba(228, 228, 231, 0.5)'}`,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          fontFamily: 'sans-serif',
          minWidth: '160px',
          color: isDarkMode ? '#fff' : '#18181b',
        }}>
          <strong style={{ fontSize: '15px', display: 'block', marginBottom: '8px' }}>
            {label}
          </strong>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
            {payload.map((entry, index) => (
              <span key={index} style={{
                fontSize: '11px',
                background: `${entry.color}15`,
                color: entry.color,
                padding: '3px 8px',
                borderRadius: '6px',
                fontWeight: 600,
                border: `1px solid ${entry.color}40`,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {entry.name}: {entry.value}
              </span>
            ))}
          </div>
          <div style={{
            fontSize: '11px',
            color: isDarkMode ? '#a1a1aa' : '#71717a',
            borderTop: `1px solid ${isDarkMode ? '#3f3f46' : '#e4e4e7'}`,
            paddingTop: '6px',
            marginTop: '6px',
            fontStyle: 'italic'
          }}>
            {nameData.Meaning_TR || "No definition available"}
          </div>
        </div>
      );
    }
    return null;
  };

  // Helper to normalize Etymology to an array
  const etymologies = Array.isArray(nameData.Etymology) 
    ? nameData.Etymology 
    : [nameData.Etymology].filter(Boolean);

  return (
    <div className="bg-gray-50 dark:bg-zinc-950 min-h-screen transition-colors duration-200">
      
      {/* --- Native React 19 Metadata Support --- */}
      <title>{nameData.Name} {t.meaning} | İsimBul</title>
      <meta name="description" content={nameData.Meaning_TR || nameData.Meaning_EN} />
      <meta property="og:title" content={`${nameData.Name} - İsimBul`} />
      <meta property="og:description" content={nameData.Meaning_TR} />

      <div className="max-w-6xl mx-auto p-6">
        <Link to="/" className="inline-flex items-center text-gray-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 font-medium text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> {t.back}
        </Link>

        {/* Header Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-8 mb-6 border border-gray-100 dark:border-zinc-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{nameData.Name}</h1>
                    <div className="flex flex-wrap gap-2">
                        {nameData.Is_Quranic && (
                            <span className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-sm font-medium">
                                {t.isQuranic}
                            </span>
                        )}
                        
                        {/* --- UPDATED: Map over etymologies to create multiple badges --- */}
                        {etymologies.map((etym, index) => (
                            <span key={index} className="bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-300 px-3 py-1 rounded-full text-sm font-medium border border-gray-200 dark:border-zinc-700">
                                {etym}
                            </span>
                        ))}
                    </div>
                </div>
                {/* butonlar */}
                <div className='flex items-center gap-3'>
                  {/* Kalp Butonu */}
                  <button 
                      onClick={() => toggleLike(nameData.Name)}
                      className={`p-3 rounded-full transition-all shadow-sm border ${isLiked(nameData.Name) ? 'bg-red-50 border-red-100 text-red-500 dark:bg-red-900/20 dark:border-red-900/30' : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 dark:bg-zinc-800 dark:border-zinc-700'}`}
                  >
                      <Heart className={`w-8 h-8 ${isLiked(nameData.Name) ? 'fill-current' : ''}`} />
                  </button>

                  {/* --- Share Button --- */}
                  <button 
                      onClick={handleShare}
                      title={t.share || "Share"}
                      className="p-3 rounded-full bg-gray-50 border border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-200 dark:bg-zinc-800 dark:border-zinc-700 transition-all"
                  >
                      <Share2 className="w-8 h-8" />
                  </button>
                </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center gap-2 mb-3 text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wide text-xs">
                <BookOpen className="w-4 h-4" /> {t.meaning}
              </div>
              <div className="space-y-4">
                  <div>
                      <span className="text-[10px] font-bold text-blue-400/80 uppercase tracking-wider">{t.turkish}</span>
                      <p className="text-gray-900 dark:text-zinc-100 text-lg font-medium leading-relaxed">{nameData.Meaning_TR || "N/A"}</p>
                  </div>
                  {nameData.Meaning_EN && (
                      <div className="pt-3 border-t border-blue-200/50 dark:border-blue-800/30">
                        <span className="text-[10px] font-bold text-blue-400/80 uppercase tracking-wider">{t.english}</span>
                        <p className="text-gray-600 dark:text-zinc-400 italic">{nameData.Meaning_EN}</p>
                      </div>
                  )}
              </div>
            </div>
            
            <div className="space-y-4">
                {/* Variants */}
                {nameData.Variants && nameData.Variants.length > 0 && (
                    <div className="p-5 bg-purple-50/50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/30">
                        <div className="flex items-center gap-2 mb-3 text-purple-700 dark:text-purple-300 font-bold uppercase tracking-wide text-xs">
                            <Copy className="w-4 h-4" /> Variants
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {nameData.Variants.map(v => (
                                <div key={v} className="px-3 py-1.5 bg-white dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800/50 text-sm font-medium text-gray-700 dark:text-purple-100 hover:text-purple-600 hover:border-purple-300 dark:hover:border-purple-500 transition-all shadow-sm">
                                    {v}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Derivations */}
                {nameData.Derivations && nameData.Derivations.length > 0 && (
                    <div className="p-5 bg-orange-50/50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30">
                        <div className="flex items-center gap-2 mb-3 text-orange-700 dark:text-orange-300 font-bold uppercase tracking-wide text-xs">
                            <GitBranch className="w-4 h-4" /> Related Names
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {nameData.Derivations.map(v => (
                                <Link to={`/name/${v}`} key={v} className="px-3 py-1.5 bg-white dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800/50 text-sm font-medium text-gray-700 dark:text-orange-100 hover:text-orange-600 hover:border-orange-300 dark:hover:border-orange-500 transition-all shadow-sm">
                                    {v}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

            </div>
          </div>
        </div>
        
        {/* Statistics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-8 mb-6 border border-gray-100 dark:border-zinc-800">
          
          {/* Usage Chart */}
          <div className="lg:col-span-2 p-6 ">
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Usage Distribution (Cumulative)</h2>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-10" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    content={<CustomTooltip/>}
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                  <Bar dataKey="Male" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Male Count" />
                  <Bar dataKey="Female" fill="#ec4899" radius={[4, 4, 0, 0]} name="Female Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="space-y-6">
              <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                 <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Total Counts</h3>
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">Male</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{(stats.male?.total?.total || 0).toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-pink-600 dark:text-pink-400 font-medium">Female</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{(stats.female?.total?.total || 0).toLocaleString()}</span>
                 </div>
              </div>

              <div className="p-6  bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                 <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Ranking</h3>
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 dark:text-gray-300">Male Rank</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">#{nameData.Statistics?.Rank?.male?.toLocaleString() || '-'}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Female Rank</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">#{nameData.Statistics?.Rank?.female?.toLocaleString() || '-'}</span>
                 </div>
              </div>
          </div>

        </div>
      </div>
    </div>
  );
}