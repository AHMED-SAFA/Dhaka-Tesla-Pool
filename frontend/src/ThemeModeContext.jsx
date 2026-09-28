import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeModeContext = createContext({
  mode: 'dark',
  toggleTheme: () => {},
  setMode: () => {},
});

export function ThemeModeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    const saved = localStorage.getItem('dhaka_tesla_color_scheme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  const applyMode = (newMode) => {
    setModeState(newMode);
    localStorage.setItem('dhaka_tesla_color_scheme', newMode);
    document.documentElement.setAttribute('data-toolpad-color-scheme', newMode);
    if (newMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    applyMode(mode);

    // Observe changes if Toolpad Core changes data-toolpad-color-scheme
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-toolpad-color-scheme') {
          const scheme = document.documentElement.getAttribute('data-toolpad-color-scheme');
          if (scheme && (scheme === 'dark' || scheme === 'light') && scheme !== mode) {
            setModeState(scheme);
            localStorage.setItem('dhaka_tesla_color_scheme', scheme);
            if (scheme === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-toolpad-color-scheme'] });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    applyMode(mode === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeModeContext.Provider value={{ mode, toggleTheme, setMode: applyMode }}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeModeContext);
}
