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
    const nextTheme: ShrineTheme = theme === 'midnight' ? 'sakura' : 'midnight';
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (typeof document !== 'undefined' && 'startViewTransition' in document && !prefersReducedMotion) {
      (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
        setTheme(nextTheme);
      });
    } else {
      setTheme(nextTheme);
    }
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
      const themeMeta = document.querySelector('meta[name="theme-color"]');
      if (themeMeta) {
        themeMeta.setAttribute('content', theme === 'sakura' ? '#faf5ee' : '#0c0a09');
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
