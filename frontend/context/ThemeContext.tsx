import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  colors: any;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const lightColors = {
  bg: '#F8FAFC',
  text: '#1E293B',
  textSecondary: '#64748B',
  card: '#FFFFFF',
  divider: '#F1F5F9',
  primary: '#1A365D',
  accent: '#3182CE',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  border: '#E2E8F0',
};

export const darkColors = {
  bg: '#0F172A',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  card: '#1E293B',
  divider: '#334155',
  primary: '#3B82F6',
  accent: '#60A5FA',
  error: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  border: '#334155',
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemTheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>(systemTheme || 'light');

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
