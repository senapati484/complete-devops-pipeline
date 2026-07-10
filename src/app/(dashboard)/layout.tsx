"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  Activity,
  LayoutDashboard,
  GitBranch,
  ListChecks,
  User,
  Settings,
  Shield,
  Menu,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { apiFetch } from "@/lib/api"

const sidebarLinks = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Deployments", href: "/deployments", icon: Package },
  { label: "Pipelines", href: "/pipelines", icon: GitBranch },
  { label: "Activity", href: "/activity", icon: ListChecks },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Admin", href: "/admin", icon: Shield, adminOnly: true },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null)

  useEffect(() => {
    apiFetch<{ user: { name: string; email: string; role: string } }>("/api/profile")
      .then((data) => setUser(data.user))
      .catch(() => router.push("/login"))
  }, [router])

  const handleLogout = useCallback(async () => {
    await fetch("/api/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }, [router])

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  return (
    <div className="flex min-h-screen bg-background/50 grid-bg">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border/40 bg-card/60 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border/40 px-6">
          <Activity className="h-5 w-5 text-primary animate-pulse-glow" />
          <span className="font-heading font-bold text-sm tracking-tight">DevOps Center</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-none">
          <div className="space-y-1">
            {sidebarLinks.map((link) => {
              if (link.adminOnly && user?.role !== "Admin") return null
              const Icon = link.icon
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeSidebar}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold tracking-tight transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary border-l-2 border-primary shadow-sm shadow-primary/5"
                      : "text-muted-foreground hover:bg-accent/40 hover:text-foreground hover:translate-x-0.5"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  {link.label}
                </Link>
              )
            })}
          </div>
        </nav>
        <div className="border-t border-border/40 p-4 bg-card/20">
          <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/40 p-2.5">
            <Avatar className="h-8 w-8 border border-border/60">
              <AvatarFallback className="text-xs font-bold bg-primary/5 text-primary">{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 truncate">
              <p className="text-xs font-bold text-foreground">{user?.name || "User"}</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{user?.role || "Loading..."}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border/40 bg-card/40 backdrop-blur-md px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent hover:text-accent-foreground lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="relative hidden flex-1 sm:block">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search resource or pipeline..."
              className="h-9 max-w-xs pl-10 rounded-full bg-background/50 border-border/40 text-xs focus-visible:ring-primary"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-accent/40">
                  <Bell className="h-4.5 w-4.5" />
                  <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-primary ring-2 ring-background"></span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 border-border/40 shadow-xl rounded-xl">
                <DropdownMenuLabel className="font-heading font-bold text-xs">Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator className="border-border/40" />
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No new notifications
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-9 pl-2 pr-1 rounded-full hover:bg-accent/40">
                  <Avatar className="h-6.5 w-6.5 border border-border/60">
                    <AvatarFallback className="text-[10px] font-bold bg-primary/5 text-primary">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-xs font-bold text-foreground sm:inline">{user?.name || "User"}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 border-border/40 shadow-xl rounded-xl">
                <DropdownMenuLabel className="font-heading font-bold text-xs">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="border-border/40" />
                <DropdownMenuItem onClick={() => router.push("/profile")} className="text-xs">
                  <User className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")} className="text-xs">
                  <Settings className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="border-border/40" />
                <DropdownMenuItem onClick={handleLogout} className="text-xs text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
