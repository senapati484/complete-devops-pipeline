"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Activity, Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
]

interface NavbarProps {
  className?: string
}

export function Navbar({ className }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="fixed inset-x-0 top-4 z-50 px-4">
      <nav
        className={cn(
          "mx-auto max-w-6xl rounded-full border border-border/40 bg-background/70 backdrop-blur-xl shadow-lg transition-all duration-300",
          className
        )}
      >
        <div className="flex h-14 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-sm tracking-tight">
            <Activity className="h-5 w-5 text-primary animate-pulse-glow" />
            <span className="font-heading">DevOps Center</span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-semibold text-muted-foreground transition-all duration-200 hover:text-foreground hover:scale-105"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Login
            </Link>
            <Link
              href="/get-started"
              className="inline-flex h-8 items-center justify-center rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md hover:scale-[1.02] active:scale-95"
            >
              Get Started
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent hover:text-accent-foreground"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border/40 bg-background/90 rounded-b-3xl md:hidden"
            >
              <div className="space-y-1 px-6 py-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="my-2 border-border/40" />
                <div className="flex items-center justify-between pt-1">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Login
                  </Link>
                  <Link
                    href="/get-started"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex h-8 items-center justify-center rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground shadow transition-colors hover:bg-primary/90"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </div>
  )
}
