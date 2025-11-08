import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // الوضع المظلم ثابت دائماً
  const [theme] = useState<Theme>('dark');

  const setTheme = (_: Theme) => {
    // لا يفعل شيء - الوضع المظلم ثابت

  };

  const toggleTheme = () => {
    // لا يفعل شيء - الوضع المظلم ثابت

  };

  useEffect(() => {
    // تطبيق الوضع المظلم دائماً
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
