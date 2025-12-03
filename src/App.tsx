import React, { useState, useEffect, useRef } from 'react';
import { Trophy, ArrowLeft, RefreshCw, CheckCircle, XCircle, Play, Shuffle, BookOpen, GraduationCap, Feather, Eye, Search } from 'lucide-react';
import { SCRIPTS } from './scripts';
import './App.css'

// --- Data Definitions ---

type ScriptItem = {
  char: string;
  name: string; // Display name
  accepted: string[]; // Valid inputs (lowercase)
};

type ScriptData = {
  id: string;
  title: string;
  description: string;
  color: string; // Kept for accent borders
  items: ScriptItem[];
};

// --- Utility Functions ---

const normalize = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');

const getRandomItem = (items: ScriptItem[], count: number = 1) => {
  const shuffled = [...items].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// --- Components ---

const ProgressBar = ({ current, total }: { current: number; total: number }) => {
  const pct = Math.min(100, Math.max(0, (current / total) * 100));
  return (
    <div className="w-full h-2 bg-stone-200 rounded-sm overflow-hidden mt-2 border border-stone-300">
      <div
        className="h-full bg-stone-800 transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

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
  
  // Quiz Mode State
  const [quizInput, setQuizInput] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0); // Tracks sequential progress
  const [quizTimer, setQuizTimer] = useState(0);
  const [quizActive, setQuizActive] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false); // Controls if the results popup is showing

  // Random Mode State
  const [randomItem, setRandomItem] = useState<{ item: ScriptItem, scriptName: string, scriptColor: string } | null>(null);
  const [randomInput, setRandomInput] = useState('');
  const [randomScore, setRandomScore] = useState(0);
  const [randomStreak, setRandomStreak] = useState(0);
  const [randomFeedback, setRandomFeedback] = useState<'none' | 'correct' | 'wrong' | 'gameover'>('none');

  const inputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // --- Effects & Timers ---

  useEffect(() => {
    let interval: any;
    if (quizActive && !quizFinished && quizTimer > 0) {
      interval = setInterval(() => {
        setQuizTimer((t) => {
          if (t <= 1) {
            setQuizFinished(true);
            setQuizActive(false);
            setShowQuizModal(true); // Auto-show modal on time out
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizActive, quizFinished, quizTimer]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

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
    setCurrentIndex(0); // Start at first item
    setQuizInput('');
    setQuizTimer(script.items.length * 5 > 300 ? 300 : script.items.length * 6); // Slightly stricter time
    setQuizActive(true);
    setQuizFinished(false);
    setShowQuizModal(false);
    setView('quiz');
    window.scrollTo({
      top: 0,
      behavior: "smooth" // Optional: for smooth scrolling animation
    });
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const startRandomMode = () => {
    setView('random');
    setRandomScore(0);
    setRandomStreak(0);
    nextRandomItem();
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

    // Strict sequential check
    const currentItem = activeScript.items[currentIndex];

    if (currentItem.accepted.includes(normVal)) {
      setQuizInput('');
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      
      // Check win condition
      if (nextIndex >= activeScript.items.length) {
        setQuizFinished(true);
        setQuizActive(false);
        setShowQuizModal(true);
      }
    }
  };

  const giveUp = () => {
    setQuizActive(false);
    setQuizFinished(true);
    setShowQuizModal(true);
  };

  const closeQuizModalForReview = () => {
    setShowQuizModal(false);
  };

  // --- Actions: Random Mode ---

  const nextRandomItem = () => {
    const randomScript = SCRIPTS[Math.floor(Math.random() * SCRIPTS.length)];
    const item = getRandomItem(randomScript.items)[0];
    setRandomItem({ 
      item, 
      scriptName: randomScript.title, 
      scriptColor: randomScript.color 
    });
    setRandomInput('');
    setRandomFeedback('none');
  };

  const handleRandomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!randomItem || (randomFeedback !== 'none')) return;

    const normVal = normalize(randomInput);
    if (randomItem.item.accepted.includes(normVal)) {
      setRandomScore(s => s + 1);
      setRandomStreak(s => s + 1);
      setRandomFeedback('correct');
      setTimeout(nextRandomItem, 800);
    } else {
      setRandomStreak(0);
      setRandomFeedback('gameover');
    }
  };

  
  const handleRandomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRandomInput(val);
    if (!randomItem || (randomFeedback !== 'none')) return;
    const normVal = normalize(val);
    console.log("hi", normVal);
    if (randomItem.item.accepted.includes(normVal)) {
      console.log("hi2");
      setRandomScore(s => s + 1);
      setRandomStreak(s => s + 1);
      setRandomFeedback('correct');
      setTimeout(nextRandomItem, 800); 
    }
  };

  const skipRandom = () => {
    setRandomStreak(0);
    setRandomFeedback('gameover'); 
  };

  const resetRandom = () => {
    setRandomScore(0);
    setRandomStreak(0);
    setRandomFeedback('none');
    setRandomInput('');
    nextRandomItem();
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  // --- Render Helpers ---

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- Views ---

  const renderMenu = () => {
    const filteredScripts = SCRIPTS.filter(script => 
      script.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      script.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
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

       <div className="max-w-md mx-auto mb-12 relative">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search for a script..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#fdfbf7] border-2 border-stone-300 rounded-full py-3 pl-12 pr-4 text-stone-800 font-bold outline-none focus:border-stone-800 transition-colors placeholder:text-stone-400 placeholder:font-normal placeholder:italic"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Chaos Mode Card */}
        {searchQuery === '' &&(<button 
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
        {filteredScripts.map(script => (
          <button
            key={script.id}
            onClick={() => startQuiz(script)}
            className={`group bg-[#fdfbf7] border border-stone-300 rounded-sm p-6 text-left shadow-sm transition-all relative overflow-hidden card-hover`}
          >
            {/* Binder holes visual */}
            <div className="absolute left-0 top-0 bottom-0 w-8 border-r border-stone-200 bg-stone-100 flex flex-col justify-evenly items-center">
               <div className="w-3 h-3 rounded-full bg-stone-300 shadow-inner"></div>
               <div className="w-3 h-3 rounded-full bg-stone-300 shadow-inner"></div>
               <div className="w-3 h-3 rounded-full bg-stone-300 shadow-inner"></div>
            </div>

            <div className="pl-8">
                <div className="flex justify-between items-start mb-2">
                <h3 className={`text-2xl font-bold text-stone-900 group-hover:underline ${script.color.replace("bg","decoration")} underline-offset-4 decoration-2`}>{script.title}</h3>
                </div>
                <div className={`h-1 w-12 ${script.color} mb-3`}></div>
                <p className="text-stone-600 text-sm mb-6 font-serif italic">{script.description}</p>
                <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                        {script.items.length} Questions
                    </span>
                    <span className="text-stone-800 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowLeft className="rotate-180" size={20} />
                    </span>
                </div>
            </div>
          </button>
        ))}

        {filteredScripts.length === 0 && searchQuery !== '' && (
            <div className="col-span-1 md:col-span-2 text-center py-12 text-stone-500 italic">
                No scripts found matching "{searchQuery}"
            </div>
        )}
      </div>
    </div>
  );
  };

  const renderQuiz = () => {
    if (!activeScript) return null;
    const total = activeScript.items.length;
    const isPerfect = currentIndex === total;

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 min-h-screen flex flex-col font-serif">
        <div className="bg-[#fdfbf7] shadow-lg border border-stone-200 p-4 md:p-8 mb-4 md:mb-8 relative transform md:rotate-1 sticky top-0 z-50">
           <div className="absolute inset-0 bg-[linear-gradient(#e5e7eb_1px,transparent_1px)] bg-[size:100%_2rem] opacity-20 pointer-events-none"></div>
           <div className="relative z-10">
                <div className="flex justify-between items-center border-b-2 border-stone-800 pb-2 mb-4">
                    <div>
                        <button 
                            onClick={() => setView('menu')}
                            className="text-stone-500 hover:text-stone-800 transition-colors flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider"
                        >
                            <ArrowLeft size={16} /> <span className="hidden md:inline">Return to Index</span><span className="md:hidden">Back</span>
                        </button>
                    </div>
                    
                    <h2 className="hidden md:block text-2xl font-black text-stone-900">{activeScript.title}</h2>

                    <div className="text-right flex items-center gap-4">
                         <div className="flex md:hidden items-center gap-3 text-xs font-bold text-stone-500 uppercase tracking-widest">
                            <span className={`${quizTimer < 10 ? 'text-red-700 animate-pulse' : ''}`}>{formatTime(quizTimer)}</span>
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
                    <div className="hidden md:block border-2 border-stone-800 px-4 py-2 bg-stone-100 min-w-[120px] text-center shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]">
                        <div className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">Time Remaining</div>
                        <div className={`text-2xl font-bold font-mono ${quizTimer < 10 ? 'text-red-700 animate-pulse' : 'text-stone-800'}`}>
                            {formatTime(quizTimer)}
                        </div>
                    </div>

                    <div className="flex-1 w-full relative flex flex-row items-center gap-4">
                        
                        {!quizFinished && (
                            <div className="text-5xl md:text-6xl md:hidden md:visible font-serif text-stone-900 font-bold min-w-[3rem] text-center leading-none">
                                {activeScript.items[currentIndex].char}
                            </div>
                        )}

                        <div className="flex-1 relative">
                            {quizFinished && !showQuizModal ? (
                                <div className="w-full bg-red-100 border border-red-200 py-3 px-4 text-red-800 font-bold text-center rounded text-sm md:text-base">
                                    Reviewing. Scroll down.
                                </div>
                            ) : (
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
                                            placeholder={quizFinished ? "---" : "Type..."}
                                            className="w-full bg-transparent border-b-2 border-stone-400 py-2 text-2xl md:text-3xl font-bold text-stone-800 outline-none focus:border-stone-900 placeholder:text-stone-300 placeholder:italic placeholder:text-xl font-serif"
                                        />
                                        {!quizFinished && <Feather className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-400" size={20} />}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {!quizFinished && (
                        <button onClick={giveUp} className="text-xs font-bold text-stone-400 hover:text-red-700 uppercase tracking-wider mt-2 md:mt-8 whitespace-nowrap">
                            Forfeit
                        </button>
                    )}
                    {quizFinished && !showQuizModal && (
                         <button onClick={() => setView('menu')} className="px-4 py-2 md:px-6 md:py-3 bg-stone-900 font-bold text-stone-50 hover:bg-stone-800 shadow-md text-sm md:text-base whitespace-nowrap">
                            Finish
                         </button>
                    )}
                </div>
           </div>
        </div>

<Modal isOpen={showQuizModal && currentIndex < total} onClose={closeQuizModalForReview}>
            <div className="text-center font-serif">
                <h3 className="text-3xl font-bold text-stone-900 mb-2">Time Expired</h3>
                <div className="w-16 h-1 bg-stone-900 mx-auto mb-6"></div>
                <p className="text-stone-600 mb-8 text-lg">Your final score was recorded as <span className="font-bold text-stone-900 underline decoration-2">{currentIndex}/{total}</span>.</p>
                <div className="flex gap-4 justify-center flex-wrap">
                    <button onClick={closeQuizModalForReview} className="px-6 py-3 border-2 border-stone-300 font-bold text-stone-600 hover:bg-stone-100 flex items-center gap-2">
                         <Eye size={18} /> Review Answers
                    </button>
                    <button onClick={() => setView('menu')} className="px-6 py-3 border-2 border-stone-300 font-bold text-stone-600 hover:bg-stone-100">Home</button>
                    <button onClick={() => startQuiz(activeScript)} className="px-6 py-3 bg-stone-900 font-bold text-stone-50 hover:bg-stone-800 shadow-md">Retake Exam</button>
                </div>
            </div>
        </Modal>

        <Modal isOpen={showQuizModal && isPerfect} onClose={() => setView('menu')}>
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
                  {isRevealed || isMissed ? item.name : (isCurrent ? '???' : '.')}
                </div>
              </div>
            );
          })}
        </div>
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
            <div className="flex gap-6">
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

          {/* Flashcard */}
          <div className="bg-[#fdfbf7] border-2 border-stone-800 shadow-[8px_8px_0px_0px_rgba(28,25,23,0.8)] p-1">
             <div className="border border-stone-300 p-8 flex flex-col items-center relative min-h-[400px]">
                
                {/* Script Tag */}
                <div className={`absolute top-0 right-0 px-4 py-2 bg-stone-100 border-b border-l border-stone-200 text-xs font-bold uppercase tracking-widest text-stone-500`}>
                    {randomItem.scriptName}
                </div>

                {/* Feedback Overlay - Game Over or Success */}
                {randomFeedback !== 'none' && (
                <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#fdfbf7]/95 backdrop-blur-sm transition-opacity duration-300`}>
                    <div className="animate-in zoom-in duration-300 text-center p-4">
                        {randomFeedback === 'correct' ? (
                        <>
                            <CheckCircle className="mx-auto text-stone-800 mb-4" size={56} />
                            <h2 className="text-3xl font-black text-stone-800 mb-1">Correct</h2>
                            <p className="text-stone-600 font-serif italic text-lg">{randomItem.item.name}</p>
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
                        placeholder="write answer here"
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