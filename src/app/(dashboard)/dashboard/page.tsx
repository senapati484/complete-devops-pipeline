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
  Terminal as TerminalIcon
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
    healthy: "bg-emerald-500 shadow-emerald-500/50",
    warning: "bg-amber-500 shadow-amber-500/50",
    critical: "bg-rose-500 shadow-rose-500/50",
  }
  return (
    <span className={cn("inline-block h-2 w-2 rounded-full shadow-sm animate-pulse", colors[status] || "bg-gray-500")} />
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
  return (
    <Badge 
      variant={variants[status] || "secondary"} 
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide",
        status === "Success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
        status === "Failed" && "border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20",
        status === "InProgress" && "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 animate-pulse"
      )}
    >
      {labels[status] || status}
    </Badge>
  )
}

function PipelineBadge({ status }: { status: string }) {
  return (
    <Badge 
      variant={status === "Failed" ? "destructive" : status === "Running" ? "default" : "outline"}
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide",
        status === "Success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
        status === "Failed" && "border-rose-500/30 bg-rose-500/10 text-rose-500",
        status === "Running" && "bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse hover:bg-blue-500/20"
      )}
    >
      {status}
    </Badge>
  )
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  const gradients: Record<string, string> = {
    cpu: "from-blue-500 to-indigo-500 shadow-blue-500/20",
    memory: "from-purple-500 to-pink-500 shadow-purple-500/20",
    storage: "from-emerald-500 to-teal-500 shadow-emerald-500/20",
  }
  const icons: Record<string, React.ReactNode> = {
    cpu: <Cpu className="h-4 w-4 text-blue-500" />,
    memory: <Database className="h-4 w-4 text-purple-500" />,
    storage: <HardDrive className="h-4 w-4 text-emerald-500" />,
  }
  return (
    <div className="space-y-1.5 p-1 rounded-xl hover:bg-accent/10 transition-colors">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {icons[label]}
          <span className="font-bold tracking-tight capitalize text-foreground/80">{label}</span>
        </div>
        <span className="font-mono font-bold text-muted-foreground">{value}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden border border-border/40">
        <div
          className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700 shadow-sm", gradients[label])}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function VisualPipeline({ status, progress }: { status: string; progress: number }) {
  let sourceStatus = "success"
  let buildStatus = "pending"
  let testStatus = "pending"
  let deployStatus = "pending"

  if (status === "Success") {
    sourceStatus = "success"
    buildStatus = "success"
    testStatus = "success"
    deployStatus = "success"
  } else if (status === "Failed") {
    sourceStatus = "success"
    buildStatus = "success"
    testStatus = "failed"
    deployStatus = "pending"
  } else if (status === "Running" || status === "InProgress") {
    sourceStatus = "success"
    if (progress < 35) {
      buildStatus = "running"
    } else if (progress < 75) {
      buildStatus = "success"
      testStatus = "running"
    } else {
      buildStatus = "success"
      testStatus = "success"
      deployStatus = "running"
    }
  }

  const getStageStyle = (stage: string) => {
    switch (stage) {
      case "success": return "bg-emerald-500 border-emerald-600 text-white shadow-md shadow-emerald-500/20"
      case "failed": return "bg-rose-500 border-rose-600 text-white shadow-md shadow-rose-500/20 animate-pulse"
      case "running": return "bg-blue-500 border-blue-600 text-white shadow-md shadow-blue-500/20 animate-pulse"
      default: return "bg-muted text-muted-foreground border-border/40"
    }
  }

  const getLineStyle = (stage: string) => {
    switch (stage) {
      case "success": return "bg-emerald-500"
      case "failed": return "bg-rose-300 dark:bg-rose-950"
      case "running": return "bg-blue-500 animate-pulse"
      default: return "bg-muted"
    }
  }

  return (
    <div className="flex items-center gap-1">
      <div title="Source checkout" className={cn("flex h-6 w-6 items-center justify-center rounded-full border text-[9px] font-extrabold tracking-tight", getStageStyle(sourceStatus))}>
        SRC
      </div>
      <div className={cn("h-0.5 w-3.5 transition-all duration-300", getLineStyle(buildStatus))} />
      <div title="Build image" className={cn("flex h-6 w-6 items-center justify-center rounded-full border text-[9px] font-extrabold tracking-tight", getStageStyle(buildStatus))}>
        BLD
      </div>
      <div className={cn("h-0.5 w-3.5 transition-all duration-300", getLineStyle(testStatus))} />
      <div title="Run test suite" className={cn("flex h-6 w-6 items-center justify-center rounded-full border text-[9px] font-extrabold tracking-tight", getStageStyle(testStatus))}>
        TST
      </div>
      <div className={cn("h-0.5 w-3.5 transition-all duration-300", getLineStyle(deployStatus))} />
      <div title="Deploy target" className={cn("flex h-6 w-6 items-center justify-center rounded-full border text-[9px] font-extrabold tracking-tight", getStageStyle(deployStatus))}>
        DEP
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
    { title: "Total Deployments", value: data.totalDeployments, icon: Activity, color: "text-primary bg-primary/5 border-primary/10" },
    { title: "Successful", value: data.successfulDeployments, icon: CheckCircle2, color: "text-emerald-500 bg-emerald-500/5 border-emerald-500/10" },
    { title: "Failed Runs", value: data.failedDeployments, icon: XCircle, color: "text-rose-500 bg-rose-500/5 border-rose-500/10" },
    { title: "Active Containers", value: data.activeContainers, icon: Container, color: "text-amber-500 bg-amber-500/5 border-amber-500/10" },
  ]

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
            <p className="text-xs text-muted-foreground">
              Live status, pipeline configurations, and host metrics.
            </p>
          </div>
          <Badge className="flex items-center gap-1.5 text-xs border-border/40 bg-card/60 backdrop-blur-md px-3 py-1 rounded-full text-foreground/80 hover:bg-card/80 transition-all shadow-sm">
            <StatusDot status={data.serverStatus} />
            Server: <span className="font-bold capitalize text-primary">{data.serverStatus}</span>
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="border-border/40 bg-card/45 backdrop-blur-md shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between pb-1 px-5 pt-5">
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.title}</CardTitle>
                  <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg border", stat.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <div className="text-3xl font-extrabold tracking-tight">{stat.value}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Resource Usage */}
        <Card className="border-border/40 bg-card/45 backdrop-blur-md shadow-sm">
          <CardHeader className="pb-3 px-6 pt-6">
            <CardTitle className="text-sm font-bold font-heading">Host Resource Utilization</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Current hardware node metrics and capacity indicators.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            <ProgressBar value={data.cpuUsage} label="cpu" />
            <ProgressBar value={data.memoryUsage} label="memory" />
            <ProgressBar value={Math.round((data.storageUsed / data.storageTotal) * 100)} label="storage" />
          </CardContent>
        </Card>

        {/* Pipelines & Recent Deployments */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pipelines */}
          <Card className="border-border/40 bg-card/45 backdrop-blur-md shadow-sm">
            <CardHeader className="px-6 pt-6">
              <CardTitle className="text-sm font-bold font-heading flex items-center justify-between">
                <span>Active Pipelines</span>
                <span className="text-[10px] text-muted-foreground font-normal">Stages: SRC ➜ BLD ➜ TST ➜ DEP</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {data.pipelines.length === 0 ? (
                <EmptyState title="No active pipelines" description="You have no pipelines configured yet." />
              ) : (
                <ScrollArea className="h-[300px] pr-3">
                  <div className="space-y-3">
                    {data.pipelines.map((pipeline: Pipeline) => (
                      <div
                        key={pipeline.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/30 p-3.5 backdrop-blur-sm hover:border-primary/25 hover:bg-background/50 transition-all group"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{pipeline.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {pipeline.startedAt
                              ? new Date(pipeline.startedAt).toLocaleString()
                              : "Not started"}
                          </p>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-border/20 pt-2 sm:pt-0">
                          <VisualPipeline status={pipeline.status} progress={pipeline.progress} />
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-muted-foreground">{pipeline.progress}%</span>
                            <PipelineBadge status={pipeline.status} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Recent Deployments */}
          <Card className="border-border/40 bg-card/45 backdrop-blur-md shadow-sm">
            <CardHeader className="px-6 pt-6">
              <CardTitle className="text-sm font-bold font-heading">Recent Deployments</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {data.recentDeployments.length === 0 ? (
                <EmptyState title="No recent deployments" description="No deployments completed in this environment." />
              ) : (
                <ScrollArea className="h-[300px] pr-3">
                  <div className="space-y-3">
                    {data.recentDeployments.map((deployment: Deployment) => (
                      <div
                        key={deployment.id}
                        className="flex items-center justify-between rounded-xl border border-border/40 bg-background/30 p-3.5 hover:border-primary/25 hover:bg-background/50 transition-all"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-foreground">{deployment.projectName}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                            <span className="font-semibold text-primary">{deployment.branch}</span>
                            <span>&middot;</span>
                            <span>{deployment.deployedBy}</span>
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
          <Card className="border-border/40 bg-card/45 backdrop-blur-md shadow-sm">
            <CardHeader className="px-6 pt-6">
              <CardTitle className="text-sm font-bold font-heading">Audit Activity Log</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {data.recentActivity.length === 0 ? (
                <EmptyState title="No recent activity" description="No system activity recorded yet." />
              ) : (
                <ScrollArea className="h-[250px] pr-3">
                  <div className="space-y-3">
                    {data.recentActivity.map((activity: ActivityType) => (
                      <div key={activity.id} className="flex items-start gap-3 text-xs p-2 rounded-lg hover:bg-accent/20 transition-all">
                        <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70 shadow-sm shadow-primary/30" />
                        <div className="space-y-0.5">
                          <p className="text-foreground/90 leading-relaxed">{activity.details}</p>
                          <p className="text-[9px] font-semibold text-muted-foreground/80">
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

          {/* System Logs Terminal */}
          <Card className="border-border/40 bg-card/45 backdrop-blur-md shadow-sm overflow-hidden">
            <CardHeader className="px-6 pt-6 pb-3">
              <CardTitle className="text-sm font-bold font-heading flex items-center gap-2">
                <TerminalIcon className="h-4.5 w-4.5 text-primary" />
                <span>Docker Log Stream</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="rounded-xl border border-border/40 bg-slate-950 p-4 shadow-inner">
                <div className="flex items-center gap-1.5 pb-2.5 mb-2 border-b border-white/5">
                  <div className="h-2 w-2 rounded-full bg-rose-500/80" />
                  <div className="h-2 w-2 rounded-full bg-amber-500/80" />
                  <div className="h-2 w-2 rounded-full bg-emerald-500/80" />
                  <span className="text-[9px] text-slate-500 font-mono pl-1.5">daemon.log</span>
                </div>
                <ScrollArea className="h-[180px] font-mono text-[10px] leading-relaxed text-slate-400">
                  <div className="space-y-1.5">
                    {data.systemLogs.map((log: string, i: number) => {
                      let colorClass = "text-slate-400"
                      if (log.includes("ERROR") || log.includes("failed")) {
                        colorClass = "text-rose-400"
                      } else if (log.includes("WARN")) {
                        colorClass = "text-amber-400"
                      } else if (log.includes("INFO") || log.includes("success")) {
                        colorClass = "text-emerald-400"
                      }
                      return (
                        <div key={i} className={colorClass}>
                          {log}
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  )
}
