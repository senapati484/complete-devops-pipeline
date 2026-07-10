"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { TableSkeleton } from "@/components/loading-skeleton"
import { EmptyState } from "@/components/empty-state"
import { ErrorBoundary } from "@/components/error-boundary"
import { apiFetch } from "@/lib/api"
import type { Activity } from "@/types"
import { cn } from "@/lib/utils"

const actionTypes = ["All", "Deployment", "Pipeline", "Login", "Config", "Alert"]

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("All")

  const fetchActivities = useCallback(async () => {
    try {
      const data = await apiFetch<{ activities: Activity[] }>("/api/activity")
      setActivities(data.activities)
    } catch {
      try {
        const data = await apiFetch<{ recentActivity: Activity[] }>("/api/dashboard")
        setActivities(data.recentActivity)
      } catch (err) {
        setError((err as Error).message)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchActivities()
  }, [fetchActivities])

  const filtered = activities.filter((a) => {
    const matchesSearch = a.details.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === "All" || a.details.toLowerCase().includes(filter.toLowerCase())
    return matchesSearch && matchesFilter
  })

  if (loading) return <TableSkeleton />

  if (error) {
    return <EmptyState title="Failed to load activity" description={error} />
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-xs text-muted-foreground">
            Audit logs and environment trigger activity.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search activity events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-9 rounded-full bg-background/50 border-border/40 text-xs focus-visible:ring-primary"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-44 h-9 rounded-full bg-background/50 border-border/40 text-xs focus:ring-primary">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Filter className="h-3 w-3" />
                <SelectValue placeholder="Category" />
              </span>
            </SelectTrigger>
            <SelectContent className="border-border/40 shadow-xl rounded-xl">
              {actionTypes.map((type) => (
                <SelectItem key={type} value={type} className="text-xs">
                  {type} Log
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No activity matches found" description="Try adjusting your search criteria or filter tags." />
        ) : (
          <Card className="border-border/40 bg-card/45 backdrop-blur-md shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {filtered.map((activity) => {
                  let badgeColor = "bg-primary/50"
                  if (activity.details.toLowerCase().includes("fail")) {
                    badgeColor = "bg-rose-500 shadow-rose-500/20"
                  } else if (activity.details.toLowerCase().includes("success")) {
                    badgeColor = "bg-emerald-500 shadow-emerald-500/20"
                  } else if (activity.details.toLowerCase().includes("login")) {
                    badgeColor = "bg-blue-500 shadow-blue-500/20"
                  }
                  
                  return (
                    <div key={activity.id} className="flex items-start gap-4 p-4 hover:bg-muted/10 transition-colors">
                      <div className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full shadow-sm animate-pulse-glow", badgeColor)} />
                      <div className="flex-1 space-y-0.5">
                        <p className="text-xs font-medium text-foreground/90 leading-relaxed">{activity.details}</p>
                        <p className="text-[10px] font-semibold text-muted-foreground/80">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ErrorBoundary>
  )
}
