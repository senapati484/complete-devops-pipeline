"use client"

import { useEffect, useState } from "react"
import {
  Activity,
  CheckCircle2,
  XCircle,
  Container,
  Cpu,
  HardDrive,
  Database,
  Server,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DashboardSkeleton } from "@/components/loading-skeleton"
import { EmptyState } from "@/components/empty-state"
import { ErrorBoundary } from "@/components/error-boundary"
import { apiFetch } from "@/lib/api"
import type { DashboardData, Deployment, Pipeline, Activity as ActivityType } from "@/types"
import { cn } from "@/lib/utils"

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    healthy: "bg-green-500",
    warning: "bg-yellow-500",
    critical: "bg-red-500",
  }
  return (
    <span className={cn("inline-block h-2.5 w-2.5 rounded-full", colors[status] || "bg-gray-500")} />
  )
}

function DeploymentBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    Pending: "secondary",
    InProgress: "default",
    Success: "outline",
    Failed: "destructive",
  }
  const labels: Record<string, string> = {
    Pending: "Pending",
    InProgress: "In Progress",
    Success: "Success",
    Failed: "Failed",
  }
  return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>
}

function PipelineBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    Pending: "secondary",
    Running: "default",
    Success: "outline",
    Failed: "destructive",
  }
  return <Badge variant={variants[status] || "secondary"}>{status}</Badge>
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  const colors: Record<string, string> = {
    cpu: "bg-blue-500",
    memory: "bg-purple-500",
    storage: "bg-emerald-500",
  }
  const icons: Record<string, React.ReactNode> = {
    cpu: <Cpu className="h-4 w-4 text-blue-500" />,
    memory: <Database className="h-4 w-4 text-purple-500" />,
    storage: <HardDrive className="h-4 w-4 text-emerald-500" />,
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {icons[label]}
          <span className="font-medium capitalize">{label}</span>
        </div>
        <span className="text-muted-foreground">{value}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-500", colors[label])}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<DashboardData>("/api/dashboard")
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />

  if (error) {
    return (
      <EmptyState
        icon={Server}
        title="Failed to load dashboard"
        description={error}
      />
    )
  }

  if (!data) return null

  const statsCards = [
    { title: "Total Deployments", value: data.totalDeployments, icon: Activity },
    { title: "Successful", value: data.successfulDeployments, icon: CheckCircle2 },
    { title: "Failed", value: data.failedDeployments, icon: XCircle },
    { title: "Active Containers", value: data.activeContainers, icon: Container },
  ]

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Overview of your DevOps infrastructure
            </p>
          </div>
          <Badge className="flex items-center gap-1.5 text-sm">
            <StatusDot status={data.serverStatus} />
            Server {data.serverStatus}
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Resource Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resource Usage</CardTitle>
            <CardDescription>Current system resource utilization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProgressBar value={data.cpuUsage} label="cpu" />
            <ProgressBar value={data.memoryUsage} label="memory" />
            <ProgressBar value={Math.round((data.storageUsed / data.storageTotal) * 100)} label="storage" />
          </CardContent>
        </Card>

        {/* Pipelines & Recent Deployments */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pipelines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pipelines</CardTitle>
            </CardHeader>
            <CardContent>
              {data.pipelines.length === 0 ? (
                <EmptyState title="No pipelines" description="No pipeline runs yet." />
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {data.pipelines.map((pipeline: Pipeline) => (
                      <div
                        key={pipeline.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{pipeline.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {pipeline.startedAt
                              ? new Date(pipeline.startedAt).toLocaleString()
                              : "Not started"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{pipeline.progress}%</span>
                          <PipelineBadge status={pipeline.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Recent Deployments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Deployments</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentDeployments.length === 0 ? (
                <EmptyState title="No deployments" description="No recent deployments." />
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {data.recentDeployments.map((deployment: Deployment) => (
                      <div
                        key={deployment.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{deployment.projectName}</p>
                          <p className="text-xs text-muted-foreground">
                            {deployment.branch} &middot; {deployment.deployedBy}
                          </p>
                        </div>
                        <DeploymentBadge status={deployment.status} />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & System Logs */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentActivity.length === 0 ? (
                <EmptyState title="No activity" description="No recent activity." />
              ) : (
                <ScrollArea className="h-[250px]">
                  <div className="space-y-3">
                    {data.recentActivity.map((activity: ActivityType) => (
                      <div key={activity.id} className="flex items-start gap-3 text-sm">
                        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary/50" />
                        <div>
                          <p>{activity.details}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* System Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                <div className="space-y-2 font-mono text-xs">
                  {data.systemLogs.map((log: string, i: number) => (
                    <div key={i} className="text-muted-foreground">
                      {log}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  )
}
