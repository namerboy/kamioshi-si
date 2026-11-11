import React, { createContext, useContext, useState, useEffect } from 'react';

export type ShrineTheme = 'midnight' | 'sakura';

interface ThemeContextType {
  theme: ShrineTheme;
  setTheme: (theme: ShrineTheme) => void;
  toggleTheme: () => void;
  isSakura: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'kamioshi_theme_v1';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ShrineTheme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'midnight' || saved === 'sakura') {
        return saved;
      }
    } catch {
      // safe fallback
    }
    return 'midnight';
  });

  const setTheme = (newTheme: ShrineTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // safe fallback
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'midnight' ? 'sakura' : 'midnight');
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.setAttribute('data-theme', theme);
      if (theme === 'sakura') {
        root.classList.add('theme-sakura');
      } else {
        root.classList.remove('theme-sakura');
      }
    }
  }, [theme]);

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isSakura: theme === 'sakura'
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
