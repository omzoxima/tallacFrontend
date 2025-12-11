'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type EffectiveTheme = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  effectiveTheme: EffectiveTheme;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getSystemTheme = (): EffectiveTheme => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (theme: EffectiveTheme) => {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem('themeMode');
    if (saved === 'light' || saved === 'dark') return saved;
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') return 'light';
    return 'dark'; // Default to dark like Vue
  });

  const updateTheme = (mode: ThemeMode) => {
    let theme: EffectiveTheme;
    if (mode === 'system') {
      theme = getSystemTheme();
    } else {
      theme = mode;
    }
    applyTheme(theme);
    setEffectiveTheme(theme);
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('themeMode', mode);
    }
    updateTheme(mode);
  };

  const toggleTheme = () => {
    const newMode = effectiveTheme === 'dark' ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  useEffect(() => {
    // Initialize theme - check both themeMode and theme (for Vue compatibility)
    if (typeof window !== 'undefined') {
      const savedMode = (localStorage.getItem('themeMode') as ThemeMode) || 'system';
      const savedTheme = localStorage.getItem('theme'); // Vue uses 'theme'
      
      let initialMode: ThemeMode = savedMode;
      if (savedMode === 'system' && savedTheme) {
        // If themeMode is system but theme is set, use theme
        initialMode = savedTheme === 'light' ? 'light' : savedTheme === 'dark' ? 'dark' : 'system';
      }
      
      setThemeModeState(initialMode);
      updateTheme(initialMode);
    }

    // Listen for system theme changes
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (themeMode === 'system') {
          updateTheme('system');
        }
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
  }, [themeMode]);

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        effectiveTheme,
        isDark: effectiveTheme === 'dark',
        setThemeMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

