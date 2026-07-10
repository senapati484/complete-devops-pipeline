"use client"

import { useState } from "react"
import Link from "next/link"
import { Activity, Mail, ArrowLeft, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/toast-provider"

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate sending reset email
    await new Promise((r) => setTimeout(r, 1000))

    toast({
      title: "Reset link sent!",
      description: "Check your email for password reset instructions.",
      variant: "success",
    })
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <Card className="border-border/40 bg-card/40 backdrop-blur-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Check your email</CardTitle>
          <CardDescription className="text-xs">
            We&apos;ve sent a password reset link to <strong>{email}</strong>.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center border-t border-border/40 pt-4 mt-2">
          <Link
            href="/login"
            className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-md shadow-xl">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/5 text-primary border border-primary/10 animate-pulse-glow">
          <Activity className="h-5 w-5" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Forgot password?</CardTitle>
        <CardDescription className="text-xs">
          Enter your email and we&apos;ll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 glass-input h-10 text-xs"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full rounded-full text-xs font-bold h-10 pt-0.5" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center border-t border-border/40 pt-4 mt-2">
        <Link
          href="/login"
          className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  )
}
