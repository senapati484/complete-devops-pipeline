"use client"

import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { Sun, Moon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const isDark = theme === "dark"
  const toggle = () => setTheme(isDark ? "light" : "dark")

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className={cn(
          "relative inline-flex h-9 w-9 items-center justify-center rounded-md opacity-50",
          className
        )}
        disabled
      >
        <div className="h-5 w-5 rounded-full border-2 border-muted border-t-transparent animate-spin" />
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="h-5 w-5" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="h-5 w-5" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
