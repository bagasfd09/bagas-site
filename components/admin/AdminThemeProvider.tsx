'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
})

export function useAdminTheme() {
  return useContext(ThemeContext)
}

export default function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const saved = localStorage.getItem('adminTheme') as Theme | null
    if (saved === 'light' || saved === 'dark') setTheme(saved)
  }, [])

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('adminTheme', next)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className="admin-layout" data-theme={theme === 'dark' ? 'dark' : undefined}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}
