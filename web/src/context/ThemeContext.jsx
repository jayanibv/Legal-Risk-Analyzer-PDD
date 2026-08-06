import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const lightColors = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  cardAlt: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#475569',
  primary: '#1E3A8A',
  primaryGradientStart: '#1E3A8A',
  primaryGradientEnd: '#1D4ED8',
  secondary: '#475569',
  border: '#CBD5E1',
  divider: '#E2E8F0',
  error: '#DC2626',
  success: '#16A34A',
  warning: '#D97706',
};

export const darkColors = {
  bg: '#0F172A',
  card: '#1E293B',
  cardAlt: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  primary: '#3B82F6',
  primaryGradientStart: '#3B82F6',
  primaryGradientEnd: '#2563EB',
  secondary: '#94A3B8',
  border: '#334155',
  divider: '#1E293B',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light'); // default to light

  useEffect(() => {
    const savedTheme = localStorage.getItem('user_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }
  }, []);

  // Update CSS Variables on the document root whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    const colors = theme === 'dark' ? darkColors : lightColors;
    
    Object.entries(colors).forEach(([key, value]) => {
      // e.g. --color-bg: #F8FAFC
      root.style.setProperty(`--color-${key}`, value);
    });
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('user_theme', newTheme);
  };

  const colors = theme === 'dark' ? darkColors : lightColors;
  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
