"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Activity, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/toast-provider"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Login failed")
        return
      }

      toast({ title: "Welcome back!", variant: "success" })
      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-md shadow-xl">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/5 text-primary border border-primary/10 animate-pulse-glow">
          <Activity className="h-5 w-5" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
        <CardDescription className="text-xs">Sign in to your DevOps Control Center account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive font-medium border border-destructive/20">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="glass-input h-10 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
              <Link
                href="/forgot-password"
                className="text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="glass-input h-10 text-xs"
            />
          </div>
          <Button type="submit" className="w-full rounded-full text-xs font-bold h-10 pt-0.5" disabled={loading}>
            {loading ? (
              "Signing in..."
            ) : (
              <>
                Sign In
                <LogIn className="ml-1.5 h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-xs text-muted-foreground border-t border-border/40 pt-4 mt-2">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="ml-1 font-bold text-primary hover:underline">
          Sign up
        </Link>
      </CardFooter>
    </Card>
  )
}
