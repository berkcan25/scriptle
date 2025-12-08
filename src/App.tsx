import React, { useState, useEffect, useRef } from 'react';
import { Trophy, ArrowLeft, RefreshCw, CheckCircle, XCircle, Play, Shuffle, GraduationCap, Feather, Eye, Search, AlertCircle, LayoutGrid, RectangleHorizontal, Crown } from 'lucide-react';
import { SCRIPTS } from './scripts';
import './App.css';

// --- Data Definitions ---

type ScriptItem = {
  char: string;
  name: string;
  accepted: string[];
};

type ScriptData = {
  id: string;
  title: string;
  description: string;
  color: string;
  items: ScriptItem[];
};

// --- Utility Functions ---

const normalize = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');

const getRandomItem = (items: ScriptItem[], count: number = 1) => {
  const shuffled = [...items].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// --- Components ---

const Modal = ({ children, isOpen, onClose }: { children: React.ReactNode, isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-stone-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#fdfbf7] rounded border-2 border-stone-300 shadow-xl max-w-md w-full p-8 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-stone-800 opacity-10"></div>
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-700">
          <XCircle size={24} />
        </button>
        {children}
      </div>
    </div>
  );
};

export default function ScriptSprint() {
  const [view, setView] = useState<'menu' | 'quiz' | 'random'>('menu');
  const [activeScript, setActiveScript] = useState<ScriptData | null>(null);
  
  // Settings
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [strictMode, setStrictMode] = useState(false);
  const [quizLayout, setQuizLayout] = useState<'grid' | 'card'>('grid');

  // Quiz Mode State
  const [quizInput, setQuizInput] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [quizTimer, setQuizTimer] = useState(0);
  const [quizActive, setQuizActive] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showQuizAns, setShowQuizAns] = useState(false);
  
  // Random Mode State
  const [randomItem, setRandomItem] = useState<{ item: ScriptItem, scriptName: string, scriptColor: string } | null>(null);
  const [randomInput, setRandomInput] = useState('');
  const [randomScore, setRandomScore] = useState(0);
  const [randomStreak, setRandomStreak] = useState(0);
  const [randomFeedback, setRandomFeedback] = useState<'none' | 'correct' | 'wrong' | 'gameover'>('none');
  const [chaosAnimState, setChaosAnimState] = useState<'in' | 'out' | 'shake' | 'idle'>('in');

  const inputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showPerfected, setShowPerfected] = useState(false);
  const [cardAnimating, setCardAnimating] = useState(false);
  
  // State Load Features: Safe LocalStorage Access
  const [completedScripts, setCompletedScripts] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('scriptSprintCompleted');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load progress", e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('scriptSprintCompleted', JSON.stringify(completedScripts));
  }, [completedScripts]);


    const [completedStrictScripts, setCompletedStrictScripts] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('completedStrictScripts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load progress", e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('completedStrictScripts', JSON.stringify(completedStrictScripts));
  }, [completedStrictScripts]);

  // --- Effects & Timers ---

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (quizActive && !quizFinished && quizTimer > 0 && !isPracticeMode) {
      interval = setInterval(() => {
        setQuizTimer((t) => {
          if (t <= 1) {
            // Time expired
            setQuizFinished(true);
            setQuizActive(false);
            setShowQuizModal(true); 
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizActive, quizFinished, quizTimer, isPracticeMode]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  // Reset states when returning to menu
  useEffect(() => {
    if (view === 'menu') {
      setQuizActive(false);
      setQuizFinished(false);
      setCurrentIndex(0);
      setQuizInput('');
      setRandomItem(null);
      setShowQuizModal(false);
    }
  }, [view]);

  // --- Actions: Menu ---

  const startQuiz = (script: ScriptData) => {
    setActiveScript(script);
    setCurrentIndex(0);
    setQuizInput('');
    // 5 seconds per item, max 5 minutes, unless practice mode
    setQuizTimer(script.items.length * 5 > 300 ? 300 : script.items.length * 5); 
    setQuizActive(true);
    setQuizFinished(false);
    setShowQuizModal(false);
    setView('quiz');
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const startRandomMode = () => {
    setView('random');
    setRandomScore(0);
    setRandomStreak(0);
    setChaosAnimState('in');
    nextRandomItem(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // --- Actions: Quiz Mode (Sequential) ---

  const handleQuizInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (quizFinished || !quizActive) return;
    const val = e.target.value;
    setQuizInput(val);

    const normVal = normalize(val);
    if (!normVal) return;
    if (!activeScript) return;

    // Safety check for bounds
    const currentItem = activeScript.items[currentIndex];
    if (!currentItem) return;

    const isCorrect = strictMode 
        ? normalize(val) === normalize(currentItem.name)
        : currentItem.accepted.includes(normVal);

    if (isCorrect) {
      setQuizInput('');
      setShowQuizAns(false);
      const nextIndex = currentIndex + 1;
      
      setCurrentIndex(nextIndex);
      if (quizLayout === 'card') {
        setCardAnimating(true)
        setTimeout(() => {
          setCardAnimating(false);
        }, 300);
      }
      
      // Check win condition
      if (nextIndex >= activeScript.items.length) {
          setQuizFinished(true);
          setQuizActive(false);
          setShowQuizModal(true);
          if (!completedScripts.includes(activeScript.id) && !isPracticeMode) {
              setCompletedScripts(prev => [...prev, activeScript.id]);
          }
          if (!completedStrictScripts.includes(activeScript.id) && !isPracticeMode && strictMode) {
              setCompletedStrictScripts(prev => [...prev, activeScript.id]);
          }
      }
    }
  };

  const revealCurrent = () => {
      if(!activeScript) return;
      setShowQuizAns(true);
  };

  const giveUp = () => {
    setQuizActive(false);
    setQuizFinished(true);
    setShowQuizModal(true);
  };

  // --- Actions: Random Mode ---

  const nextRandomItem = (animate = true) => {
    const changeItem = () => {
        const randomScript = SCRIPTS[Math.floor(Math.random() * SCRIPTS.length)];
        const item = getRandomItem(randomScript.items)[0];
        setRandomItem({ 
            item, 
            scriptName: randomScript.title, 
            scriptColor: randomScript.color 
        });
        setRandomInput('');
        setRandomFeedback('none');
        setChaosAnimState('in');
        setTimeout(() => inputRef.current?.focus(), 50);
    }

    if (animate) {
      setCardAnimating(false)
      setTimeout(() => setCardAnimating(true), 300);
      setTimeout(changeItem, 350);
    } else {
        changeItem();
    }
  };

  const handleRandomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!randomItem || (randomFeedback !== 'none')) return;

    const normVal = normalize(randomInput);

    const isCorrect = strictMode 
        ? normVal === normalize(randomItem.item.name)
        : randomItem.item.accepted.includes(normVal);

    if (isCorrect) {
      setRandomScore(s => s + 1);
      setRandomStreak(s => s + 1);
      setRandomFeedback('correct');
      setTimeout(() => nextRandomItem(true), 800);
    } else {
      setChaosAnimState('shake');
      setRandomStreak(0);
      if (isPracticeMode) {
        setRandomFeedback('wrong')
        setTimeout(() => nextRandomItem(true), 800);
      } else {
        setRandomFeedback('gameover');
      }
    }
  };
  
  const handleRandomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRandomInput(val);
    if (!randomItem || (randomFeedback !== 'none')) return;
    
    const normVal = normalize(val);
    const isCorrect = strictMode 
        ? normVal === normalize(randomItem.item.name)
        : randomItem.item.accepted.includes(normVal);

    if (isCorrect) {
      setRandomScore(s => s + 1);
      setRandomStreak(s => s + 1);
      setRandomFeedback('correct');
      setTimeout(() => nextRandomItem(true), 600); 
    }
  };

  
  const skipRandom = () => {
    setRandomStreak(0);
    setChaosAnimState('shake');
    setRandomFeedback('gameover'); 
  };

  const resetRandom = () => {
    setRandomScore(0);
    setRandomStreak(0);
    setRandomFeedback('none');
    nextRandomItem(false);
    setRandomInput('');
    setChaosAnimState('out');
    setTimeout(() => {
        setChaosAnimState('in');
    }, 400);
  }

  // --- Render Helpers ---

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- Views ---

  const renderMenu = () => {
    let filteredScripts = SCRIPTS.filter(script => 
      script.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      script.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (showCompleted) {
      filteredScripts = filteredScripts.filter(script => 
        completedScripts.includes(script.id)
      );
    }
    if (showPerfected) {
      filteredScripts = filteredScripts.filter(script => 
        completedStrictScripts.includes(script.id)
      );
    }
    
    return (
      <div className="max-w-4xl mx-auto p-8 font-serif">
      <div className="text-center mb-16 border-b-2 border-stone-800 pb-8 relative">
        <GraduationCap className="mx-auto text-stone-800 mb-4" size={48} />
        <h1 className="text-6xl font-black text-stone-900 tracking-tight mb-2">
          Scriptle
        </h1>
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#f4f1ea] px-4 text-stone-500 text-sm font-bold uppercase tracking-widest">
          Select a quiz:
        </div>
      </div>

      <div className="max-w-xl mx-auto mb-12 flex flex-col items-center gap-4">
        <div className="relative w-full">
          <input 
            type="text" 
            placeholder="Search for a script..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#fdfbf7] border-2 border-stone-300 rounded-full py-3 pl-12 pr-4 text-stone-800 font-bold outline-none focus:border-stone-800 transition-colors placeholder:text-stone-400 placeholder:font-normal placeholder:italic"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
        </div>

        <div className="flex flex-wrap justify-center gap-4">
            <button 
                onClick={() => setStrictMode(!strictMode)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm uppercase tracking-widest transition-all ${strictMode ? 'bg-red-600 text-white shadow-lg ring-2 ring-red-200' : 'bg-stone-200 text-stone-500 hover:bg-stone-300'}`}
            >
                {strictMode ? <CheckCircle size={18} /> : <XCircle size={18} />}
                Strict Mode: {strictMode ? 'ON' : 'OFF'}
            </button>

            <button 
                onClick={() => setIsPracticeMode(!isPracticeMode)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm uppercase tracking-widest transition-all ${isPracticeMode ? 'bg-blue-600 text-white shadow-lg' : 'bg-stone-200 text-stone-500 hover:bg-stone-300'}`}
            >
                {isPracticeMode ? <Eye size={18} /> : <Eye size={18} className="opacity-50" />}
                Practice: {isPracticeMode ? 'ON' : 'OFF'}
            </button>

            {completedScripts.length > 0 && (<button 
                onClick={() => setShowCompleted(!showCompleted)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm uppercase tracking-widest transition-all ${showCompleted ? 'bg-black text-white shadow-lg ' : 'bg-stone-200 text-stone-500 hover:bg-stone-300'}`}
            >
            Mastered
            </button>)}
            {completedStrictScripts.length > 0 && (<button 
                onClick={() => setShowPerfected(!showPerfected)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm uppercase tracking-widest transition-all ${showPerfected ? 'bg-gradient-to-bl from-amber-950 to-black text-amber-400 shimmer-text shadow-lg border-amber-500/50' : 'bg-stone-200 text-stone-500 hover:bg-stone-300'}`}
            >
            <span className={showPerfected ? "animate-pulse" : ""}>Perfected</span>
            </button>)}
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Chaos Mode Card */}
        {searchQuery === '' && !showCompleted && !showPerfected && (
        <button 
          onClick={startRandomMode}
          className="cursor-pointer group relative rounded-sm border-2 border-stone-800 bg-stone-800 p-8 text-left shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] opacity-50"></div>
          <div className="relative z-10">
            <Shuffle className="mb-4 h-12 w-12 text-stone-100" />
            <h3 className="text-3xl font-bold text-stone-50 mb-2 font-serif">Chaos Mode</h3>
            <p className="text-stone-400 font-medium italic border-l-2 border-stone-600 pl-4 mb-6">
              "A random assortment of characters from various scripts. For the advanced scholar."
            </p>
            <div className="inline-flex items-center gap-2 text-stone-50 font-bold border border-stone-500 px-4 py-2 rounded-sm uppercase tracking-widest text-xs hover:bg-stone-700 transition-colors">
              Begin Assessment <Play size={14} fill="currentColor" />
            </div>
          </div>
        </button>)}

        {/* Script Cards */}
        {filteredScripts.map(script => {
          const isGold = completedStrictScripts.includes(script.id);
          return (
          <button
          key={script.id}
          onClick={() => startQuiz(script)}
          className={`group relative overflow-hidden text-left rounded-sm p-6 transition-all duration-300 card-hover
            ${isGold 
              ? 'bg-stone-950 border-2 border-amber-500/50 shadow-md hover:shadow-lg' 
              : 'bg-[#fdfbf7] border border-stone-300 shadow-sm hover:shadow-md'}
          `}
        >
              {/* Your original "Mastered" badge */}
              {completedScripts.includes(script.id) && !isGold && (
                <div className="absolute top-0 right-0 bg-stone-800 text-stone-50 text-[10px] font-bold px-2 py-1 uppercase tracking-widest z-20 border border-stone-700">
                  Mastered
                </div>
              )}
              {isGold && (
                <div className="absolute top-0 right-0 text-amber-400 shimmer-text text-[10px] font-bold px-2 py-1 uppercase tracking-widest z-20 ">
                  <span className='animate-pulse'>Perfected</span>
                </div>
              )}
          {/* --- 1. Special Gold Effect Background --- */}
          {isGold && (
            <>
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" 
                  style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #f59e0b 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
              </div>
              <div className="absolute -right-8 -bottom-8 text-amber-500/10 transform rotate-12">
                <Crown size={120} />
              </div>
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-amber-500/15 to-transparent"></div>
            </>
          )}

          {/* --- 2. Binder Holes (Only show if NOT gold) --- */}
          {!isGold && (
            <div className="absolute left-0 top-0 bottom-0 w-8 border-r border-stone-200 bg-stone-100 flex flex-col justify-evenly items-center">
              <div className="w-3 h-3 rounded-full bg-stone-300 shadow-inner"></div>
              <div className="w-3 h-3 rounded-full bg-stone-300 shadow-inner"></div>
              <div className="w-3 h-3 rounded-full bg-stone-300 shadow-inner"></div>
            </div>
          )}

          {/* --- 3. Content Container --- */}
          {/* Adjust padding: pl-2 for Gold (no binder holes), pl-8 for Normal */}
          <div className={`relative z-10 ${isGold ? 'pl-2' : 'pl-8'}`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className={`text-2xl font-bold group-hover:underline underline-offset-4 decoration-2 
                ${isGold 
                  ? 'text-amber-400 shimmer-text' 
                  : `text-stone-900 ${script.color.replace("bg","decoration")}`
                }`}>
                {script.title}
              </h3>
            </div>

            {/* Decorative Line */}
            <div className={`h-1 w-12 mb-3 ${isGold ? 'bg-amber-500' : script.color}`}></div>

            {/* Description */}
            <p className={`text-sm mb-6 font-serif italic ${isGold ? 'text-stone-400' : 'text-stone-600'}`}>
              {script.description}
            </p>

            {/* Footer / Meta Info */}
            <div className="flex items-center justify-between mt-auto">
              <span className={`text-xs font-bold uppercase tracking-widest ${isGold ? 'text-amber-500/60' : 'text-stone-400'}`}>
                {script.items.length} Questions
              </span>
              <span className={`transition-opacity flex items-center gap-1 font-bold text-xs uppercase tracking-wider opacity-0 group-hover:opacity-100 
                ${isGold ? 'text-amber-100' : 'text-stone-800'}`}>
                {isPracticeMode ? 'Practice' : 'Start'} <ArrowLeft className="rotate-180" size={16} />
              </span>
            </div>

          </div>
        </button>



        )})}
      </div>
    </div>
  );
  };

  const renderQuiz = () => {
    if (!activeScript) return null;
    
    // SAFEGUARD: 
    // We calculate currentItem safely. If currentIndex goes out of bounds (which happens when finished),
    // we fallback to the last item just for display stability, but we hide the input anyway.
    const total = activeScript.items.length;
    const isPerfect = currentIndex === total;
    const safeIndex = Math.min(currentIndex, total - 1);
    const currentItem = activeScript.items[safeIndex];

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 min-h-screen flex flex-col font-serif">
        <div className="bg-[#fdfbf7] shadow-lg border border-stone-200 p-4 md:p-8 mb-4 md:mb-8 relative transform md:rotate-1 sticky top-0 z-50 transition-all">
           <div className="absolute inset-0 bg-[linear-gradient(#e5e7eb_1px,transparent_1px)] bg-[size:100%_2rem] opacity-20 pointer-events-none"></div>
           <div className="relative z-10">
                <div className="flex justify-between items-center border-b-2 border-stone-800 pb-2 mb-4">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setView('menu')}
                            className="text-stone-500 hover:text-stone-800 transition-colors flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider"
                        >
                            <ArrowLeft size={16} /> <span className="hidden md:inline">Index</span>
                        </button>
                        
                        {/* Layout Toggle */}
                         <div className="flex bg-stone-200 rounded-lg p-1 gap-1">
                            <button 
                                onClick={() => setQuizLayout('grid')}
                                className={`p-1 rounded ${quizLayout === 'grid' ? 'bg-white shadow text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
                                title="Grid View"
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button 
                                onClick={() => setQuizLayout('card')}
                                className={`p-1 rounded ${quizLayout === 'card' ? 'bg-white shadow text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
                                title="Card View"
                            >
                                <RectangleHorizontal size={16} />
                            </button>
                         </div>
                    </div>
                    
                    <div className="flex gap-2">
                        {isPracticeMode && (
                        <div className="flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                            <Eye size={12} /> Practice
                        </div>
                        )}
                        {strictMode && (
                        <div className="flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                            <AlertCircle size={12} /> Strict Mode
                        </div>
                        )}
                    </div>

                    <div className="text-right flex items-center gap-4">
                         <div className="flex md:hidden items-center gap-3 text-xs font-bold text-stone-500 uppercase tracking-widest">
                            {!isPracticeMode && <span className={`${quizTimer < 10 ? 'text-red-700 animate-pulse' : ''}`}>{formatTime(quizTimer)}</span>}
                            <span>|</span>
                            <span>{currentIndex} / {total}</span>
                         </div>

                        <div className="hidden md:block">
                            <div className="text-stone-500 text-sm uppercase tracking-widest font-bold mb-1">Score</div>
                            <div className="text-4xl font-bold text-stone-900 leading-none">{currentIndex} <span className="text-stone-400 text-2xl">/ {total}</span></div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-row gap-4 md:gap-8 items-center md:items-start">
                    {!isPracticeMode && (
                        <div className="hidden md:block border-2 border-stone-800 px-4 py-2 bg-stone-100 min-w-[120px] text-center shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]">
                            <div className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">Time</div>
                            <div className={`text-2xl font-bold font-mono ${quizTimer < 10 ? 'text-red-700 animate-pulse' : 'text-stone-800'}`}>
                                {formatTime(quizTimer)}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 w-full relative flex flex-row items-center gap-4">
                        
                        {/* Grid Mode Big Char*/}
                        {quizLayout === 'grid' && !quizFinished && (
                            <div className="text-5xl md:text-6xl font-serif text-stone-900 font-bold min-w-[3rem] text-center leading-none">
                                {currentItem.char}
                            </div>
                        )}

                        <div className="flex-1 relative">
                            {quizFinished && !showQuizModal ? (
                                <div className="w-full bg-red-100 border border-red-200 py-3 px-4 text-red-800 font-bold text-center rounded text-sm md:text-base">
                                    Reviewing. Scroll down.
                                </div>
                            ) : (
                                // CRITICAL FIX: Only render Input area if NOT finished
                                !quizFinished && (
                                <>
                                    <label className="hidden md:block text-sm font-bold text-stone-500 uppercase tracking-widest mb-2">
                                        Identify Character #{currentIndex + 1}
                                    </label>
                                    <div className="relative">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={quizInput}
                                            onChange={handleQuizInput}
                                            disabled={quizFinished}
                                            placeholder={strictMode ? "Exact name..." : "Type answer..."}
                                            className="w-full bg-transparent border-b-2 border-stone-400 py-2 text-2xl md:text-3xl font-bold text-stone-800 outline-none focus:border-stone-900 placeholder:text-stone-300 placeholder:italic placeholder:text-xl font-serif"
                                        />
                                        <Feather className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                                    </div>
                                </>
                                )
                            )}
                        </div>
                    </div>

                    {!quizFinished && (
                        <div className="flex flex-col gap-2 mt-2 md:mt-6">
                            {isPracticeMode && (
                                <button onClick={revealCurrent} className="text-xs font-bold text-stone-500 hover:text-stone-800 uppercase tracking-wider whitespace-nowrap flex items-center gap-1 justify-end">
                                    Reveal <Eye size={12}/>
                                </button>
                            )}
                            <button onClick={giveUp} className="text-xs font-bold text-stone-400 hover:text-red-700 uppercase tracking-wider whitespace-nowrap">
                                {isPracticeMode ? 'Exit' : 'Forfeit'}
                            </button>
                        </div>
                    )}
                    {quizFinished && !showQuizModal && (
                         <button onClick={() => setView('menu')} className="px-4 py-2 md:px-6 md:py-3 bg-stone-900 font-bold text-stone-50 hover:bg-stone-800 shadow-md text-sm md:text-base whitespace-nowrap">
                           Finish
                         </button>
                    )}
                </div>
           </div>
        </div>

        {/* --- Card View Implementation --- */}
        {quizLayout === 'card' && !quizFinished && (
            <div className="flex-1 flex items-center justify-center p-4">
                <div className={`w-full max-w-md bg-[#fdfbf7] border-2 border-stone-800 shadow-[8px_8px_0px_0px_rgba(28,25,23,0.8)] p-1 ${cardAnimating ? "transition-all duration-300 animate-paper-flip":""}`}>
                    <div className="border border-stone-300 p-12 flex flex-col items-center justify-center min-h-[300px] relative">
                        <div className="text-[10px] text-stone-300 font-bold absolute top-2 left-2 uppercase tracking-widest">Card #{currentIndex + 1}</div>
                        <span className="text-9xl font-serif text-stone-900 select-none mb-4">
                            {currentItem.char}
                        </span>
                        <div className="text-stone-400 text-xl font-bold italic animate-pulse">
                            {showQuizAns ? currentItem.name : "Type answer above..."}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- Grid View Implementation --- */}
        {(quizLayout === 'grid' || quizFinished) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pb-20">
            {activeScript.items.map((item, idx) => {
                const isRevealed = idx < currentIndex;
                const isCurrent = idx === currentIndex && !quizFinished;
                const isMissed = quizFinished && !isRevealed;

                return (
                <div 
                    key={idx} 
                    className={`
                    relative flex flex-col items-center justify-center p-6 border transition-all duration-300 
                    ${isCurrent 
                        ? 'animate-paper-flip z-10 bg-white border-2 border-stone-800' 
                        : 'bg-[#fdfbf7] border-stone-200'}
                    ${isRevealed ? 'bg-stone-100' : ''}
                    ${isMissed ? 'bg-red-50 border-red-300 opacity-90' : ''}
                    `}
                >
                    <div className="absolute top-2 left-2 text-[10px] font-bold text-stone-300">
                        {idx + 1}
                    </div>

                    <div className={`text-4xl font-serif mb-2 min-h-[3rem] flex items-center justify-center 
                        ${isCurrent ? 'text-stone-900' : 'text-stone-700'}
                        ${!isRevealed && !isCurrent && !isMissed ? 'blur-[2px] opacity-20' : ''}
                        ${isMissed ? 'text-red-900' : ''}
                    `}>
                    {item.char}
                    </div>
                    
                    <div className={`
                        text-sm font-bold uppercase tracking-wider border-t w-full text-center pt-2
                        ${isRevealed ? 'text-stone-900 border-stone-300' : 
                        isMissed ? 'text-red-800 border-red-300' : 
                        isCurrent ? 'text-stone-400 border-stone-200 italic' : 'text-transparent border-transparent select-none'}
                    `}>
                    {isRevealed || isMissed || showQuizAns ? item.name : (isCurrent ? '???' : '.')}
                    </div>
                </div>
                );
            })}
            </div>
        )}

        {/* Results Modal */}
        <Modal isOpen={showQuizModal && currentIndex < total} onClose={() => setShowQuizModal(false)}>
            <div className="text-center font-serif">
                <h3 className="text-3xl font-bold text-stone-900 mb-2">
                    {isPracticeMode ? 'Session Ended' : 'Time Expired'}
                </h3>
                <div className="w-16 h-1 bg-stone-900 mx-auto mb-6"></div>
                <p className="text-stone-600 mb-8 text-lg">Your final score was recorded as <span className="font-bold text-stone-900 underline decoration-2">{currentIndex}/{total}</span>.</p>
                <div className="flex gap-4 justify-center flex-wrap">
                    <button onClick={() => setShowQuizModal(false)} className="px-6 py-3 border-2 border-stone-300 font-bold text-stone-600 hover:bg-stone-100 flex items-center gap-2">
                         <Eye size={18} /> Review Answers
                    </button>
                    <button onClick={() => setView('menu')} className="px-6 py-3 border-2 border-stone-300 font-bold text-stone-600 hover:bg-stone-100">Home</button>
                    <button onClick={() => startQuiz(activeScript)} className="px-6 py-3 bg-stone-900 font-bold text-stone-50 hover:bg-stone-800 shadow-md">Retry</button>
                </div>
            </div>
        </Modal>

        <Modal isOpen={showQuizModal && isPerfect && !isPracticeMode && !strictMode} onClose={() => setView('menu')}>
             <div className="text-center font-serif">
                <div className="inline-flex p-4 border-2 border-stone-800 rounded-full mb-6">
                    <Trophy size={32} className="text-stone-800" />
                </div>
                <h3 className="text-3xl font-bold text-stone-900 mb-2">Distinction Achieved</h3>
                <p className="text-stone-600 mb-8 italic">Perfect marks recorded for this session.</p>
                <div className="flex gap-4 justify-center">
                    <button onClick={() => setView('menu')} className="px-6 py-3 border-2 border-stone-300 font-bold text-stone-600 hover:bg-stone-100">Home</button>
                    <button onClick={() => startQuiz(activeScript)} className="px-6 py-3 bg-stone-900 font-bold text-stone-50 hover:bg-stone-800 shadow-md">Restart</button>
                </div>
            </div>
        </Modal>
        
        {/* <Modal isOpen={showQuizModal && isPerfect && !isPracticeMode && strictMode} onClose={() => setView('menu')}>
             <div className="text-center font-serif">
                <div className="inline-flex p-4 border-2 border-stone-800 rounded-full mb-6">
                    <Crown size={32} className="text-amber-900/50" />
                </div>
                <h3 className="text-3xl font-bold text-stone-900 mb-2">Perfection Achieved</h3>
                <p className="text-stone-600 mb-8 italic">Welcome to the greats.</p>
                <div className="flex gap-4 justify-center">
                    <button onClick={() => setView('menu')} className="px-6 py-3 border-2 border-stone-300 font-bold text-stone-600 hover:bg-stone-100">Home</button>
                    <button onClick={() => startQuiz(activeScript)} className="px-6 py-3 bg-stone-900 font-bold text-stone-50 hover:bg-stone-800 shadow-md">Restart</button>
                </div>
            </div>
        </Modal> */}


      </div>
    );
  };

  const renderRandomMode = () => {
    if (!randomItem) return null;

    return (
      <div className="min-h-screen flex items-center justify-center p-4 font-serif relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
             <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#44403c 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        </div>

        <div className="w-full max-w-lg relative z-10">
          
          <div className="flex justify-between items-center mb-8 px-4">
            <button onClick={() => setView('menu')} className="text-stone-500 hover:text-stone-800 font-bold flex items-center gap-2 uppercase tracking-widest text-xs">
              <ArrowLeft size={14} /> Return
            </button>
            <div className="flex gap-6 items-center">
                  {strictMode && (
                  <div className="flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider mr-2">
                      <AlertCircle size={12} /> Strict
                  </div> )}
                  {isPracticeMode && (
                  <div className="flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider mr-2">
                      <AlertCircle size={12} /> Practice
                  </div> )}
               <div className="text-center">
                 <div className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Streak</div>
                 <div className="text-2xl font-black text-stone-800">{randomStreak}</div>
               </div>
               <div className="text-center">
                 <div className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Score</div>
                 <div className="text-2xl font-black text-stone-800">{randomScore}</div>
               </div>
            </div>
          </div>

          {/* Flashcard with Animations */}
          <div 
            className={`
                bg-[#fdfbf7] border-2 border-stone-800 p-1
                ${cardAnimating ? "transition-all duration-300 animate-paper-flip":""}
                ${chaosAnimState === 'shake' ? 'animate-shake' : ''}
            `}
           >
             <div className="border border-stone-300 p-8 flex flex-col items-center relative min-h-[400px]">
               
               {/* Script Tag */}
               <div className={`absolute top-0 right-0 px-4 py-2 bg-stone-100 border-b border-l border-stone-200 text-xs font-bold uppercase tracking-widest text-stone-500`}>
                   {randomItem.scriptName}
               </div>

               {/* Feedback Overlay */}
               {randomFeedback !== 'none' && (
               <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#fdfbf7]/95 backdrop-blur-sm transition-opacity duration-300`}>
                   <div className="animate-in zoom-in duration-300 text-center p-4">
                       {randomFeedback === 'correct' ? (
                       <>
                           <CheckCircle className="mx-auto text-stone-800 mb-4" size={56} />
                           <h2 className="text-3xl font-black text-stone-800 mb-1">Correct</h2>
                           <p className="text-stone-600 font-serif italic text-lg">{randomItem.item.name}</p>
                       </>
                       ) : randomFeedback === 'wrong' ? (
                       <>
                           <XCircle className="mx-auto text-red-700 mb-4" size={56} />
                           <h2 className="text-3xl font-black text-stone-800 mb-2">Incorrect</h2>
                           
                           <div className="bg-stone-100 p-4 rounded mb-6 border border-stone-200">
                               <p className="text-stone-500 text-xs uppercase tracking-widest mb-1">Correct Answer</p>
                               <p className="text-2xl font-bold text-red-700 font-serif mb-4">{randomItem.item.name}</p>
                               
                               <div className="w-full h-px bg-stone-300 mb-4"></div>

                               <p className="text-stone-500 text-xs uppercase tracking-widest mb-1">Current Score</p>
                               <p className="text-4xl font-black text-stone-900">{randomScore}</p>
                           </div>
                       </>
                       ) : (
                          <>
                           <XCircle className="mx-auto text-red-700 mb-4" size={56} />
                           <h2 className="text-3xl font-black text-stone-800 mb-2">Game Over</h2>
                           
                           <div className="bg-stone-100 p-4 rounded mb-6 border border-stone-200">
                               <p className="text-stone-500 text-xs uppercase tracking-widest mb-1">Correct Answer</p>
                               <p className="text-2xl font-bold text-red-700 font-serif mb-4">{randomItem.item.name}</p>
                               
                               <div className="w-full h-px bg-stone-300 mb-4"></div>

                               <p className="text-stone-500 text-xs uppercase tracking-widest mb-1">Final Score</p>
                               <p className="text-4xl font-black text-stone-900">{randomScore}</p>
                           </div>

                          <button 
                               onClick={resetRandom}
                               className="px-6 py-3 bg-stone-900 text-white font-bold rounded hover:bg-stone-800 transition-colors uppercase tracking-widest text-sm flex items-center gap-2 mx-auto"
                           >
                               <RefreshCw size={16} /> Try Again
                          </button>
                       </>
                       )}
                   </div>
               </div>
               )}

               <div className="flex-1 flex items-center justify-center w-full">
                   <span className="text-9xl font-serif text-stone-900 select-none">
                       {randomItem.item.char}
                   </span>
               </div>

               <div className="w-full mt-8">
                   <form onSubmit={handleRandomSubmit} className="relative">
                       <input
                       ref={inputRef}
                       type="text"
                       value={randomInput}
                       onChange={handleRandomInput}
                       disabled={randomFeedback !== 'none'}
                       className="w-full bg-transparent border-b-2 border-dashed border-stone-400 text-center text-3xl font-serif font-bold text-stone-800 py-2 outline-none focus:border-stone-900 focus:border-solid transition-all placeholder:text-stone-300 placeholder:italic placeholder:text-xl placeholder:font-normal"
                       placeholder={strictMode ? "Exact name..." : "write answer here"}
                       autoFocus
                       />
                   </form>
                   <button 
                       onClick={skipRandom}
                       className="w-full mt-6 text-stone-400 text-xs font-bold uppercase tracking-widest hover:text-stone-600 transition-colors"
                       disabled={randomFeedback !== 'none'}
                   >
                       I don't know
                   </button>
               </div>

             </div>
          </div>
          
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-stone-900 selection:bg-stone-300 selection:text-stone-900">
      {view === 'menu' && renderMenu()}
      {view === 'quiz' && renderQuiz()}
      {view === 'random' && renderRandomMode()}
    </div>
  );
}