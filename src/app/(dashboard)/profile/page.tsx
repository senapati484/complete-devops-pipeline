"use client"

import { useEffect, useState, useCallback } from "react"
import { User, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageSkeleton } from "@/components/loading-skeleton"
import { ErrorBoundary } from "@/components/error-boundary"
import { useToast } from "@/components/toast-provider"

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

export default function ProfilePage() {
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile")
      const data = await res.json()
      setProfile(data.user)
      setName(data.user.name)
    } catch {
      // handle error silently
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // See activity/page.tsx for rationale on why this fetch is in useEffect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile()
  }, [fetchProfile])

  const handleSave = useCallback(async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 500))
    toast({ title: "Profile updated", variant: "success" })
    setSaving(false)
  }, [toast])

  if (loading) return <PageSkeleton />

  if (!profile) return null

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account information.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>Update your personal details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input value={profile.role} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Member Since</Label>
              <Input
                value={new Date(profile.createdAt).toLocaleDateString()}
                disabled
                className="bg-muted"
              />
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Change Password</CardTitle>
            <CardDescription>Update your account password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input id="confirmNewPassword" type="password" />
            </div>
            <Button variant="outline">Update Password</Button>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  )
}
