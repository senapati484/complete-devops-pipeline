"use client"

import { useEffect, useState, useCallback } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { TableSkeleton } from "@/components/loading-skeleton"
import { EmptyState } from "@/components/empty-state"
import { ErrorBoundary } from "@/components/error-boundary"
import { apiFetch } from "@/lib/api"
import type { Activity } from "@/types"

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
      // If activity endpoint doesn't exist, use dashboard data
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
    // Data fetches legitimately need to live in an effect — there's no
    // external-store equivalent for an HTTP request. The setStates below
    // happen after awaits, so they don't trigger the cascading render the
    // rule is trying to prevent. Disable per-line rather than refactor
    // to a query library, since this is a single read-only fetch.
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
          <h1 className="text-2xl font-bold">Activity Log</h1>
          <p className="text-sm text-muted-foreground">
            Track all actions across your DevOps environment.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {actionTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No activity found" description="Try adjusting your search or filters." />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {filtered.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-4">
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/50" />
                    <div className="flex-1">
                      <p className="text-sm">{activity.details}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ErrorBoundary>
  )
}
