import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
        const context = useContext(ThemeContext)
        if (!context) {
                throw new Error('useTheme must be used within a ThemeProvider')
        }
        return context
}

export const ThemeProvider = ({ children }) => {
        const [theme, setTheme] = useState(() => {
                if (typeof window !== 'undefined') {
                        const saved = localStorage.getItem('ocrs-theme')
                        return saved || 'light'
                }
                return 'light'
        })

        useEffect(() => {
                const root = window.document.documentElement
                root.classList.remove('light', 'dark')
                root.classList.add(theme)
                localStorage.setItem('ocrs-theme', theme)
        }, [theme])

        const toggleTheme = () => {
                setTheme(prev => prev === 'dark' ? 'light' : 'dark')
        }

        const isDark = theme === 'dark'

        return (
                <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
                        {children}
                </ThemeContext.Provider>
        )
}

export default ThemeContext
