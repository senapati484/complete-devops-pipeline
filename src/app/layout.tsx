import type { Metadata } from "next"
import { Toaster } from "@/components/ui/toast"
import { ToastProvider } from "@/components/toast-provider"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "DevOps Control Center",
  description: "Enterprise DevOps Dashboard & Control Center",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme="system">
          <ToastProvider>
            {children}
            <Toaster />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
