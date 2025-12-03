import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { LanguageProvider, useTranslation } from './context/LanguageContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LikesProvider } from './context/LikesContext';
import NameList from './pages/NameList';
import NameDetail from './pages/NameDetail';
import ClusterView from './pages/ClusterView';
import LikedNames from './pages/LikedNames';
import About from './pages/About'; // <--- NEW IMPORT
import { LayoutDashboard, Network, Sun, Moon, Heart, Shuffle, Info } from 'lucide-react'; // <--- Info Icon Added
import { namesData } from './data'; 

function Navigation() {
  const { lang, setLang, t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation(); 
  const navigate = useNavigate(); 

  const isActive = (path) => location.pathname === path;

  const getLinkClass = (path, isRed = false) => {
    const active = isActive(path);
    const base = "flex flex-col items-center p-2 hover:rounded-lg transition-all border border-transparent";
    
    if (isRed) {
        return active 
            ? `${base} text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 font-medium`
            : `${base} text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10`;
    }

    return active
        ? `${base} text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20 font-medium`
        : `${base} text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800`;
  };

  // --- Random Name Logic ---
  const handleRandom = () => {
    if (namesData && namesData.length > 0) {
      const random = namesData[Math.floor(Math.random() * namesData.length)];
      navigate(`/name/${random.Name}`);
    }
  };

  return (
    <nav className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-gray-900 dark:text-white">
          İsimBul
        </Link>
        
        <div className="flex items-center gap-2 md:gap-4">
          <Link to="/" className={getLinkClass('/')}>
            <LayoutDashboard 
                className="w-5 h-5" 
                fill={isActive('/') ? "currentColor" : "none"} 
            /> 
            {t.dashboard}
          </Link>
          
          <Link to="/graph" className={getLinkClass('/graph')}>
            <Network 
                className="w-5 h-5" 
                fill={isActive('/graph') ? "currentColor" : "none"} 
            /> 
            {t.graph}
          </Link>

          <Link to="/favorites" className={getLinkClass('/favorites', true)}>
             <Heart 
                className="w-5 h-5" 
                fill={isActive('/favorites') ? "currentColor" : "none"} 
             /> 
             {t.favorites}
          </Link>

          {/* --- NEW: About Link --- */}
          <Link to="/about" className={getLinkClass('/about')}>
             <Info 
                className="w-5 h-5" 
                fill={isActive('/about') ? "currentColor" : "none"} 
             /> 
             {t.about}
          </Link>
          
          <div className="w-px h-6 bg-gray-200 dark:bg-zinc-800 mx-1"></div>

          {/* --- Random Button --- */}
          <button 
            onClick={handleRandom}
            className="flex flex-col items-center p-2 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all"
            title={t.random || "Random"}
          >
            <Shuffle className="w-5 h-5" />
            {t.randomName}
          </button>

          <button onClick={toggleTheme} className="p-2 rounded-lg text-gray-500 dark:text-yellow-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all">
            {theme === 'light' ? <Moon className="w-5 h-5" fill="currentColor" /> : <Sun className="w-5 h-5" fill="currentColor" />}
          </button>

          <button 
            onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
            className="px-2 py-1 text-xs font-bold bg-gray-100 dark:bg-zinc-800 dark:text-zinc-300 rounded-md border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 transition-all"
          >
            {lang === 'tr' ? 'EN' : 'TR'}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LikesProvider>
        <LanguageProvider>
          <Router>
            <Navigation />
            <Routes>
              <Route path="/" element={<NameList />} />
              <Route path="/name/:id" element={<NameDetail />} />
              <Route path="/graph" element={<ClusterView />} />
              <Route path="/favorites" element={<LikedNames />} />
              <Route path="/about" element={<About />} /> {/* <--- NEW ROUTE */}
            </Routes>
          </Router>
        </LanguageProvider>
      </LikesProvider>
    </ThemeProvider>
  );
}