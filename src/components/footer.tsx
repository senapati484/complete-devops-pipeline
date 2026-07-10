"use client"

import { cn } from "@/lib/utils"
import { GitBranch, MessageCircle, Briefcase } from "lucide-react"
import Link from "next/link"

interface FooterProps {
  className?: string
}

const productLinks = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Integrations", href: "/integrations" },
  { label: "Changelog", href: "/changelog" },
]

const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
]

const resourceLinks = [
  { label: "Documentation", href: "/docs" },
  { label: "API Reference", href: "/api" },
  { label: "Status", href: "/status" },
  { label: "Support", href: "/support" },
]

const socialLinks = [
  { label: "GitHub", href: "#", icon: GitBranch },
  { label: "Twitter", href: "#", icon: MessageCircle },
  { label: "LinkedIn", href: "#", icon: Briefcase },
]

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn("border-t border-border/40 bg-card/30 mt-20", className)}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-base tracking-tight">
              <span className="text-primary font-heading">DevOps</span> <span className="font-heading">Center</span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              Enterprise-grade DevOps monitoring and pipeline management platform.
              Orchestrate complex cloud architectures and deploy faster with complete confidence.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-[11px] font-semibold text-emerald-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              All Systems Operational
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-foreground font-heading">Product</h3>
            <ul className="space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-foreground font-heading">Company</h3>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-foreground font-heading">Resources</h3>
            <ul className="space-y-2.5">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} DevOps Control Center. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {socialLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  aria-label={link.label}
                  className="rounded-full border border-border/40 p-2 text-muted-foreground transition-all duration-200 hover:border-foreground hover:text-foreground hover:scale-105"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </footer>
  )
}
