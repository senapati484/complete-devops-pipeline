"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: ThemeProviderProps) {
  // Read the persisted theme synchronously on the first render so the
  // initial state already matches localStorage — no effect, no setState.
  // (React 19's react-hooks/set-state-in-effect rule disallows reading
  // external systems inside useEffect and calling setState in the same
  // tick; lazy state initializers are the supported alternative.)
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme
    try {
      const stored = window.localStorage.getItem("theme") as Theme | null
      return stored ?? defaultTheme
    } catch {
      return defaultTheme
    }
  })

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    try {
      localStorage.setItem("theme", newTheme)
    } catch {}
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const applyTheme = () => {
      const isDark =
        theme === "dark" || (theme === "system" && mediaQuery.matches)

      root.classList.toggle("dark", isDark)
    }

    applyTheme()

    if (theme === "system") {
      mediaQuery.addEventListener("change", applyTheme)
      return () => mediaQuery.removeEventListener("change", applyTheme)
    }
  }, [theme])

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
