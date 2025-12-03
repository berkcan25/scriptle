import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { namesData } from '../data';
import { useTranslation } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Settings, Info, RotateCcw, Search, Palette, Scaling, Eye, EyeOff, HelpCircle, X, Move, MousePointerClick, ZoomIn } from 'lucide-react';
import * as d3 from 'd3-force';
import SearchableSelect from '../components/SearchableSelect';

export default function ClusterView() {
  const { t, lang } = useTranslation();
  const { theme } = useTheme();
  const fgRef = useRef();
  
  // Interaction States
  const [hoverNode, setHoverNode] = useState(null);
  const [hoverLegend, setHoverLegend] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showLabels, setShowLabels] = useState(true);
  const [legendClicked, setLegendClicked] = useState(false);
  const [currClicked, setCurrClicked] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  // --- POPUP ON FIRST LOAD LOGIC ---
  useEffect(() => {
    const hasSeenHelp = localStorage.getItem('hasSeenGraphHelp');
    if (!hasSeenHelp) {
        setShowHelp(true);
    }
  }, []);

  const handleCloseHelp = () => {
      setShowHelp(false);
      localStorage.setItem('hasSeenGraphHelp', 'true');
  };

  // Configuration
  const [config, setConfig] = useState({
    minUsage: 25000, 
    originFilter: "all",
    colorMode: "origin", // 'origin', 'gender', 'cluster'
    sizeMultiplier: 1.0,
  });

  const isDarkMode = theme === 'dark';

  // --- Helper: Color Generators ---
  const getOriginColor = (origin) => {
    const colors = {
      "Arapça": "#3b82f6",   // Blue
      "Türkçe": "#ef4444",   // Red
      "Farsça": "#10b981",   // Emerald
      "Yunanca": "#f59e0b",  // Amber
      "İbranice": "#8b5cf6", // Purple
      "Fransızca": "#ec4899",// Pink
      "Moğolca": "#6366f1",  // Indigo
      "Bilinmiyor": isDarkMode ? "#71717a" : "#a1a1aa" // Zinc-500/400
    };
    return colors[origin] || (isDarkMode ? "#71717a" : "#a1a1aa");
  };

  const getClusterColor = (id) => {
    return `hsl(${id * 137.508}, ${isDarkMode ? '70%' : '65%'}, ${isDarkMode ? '55%' : '45%'})`; 
  };

  // 1. Prepare Data
  const graphData = useMemo(() => {
    const nodes = [];
    
    const filteredRawData = namesData.filter(n => {
      const male = n.Statistics?.Count?.male?.total?.total || 0;
      const female = n.Statistics?.Count?.female?.total?.total || 0;
      const total = male + female;
      n._total = total;
      
      if (male > female * 5) n._genderStr = 'Male';
      else if (female > male * 5) n._genderStr = 'Female';
      else n._genderStr = 'Unisex';

      n._baseVal = Math.log(total + 1) * 5; 

      const passesUsage = total >= config.minUsage;
      
      // --- UPDATED: Filter logic for array ---
      // If filter is "all", pass. If specific, check if array includes it.
      const passesOrigin = config.originFilter === "all" || (Array.isArray(n.Etymology) && n.Etymology.includes(config.originFilter));
      
      return passesUsage && passesOrigin;
    });

    filteredRawData.forEach(n => {
      let nodeColor = isDarkMode ? "#71717a" : "#d4d4d8";
      
      // --- UPDATED: Use primary origin (first item) for color assignment ---
      const primaryOrigin = Array.isArray(n.Etymology) ? n.Etymology[0] : n.Etymology;

      if (config.colorMode === 'origin') nodeColor = getOriginColor(primaryOrigin);
      else if (config.colorMode === 'gender') {
          if(n._genderStr === 'Male') nodeColor = "#3b82f6";
          else if(n._genderStr === 'Female') nodeColor = "#ec4899";
          else nodeColor = "#a855f7";
      }
      else if (config.colorMode === 'meaning') nodeColor = getClusterColor(n.cluster);

      nodes.push({
        id: n.Name,
        name: n.Name,
        meaning: lang === 'tr' ? (n.Meaning_TR || n.Meaning_EN) : (n.Meaning_EN || n.Meaning_TR),
        group: n.clusterName, 
        clusterId: n.cluster, 
        
        // Store primary origin for legend/logic, but keep raw array available if needed
        origin: primaryOrigin, 
        allOrigins: Array.isArray(n.Etymology) ? n.Etymology : [n.Etymology],

        gender: n._genderStr,
        val: n._baseVal * config.sizeMultiplier,
        x: n.x ? n.x * 5 : Math.random() * 100, 
        y: n.y ? n.y * 5 : Math.random() * 100,
        color: nodeColor
      });
    });

    return { nodes, links: [] }; 
  }, [config, lang, isDarkMode]);

  // 2. Generate Legend Items
  const legendItems = useMemo(() => {
    const counts = new Map();
    graphData.nodes.forEach(node => {
        let key, color, label;
        if (config.colorMode === 'origin') {
            key = node.origin || 'Unknown';
            color = node.color;
            label = key;
        } else if (config.colorMode === 'gender') {
            key = node.gender;
            color = node.color;
            label = key;
        } else {
            key = node.group;
            color = node.color;
            label = key;
        }
        if (!counts.has(key)) {
            counts.set(key, { label, color, count: 0 });
        }
        counts.get(key).count++;
    });
    return Array.from(counts.values()).sort((a, b) => b.count - a.count);
  }, [graphData, config.colorMode]);

  // 3. Physics Engine
  useEffect(() => {
    if(fgRef.current) {
      fgRef.current.d3Force('collide', d3.forceCollide().radius(node => node.val + 4).iterations(2));
      fgRef.current.d3Force('charge', d3.forceManyBody().strength(-10));
      fgRef.current.d3ReheatSimulation();
    }
  }, [graphData]);

  // 4. Handlers
  const handleNodeClick = useCallback(node => {
    fgRef.current.centerAt(node.x, node.y, 1000);
    fgRef.current.zoom(6, 2000);
  }, [fgRef]);

  const handleSearch = (e) => {
    e.preventDefault();
    const node = graphData.nodes.find(n => n.name.toLowerCase() === searchTerm.toLowerCase());
    if (node) {
      handleNodeClick(node);
      setHoverNode(node);
    } else {
      alert("Name not found in current view");
    }
  };

  // --- UPDATED: Unique Origins Extraction using .flat() ---
  const uniqueOrigins = useMemo(() => {
      const allOrigins = namesData.map(n => n.Etymology).flat().filter(Boolean);
      return [...new Set(allOrigins)].sort();
  }, []);

  return (
    <div className="h-[calc(100vh-64px)] w-full bg-gray-50 dark:bg-zinc-950 relative overflow-hidden flex font-sans transition-colors duration-200">
      
      {/* --- HELP POPUP MODAL --- */}
      {showHelp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-2xl rounded-2xl max-w-md w-full p-6 relative">
                <button 
                    onClick={handleCloseHelp}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-500" />
                    {t.graphHelpTitle}
                </h3>
                <p className="text-gray-600 dark:text-zinc-400 text-sm mb-6 leading-relaxed">
                    {t.graphHelpDesc}
                </p>

                <div className="space-y-4">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                            <Move className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-zinc-200 text-sm">{t.graphHelpNav}</h4>
                            <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">{t.graphHelpNavDesc}</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0 text-purple-600 dark:text-purple-400">
                            <ZoomIn className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-zinc-200 text-sm">{t.graphHelpZoom}</h4>
                            <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">{t.graphHelpZoomDesc}</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
                            <MousePointerClick className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-zinc-200 text-sm">{t.graphHelpClick}</h4>
                            <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">{t.graphHelpClickDesc}</p>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleCloseHelp}
                    className="w-full mt-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors text-sm shadow-lg shadow-blue-500/20"
                >
                    {t.gotIt}
                </button>
            </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="absolute left-4 top-4 w-80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-5 rounded-2xl shadow-xl z-10 border border-gray-200 dark:border-zinc-800 flex flex-col gap-5 max-h-[calc(100vh-2rem)] overflow-y-auto scrollbar-none transition-colors duration-200">
        
        {/* Search */}
        <form onSubmit={handleSearch} className="relative">
          <input 
            type="text" 
            placeholder={t.search}
            className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder-gray-500 dark:placeholder-zinc-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400 dark:text-zinc-500" />
        </form>

        <div className="h-px bg-gray-100 dark:bg-zinc-800" />

        {/* Settings: Usage Filter */}
        <div>
            <label className="text-[11px] font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-3 flex justify-between">
                <span>Min. {t.count}</span>
                <span className="text-gray-900 dark:text-zinc-300 font-mono">{config.minUsage.toLocaleString()}</span>
            </label>
            <input 
                type="range" min="100" max="50000" step="100" 
                value={config.minUsage} 
                onChange={(e) => setConfig({...config, minUsage: Number(e.target.value)})}
                className="w-full h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
            />
        </div>

        {/* Settings: Origin Filter */}
        <div>
           <SearchableSelect
              label={t.filter_origin}
              placeholder={t.all}
              allLabel={t.all}
              options={uniqueOrigins}
              value={config.originFilter}
              onChange={(val) => setConfig({...config, originFilter: val})}
           />
        </div>

        <div className="h-px bg-gray-100 dark:bg-zinc-800" />

        {/* Settings: Color Mode */}
        <div>
          <label className="text-[11px] font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Palette className="w-3 h-3" /> {t.color}
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800">
              {['origin', 'gender', 'meaning'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setConfig({...config, colorMode: mode})}
                    className={`px-2 py-1.5 text-[10px] font-semibold rounded-md capitalize transition-all ${
                        config.colorMode === mode 
                        ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                        : 'text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'
                    }`}
                  >
                      {t[mode] || mode}
                  </button>
              ))}
          </div>
        </div>

        {/* Settings: Size Slider */}
        <div>
            <label className="text-[11px] font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-3 flex justify-between items-center">
                <span className="flex gap-1.5 items-center"><Scaling className="w-3 h-3" />{t.nodeSize}</span>
                <span className="text-gray-900 dark:text-zinc-300 font-mono">{config.sizeMultiplier.toFixed(1)}x</span>
            </label>
            <input 
                type="range" min="0.5" max="3.0" step="0.1" 
                value={config.sizeMultiplier} 
                onChange={(e) => setConfig({...config, sizeMultiplier: Number(e.target.value)})}
                className="w-full h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-600 dark:accent-purple-500"
            />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-auto">
             {/* Labels Toggle */}
            <button 
                onClick={() => setShowLabels(!showLabels)}
                title={showLabels ? t.hide : t.show}
                className="flex items-center justify-center py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
            >
                {showLabels ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            
            {/* Help Button - Manually open help */}
            <button 
                onClick={() => setShowHelp(true)}
                title={t.graphHelpTitle}
                className="flex items-center justify-center py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
            >
                <HelpCircle className="w-4 h-4" />
            </button>

            {/* Reset View */}
            <button 
                onClick={() => fgRef.current.zoomToFit(400)}
                title={t.resetView}
                className="flex items-center justify-center py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-lg shadow-blue-900/20"
            >
                <RotateCcw className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute right-4 top-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-0 rounded-xl text-xs w-[240px] max-h-[60vh] overflow-hidden z-10 border border-gray-200 dark:border-zinc-800 shadow-xl flex flex-col transition-colors duration-200">
        <div className="flex items-center gap-2 p-3 border-b border-gray-100 dark:border-zinc-800 font-bold text-gray-900 dark:text-zinc-200 bg-gray-50/50 dark:bg-zinc-900/50">
            <Info className="w-3.5 h-3.5 text-blue-500" />
            {t[config.colorMode] || config.colorMode}
        </div>
        
        <div className="overflow-y-auto p-2 space-y-0.5 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-zinc-700">
            {legendItems.map((item, idx) => (
                <div 
                    key={idx} 
                    onMouseEnter={() => setHoverLegend(item.label)}
                    onMouseLeave={() => setHoverLegend(legendClicked ? currClicked : null)}
                    onClick={() => {
                        const isSame = currClicked === item.label;
                        setLegendClicked(!isSame);
                        setCurrClicked(isSame ? null : item.label);
                        setHoverLegend(isSame ? null : item.label);
                    }}
                    className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-200 ${
                      (currClicked === item.label || hoverLegend === item.label)
                      ? "bg-blue-50 dark:bg-blue-900/20" 
                      : "hover:bg-gray-100 dark:hover:bg-zinc-800/50"
                    }`}
                >
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-black/10 dark:ring-white/10" style={{ backgroundColor: item.color }}></div>
                    <span className={`truncate flex-1 ${currClicked === item.label ? 'font-semibold text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-zinc-400'}`}>
                      {item.label}
                    </span>
                    <span className="text-gray-400 dark:text-zinc-600 text-[10px] font-mono bg-gray-100 dark:bg-zinc-800 px-1.5 rounded">
                      {item.count}
                    </span>
                </div>
            ))}
            {legendItems.length === 0 && <div className="p-4 text-center text-gray-400 dark:text-zinc-600 italic">No items visible</div>}
        </div>
      </div>

      <div className="flex-1 cursor-move">
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          backgroundColor={isDarkMode ? "#09090b" : "#f9fafb"} // Adaptive BG
          
          cooldownTicks={100}
          onEngineStop={() => fgRef.current.zoomToFit(400)} 
          onNodeHover={setHoverNode}
          onClick={() => {
            setLegendClicked(false)
            setHoverLegend(null)
            setCurrClicked(null)
          }}

          nodePointerAreaPaint={(node, color, ctx) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
            ctx.fill();
          }}

          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 14/globalScale;
            
            const isHovered = node === hoverNode;
            
            let isDimmed = false;
            if (hoverNode && node !== hoverNode) {
                isDimmed = true;
            } else if (hoverLegend) {
                let match = false;
                if (config.colorMode === 'origin' && node.origin === hoverLegend) match = true;
                if (config.colorMode === 'gender' && node.gender === hoverLegend) match = true;
                if (config.colorMode === 'meaning' && node.group === hoverLegend) match = true;
                if (!match) isDimmed = true;
            }

            // Opacity handled here
            ctx.globalAlpha = isDimmed ? 0.1 : 1;

            // Glow Effect for Hovered Nodes
            if (isHovered) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = node.color;
            } else {
                ctx.shadowBlur = 0;
            }

            // Node Circle
            ctx.beginPath(); 
            ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false); 
            ctx.fillStyle = node.color; 
            ctx.fill();
            
            // Reset Shadow
            ctx.shadowBlur = 0;

            // Selection Ring (Adaptive Stroke)
            if (isHovered) {
                ctx.strokeStyle = isDarkMode ? '#ffffff' : '#000000'; // Adaptive stroke
                ctx.lineWidth = 2.5 / globalScale;
                ctx.stroke();
                ctx.globalAlpha = 1; 
            }

            // Text Label
            if (showLabels && (!isDimmed || isHovered) && (isHovered || globalScale > 1.2 || node.val > 12)) {
              ctx.font = `${isHovered ? 'bold ' : '500 '}${fontSize}px Inter, sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              // Text Stroke (Outline) for readability
              ctx.strokeStyle = isDarkMode ? '#09090b' : '#ffffff'; // Adaptive outline
              ctx.lineWidth = 3 / globalScale;
              ctx.strokeText(label, node.x, node.y + node.val + fontSize);
              
              // Text Fill
              ctx.fillStyle = isHovered 
                ? (isDarkMode ? '#ffffff' : '#000000') 
                : (isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)');
              ctx.fillText(label, node.x, node.y + node.val + fontSize);
            }

            ctx.globalAlpha = 1;
          }}
          
          // Tooltip HTML (Adaptive Styles)
          // --- UPDATED: Map over allOrigins for badges ---
          nodeLabel={node => `
             <div style="
              background: ${isDarkMode ? 'rgba(24, 24, 27, 0.95)' : 'rgba(255, 255, 255, 0.95)'}; 
              backdrop-filter: blur(4px);
              padding: 12px; 
              border-radius: 12px; 
              border: 1px solid ${isDarkMode ? 'rgba(63, 63, 70, 0.5)' : 'rgba(228, 228, 231, 0.5)'};
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
              font-family: sans-serif;
              min-width: 150px;
              color: ${isDarkMode ? '#fff' : '#18181b'};
              ">
              <strong style="font-size: 16px; display: block; margin-bottom: 4px;">${node.name}</strong>
              <div style="display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap;">
                  ${node.allOrigins.map(org => `
                      <span style="font-size: 10px; background: ${node.color}33; color: ${node.color}; padding: 2px 6px; border-radius: 4px; font-weight: 600; border: 1px solid ${node.color}55;">
                        ${org || 'Unknown'}
                      </span>
                  `).join('')}
                  <span style="font-size: 10px; background: ${isDarkMode ? '#27272a' : '#f4f4f5'}; color: ${isDarkMode ? '#a1a1aa' : '#71717a'}; padding: 2px 6px; border-radius: 4px; border: 1px solid ${isDarkMode ? '#3f3f46' : '#e4e4e7'};">${node.gender}</span>
              </div>
              <div style="font-size: 11px; color: ${isDarkMode ? '#d4d4d8' : '#52525b'}; border-top: 1px solid ${isDarkMode ? '#3f3f46' : '#e4e4e7'}; padding-top: 6px; margin-top: 6px;">
                ${node.group}
              </div>
              <div style="font-size: 12px; color: ${isDarkMode ? '#a1a1aa' : '#71717a'}; margin-top: 4px; font-style: italic;">
                ${node.meaning || ""}
              </div>
            </div>
          `}
          onNodeClick={handleNodeClick}
        />
      </div>
    </div>
  );
}