import { createContext, useContext, useState, useEffect } from 'react';

const LikesContext = createContext();

export function LikesProvider({ children }) {
  // Başlangıçta localStorage'dan oku
  const [likedNames, setLikedNames] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('likedNames');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Değişiklik olunca kaydet
  useEffect(() => {
    localStorage.setItem('likedNames', JSON.stringify(likedNames));
  }, [likedNames]);

  // Beğeni ekle/çıkar
  const toggleLike = (name) => {
    setLikedNames(prev => {
      if (prev.includes(name)) {
        return prev.filter(n => n !== name);
      } else {
        return [...prev, name];
      }
    });
  };

  // Kontrol et
  const isLiked = (name) => likedNames.includes(name);

  // Sıralamayı değiştir (Yukarı/Aşağı taşı)
  const moveLike = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= likedNames.length) return;
    
    const newLikes = [...likedNames];
    const [removed] = newLikes.splice(fromIndex, 1);
    newLikes.splice(toIndex, 0, removed);
    
    setLikedNames(newLikes);
  };

  return (
    <LikesContext.Provider value={{ likedNames, toggleLike, isLiked, moveLike }}>
      {children}
    </LikesContext.Provider>
  );
}

export const useLikes = () => useContext(LikesContext);