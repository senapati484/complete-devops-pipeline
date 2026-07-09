"use client"

import { useState } from "react"
import { Sun, Moon, Monitor, Bell, Shield, Palette } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/components/theme-provider"
import { useToast } from "@/components/toast-provider"
import { cn } from "@/lib/utils"

const themeOptions = [
  { value: "light" as const, label: "Light", icon: Sun },
  { value: "dark" as const, label: "Dark", icon: Moon },
  { value: "system" as const, label: "System", icon: Monitor },
]

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    deploymentAlerts: true,
    weeklyDigest: false,
  })

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSaveNotifications = () => {
    toast({ title: "Settings saved", variant: "success" })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your application preferences.
        </p>
      </div>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>Choose your preferred theme.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {themeOptions.map((option) => {
              const Icon = option.icon
              const isActive = theme === option.value
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-2 rounded-lg border p-4 transition-all",
                    isActive
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-sm font-medium", isActive && "text-primary")}>
                    {option.label}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Control how you receive notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via email.</p>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={() => handleNotificationChange("email")}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive push notifications in the browser.</p>
            </div>
            <Switch
              checked={notifications.push}
              onCheckedChange={() => handleNotificationChange("push")}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive text message alerts for critical events.</p>
            </div>
            <Switch
              checked={notifications.sms}
              onCheckedChange={() => handleNotificationChange("sms")}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Deployment Alerts</Label>
              <p className="text-sm text-muted-foreground">Get notified on deployment status changes.</p>
            </div>
            <Switch
              checked={notifications.deploymentAlerts}
              onCheckedChange={() => handleNotificationChange("deploymentAlerts")}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Digest</Label>
              <p className="text-sm text-muted-foreground">Receive a weekly summary of activity.</p>
            </div>
            <Switch
              checked={notifications.weeklyDigest}
              onCheckedChange={() => handleNotificationChange("weeklyDigest")}
            />
          </div>
          <Button onClick={handleSaveNotifications} className="mt-2">
            Save Notification Settings
          </Button>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Account Settings
          </CardTitle>
          <CardDescription>Manage your account security and data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">Add an extra layer of security.</p>
            </div>
            <Button variant="outline" size="sm">Enable</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Export Data</Label>
              <p className="text-sm text-muted-foreground">Download all your data as CSV.</p>
            </div>
            <Button variant="outline" size="sm">Export</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-destructive">Delete Account</Label>
              <p className="text-sm text-muted-foreground">Permanently delete your account and data.</p>
            </div>
            <Button variant="destructive" size="sm">Delete</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
