"use client";
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('blue');

  useEffect(() => {
    // 1. Check LocalStorage
    const savedTheme = localStorage.getItem('site_theme') || 'blue';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('site_theme', newTheme);
    applyTheme(newTheme);
  };

  const applyTheme = (themeName) => {
    // This adds the data-theme attribute to the HTML body
    document.documentElement.setAttribute('data-theme', themeName);
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
