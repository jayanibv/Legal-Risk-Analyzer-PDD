import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { usePathname } from 'expo-router';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
}

export interface ThemeColors {
  bg: string;
  card: string;
  cardAlt: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryGradientStart: string;
  primaryGradientEnd: string;
  secondary: string;
  border: string;
  divider: string;
  error: string;
  success: string;
  warning: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const lightColors: ThemeColors = {
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

export const darkColors: ThemeColors = {
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

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light'); // default to light initially

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = Platform.OS === 'web' 
          ? localStorage.getItem('user_theme') 
          : await SecureStore.getItemAsync('user_theme');
        
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setTheme(savedTheme);
        }
      } catch (e) {
        console.log('Failed to load theme');
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem('user_theme', newTheme);
      } else {
        await SecureStore.setItemAsync('user_theme', newTheme);
      }
    } catch (e) {
      console.log('Failed to save theme');
    }
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
