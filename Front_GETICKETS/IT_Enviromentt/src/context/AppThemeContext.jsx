import React, { createContext, useContext, useMemo, useState } from 'react';

const AppThemeContext = createContext(null);

export function AppThemeProvider({ children }) {
  const [mode, setMode] = useState('dark');
  const value = useMemo(() => ({ mode, isDark: mode === 'dark', setMode }), [mode]);
  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const value = useContext(AppThemeContext);
  if (!value) throw new Error('useAppTheme debe usarse dentro de AppThemeProvider.');
  return value;
}
