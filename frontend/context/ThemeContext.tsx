import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

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
  bg: '#F4F6F9',
  card: '#FFFFFF',
  cardAlt: '#F8FAFC',
  text: '#1B1F3B',
  textSecondary: '#64748B',
  primary: '#00E5FF',
  primaryGradientStart: '#00E5FF',
  primaryGradientEnd: '#00B8CC',
  secondary: '#FF4D6D',
  border: 'rgba(27,31,59,0.1)',
  divider: '#E2E8F0',
  error: '#FF4D6D',
  success: '#00F5A0',
  warning: '#FFB020',
};

export const darkColors: ThemeColors = {
  bg: '#1B1F3B',
  card: '#252A4A',
  cardAlt: '#2A3052',
  text: '#FFFFFF',
  textSecondary: '#8B92B8',
  primary: '#00E5FF',
  primaryGradientStart: '#00E5FF',
  primaryGradientEnd: '#00B8CC',
  secondary: '#FF4D6D',
  border: 'rgba(0,229,255,0.3)',
  divider: '#2A3052',
  error: '#FF4D6D',
  success: '#00F5A0',
  warning: '#FFB020',
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
