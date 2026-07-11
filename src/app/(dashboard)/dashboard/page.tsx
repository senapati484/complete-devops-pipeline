"use client"

import { useEffect, useState, useRef } from "react"
import {
  Activity,
  CheckCircle2,
  XCircle,
  Container,
  Cpu,
  HardDrive,
  Database,
  Server,
  Terminal as TerminalIcon,
  Play,
  Search,
  Copy,
  Trash2,
  Lock,
  Unlock,
  RefreshCw,
  GitBranch,
  ArrowUpRight,
  ShieldCheck,
  ServerCrash
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DashboardSkeleton } from "@/components/loading-skeleton"
import { EmptyState } from "@/components/empty-state"
import { ErrorBoundary } from "@/components/error-boundary"
import { apiFetch } from "@/lib/api"
import { useToast } from "@/components/toast-provider"
import type { DashboardData, Deployment, Pipeline, Activity as ActivityType } from "@/types"
import { cn } from "@/lib/utils"

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    healthy: "bg-emerald-500 shadow-emerald-500/50",
    warning: "bg-amber-500 shadow-amber-500/50",
    critical: "bg-rose-500 shadow-rose-500/50",
  }
  return (
    <span className={cn("inline-block h-2.5 w-2.5 rounded-full shadow-[0_0_8px] animate-pulse", colors[status] || "bg-gray-500")} />
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
        "rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide transition-all duration-200",
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
        "rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide transition-all duration-200",
        status === "Success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
        status === "Failed" && "border-rose-500/30 bg-rose-500/10 text-rose-500",
        status === "Running" && "bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse hover:bg-blue-500/20"
      )}
    >
      {status}
    </Badge>
  )
}

function ProgressBar({ value, label, subtext }: { value: number; label: string; subtext: string }) {
  const gradients: Record<string, string> = {
    cpu: "from-blue-500 via-indigo-500 to-violet-500 shadow-blue-500/20",
    memory: "from-purple-500 via-fuchsia-500 to-pink-500 shadow-purple-500/20",
    storage: "from-emerald-500 via-teal-500 to-cyan-500 shadow-emerald-500/20",
  }
  const icons: Record<string, React.ReactNode> = {
    cpu: <Cpu className="h-4.5 w-4.5 text-blue-500" />,
    memory: <Database className="h-4.5 w-4.5 text-purple-500" />,
    storage: <HardDrive className="h-4.5 w-4.5 text-emerald-500" />,
  }
  return (
    <div className="space-y-2 p-3 rounded-xl border border-border/10 bg-background/20 hover:bg-accent/15 transition-all duration-300">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-background/60 border border-border/40">
            {icons[label]}
          </div>
          <div>
            <span className="font-bold tracking-tight capitalize text-foreground/90">{label}</span>
            <p className="text-[10px] text-muted-foreground font-medium">{subtext}</p>
          </div>
        </div>
        <span className="font-mono font-extrabold text-xs text-foreground/90 bg-muted/50 px-2 py-0.5 rounded-md">{value}%</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted/65 overflow-hidden border border-border/40 p-[1px]">
        <div
          className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-1000 shadow-sm", gradients[label])}
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
      case "success": return "bg-emerald-500 border-emerald-600 text-white shadow-md shadow-emerald-500/25 font-bold"
      case "failed": return "bg-rose-500 border-rose-600 text-white shadow-md shadow-rose-500/25 animate-pulse font-bold"
      case "running": return "bg-blue-500 border-blue-600 text-white shadow-md shadow-blue-500/25 animate-pulse font-bold"
      default: return "bg-muted text-muted-foreground border-border/40 font-medium"
    }
  }

  const getLineStyle = (stage: string) => {
    switch (stage) {
      case "success": return "bg-emerald-500"
      case "failed": return "bg-rose-400 dark:bg-rose-900"
      case "running": return "bg-blue-500 animate-pulse"
      default: return "bg-muted"
    }
  }

  return (
    <div className="flex items-center gap-1.5 bg-background/40 p-1 rounded-full border border-border/20 shadow-inner">
      <div title="Source checkout" className={cn("flex h-7 w-7 items-center justify-center rounded-full border text-[9px] tracking-tight cursor-help transition-all duration-300", getStageStyle(sourceStatus))}>
        SRC
      </div>
      <div className={cn("h-1 w-5 transition-all duration-300 rounded-full", getLineStyle(buildStatus))} />
      <div title="Build image" className={cn("flex h-7 w-7 items-center justify-center rounded-full border text-[9px] tracking-tight cursor-help transition-all duration-300", getStageStyle(buildStatus))}>
        BLD
      </div>
      <div className={cn("h-1 w-5 transition-all duration-300 rounded-full", getLineStyle(testStatus))} />
      <div title="Run test suite" className={cn("flex h-7 w-7 items-center justify-center rounded-full border text-[9px] tracking-tight cursor-help transition-all duration-300", getStageStyle(testStatus))}>
        TST
      </div>
      <div className={cn("h-1 w-5 transition-all duration-300 rounded-full", getLineStyle(deployStatus))} />
      <div title="Deploy target" className={cn("flex h-7 w-7 items-center justify-center rounded-full border text-[9px] tracking-tight cursor-help transition-all duration-300", getStageStyle(deployStatus))}>
        DEP
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { toast } = useToast()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Terminal Logs State
  const [logs, setLogs] = useState<string[]>([])
  const [logFilter, setLogFilter] = useState("ALL")
  const [logSearch, setLogSearch] = useState("")
  const [autoScroll, setAutoScroll] = useState(true)
  const logScrollRef = useRef<HTMLDivElement>(null)

  // Simulated Pipeline triggering state
  const [isBuilding, setIsBuilding] = useState(false)
  const [simulatedProgress, setSimulatedProgress] = useState(0)

  // Fetch Dashboard details
  const fetchDashboardData = () => {
    apiFetch<DashboardData>("/api/dashboard")
      .then((res) => {
        setData(res)
        setLogs(res.systemLogs)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Auto-scroll logic for log terminal
  useEffect(() => {
    if (autoScroll && logScrollRef.current) {
      const scrollContainer = logScrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [logs, autoScroll])

  const copyLogsToClipboard = () => {
    navigator.clipboard.writeText(logs.join("\n"))
    toast({ title: "Logs Copied!", description: "Console log entries saved to clipboard.", variant: "success" })
  }

  const triggerSimulatedBuild = () => {
    if (isBuilding) return
    setIsBuilding(true)
    setSimulatedProgress(0)
    toast({ title: "Manual Build Triggered", description: "Spinning up agent runner on branch: main...", variant: "default" })

    const steps = [
      { prg: 10, log: "[INFO] [10:09:50] Jenkins checkout repository senapati484/complete-devops-pipeline" },
      { prg: 20, log: "[INFO] [10:09:52] Running TypeScript validation: tsc --noEmit..." },
      { prg: 30, log: "[INFO] [10:09:55] TypeScript compiler typecheck passed successfully" },
      { prg: 40, log: "[INFO] [10:09:57] Generating client database schemas: prisma generate..." },
      { prg: 50, log: "[INFO] [10:10:01] Building NextJS production build files..." },
      { prg: 65, log: "[WARN] [10:10:08] Prisma deprecation notice: prisma config files are deprecated" },
      { prg: 75, log: "[INFO] [10:10:12] NextJS build completed in standalone output mode" },
      { prg: 85, log: "[INFO] [10:10:15] Packaging build into multi-stage Alpine Docker image..." },
      { prg: 95, log: "[INFO] [10:10:18] Pushing image tag :latest and :build-27 to Docker Hub..." },
      { prg: 100, log: "[SUCCESS] [10:10:20] Deployment completed. App live at http://98.88.251.65" }
    ]

    let stepIndex = 0
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        const nextStep = steps[stepIndex]
        setSimulatedProgress(nextStep.prg)
        setLogs(prev => [...prev, nextStep.log])
        stepIndex++
      } else {
        clearInterval(interval)
        setIsBuilding(false)
        toast({ title: "Build Successful!", description: "Production dashboard has been successfully deployed.", variant: "success" })
        // Increment statistics
        if (data) {
          setData({
            ...data,
            totalDeployments: data.totalDeployments + 1,
            successfulDeployments: data.successfulDeployments + 1,
            recentDeployments: [
              {
                id: Math.random().toString(),
                projectName: "devops-control-center",
                status: "Success",
                branch: "main",
                commitSha: "c64a48c",
                deployedBy: "Sayan Senapati",
                createdAt: new Date()
              },
              ...data.recentDeployments
            ],
            recentActivity: [
              {
                id: Math.random().toString(),
                userId: "user-1",
                details: "Manually triggered build succeeded: devops-control-center:main",
                createdAt: new Date()
              },
              ...data.recentActivity
            ]
          })
        }
      }
    }, 1500)
  }

  if (loading) return <DashboardSkeleton />

  if (error) {
    return (
      <EmptyState
        icon={ServerCrash}
        title="Failed to load dashboard"
        description={error}
      />
    )
  }

  if (!data) return null

  // Filter & Search Logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.toLowerCase().includes(logSearch.toLowerCase())
    if (logFilter === "ALL") return matchesSearch
    return log.includes(`[${logFilter}]`) && matchesSearch
  })

  const statsCards = [
    { title: "Total Deployments", value: data.totalDeployments, sub: "+12.5% vs last month", icon: Activity, color: "text-blue-500 bg-blue-500/10 border-blue-500/20 shadow-blue-500/5" },
    { title: "Successful Runs", value: data.successfulDeployments, sub: "98.9% success rate", icon: CheckCircle2, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5" },
    { title: "Failed Releases", value: data.failedDeployments, sub: "0 in the last 7 days", icon: XCircle, color: "text-rose-500 bg-rose-500/10 border-rose-500/20 shadow-rose-500/5" },
    { title: "Active Containers", value: data.activeContainers, sub: "All instances healthy", icon: Container, color: "text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5" },
  ]

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Dashboard Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card/20 p-4 rounded-2xl border border-border/40 backdrop-blur-md">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">Dashboard Overview</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live status, pipeline configurations, and host metrics.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="flex items-center gap-1.5 text-xs border-border/40 bg-card/65 backdrop-blur-md px-3.5 py-1.5 rounded-full text-foreground/80 hover:bg-card/85 transition-all shadow-sm select-none">
              <StatusDot status={data.serverStatus} />
              Host Server: <span className="font-extrabold capitalize text-primary">{data.serverStatus}</span>
            </Badge>

            <Button 
              onClick={triggerSimulatedBuild} 
              disabled={isBuilding}
              className="rounded-full text-xs font-bold px-4 py-2 hover:scale-[1.03] transition-all active:scale-[0.98] shadow-md shadow-primary/20"
            >
              {isBuilding ? (
                <>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Building ({simulatedProgress}%)
                </>
              ) : (
                <>
                  <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                  Trigger Deploy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="border-border/40 bg-card/45 backdrop-blur-md shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/30 group cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 h-16 w-16 bg-primary/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="flex flex-row items-center justify-between pb-1 px-5 pt-5">
                  <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.title}</CardTitle>
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-110", stat.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5 space-y-1">
                  <div className="text-3xl font-extrabold tracking-tight text-foreground/90">{stat.value}</div>
                  <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                    {stat.sub}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Pipelines & Host utilization */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Host Resource Usage */}
          <Card className="border-border/40 bg-card/45 backdrop-blur-md shadow-sm lg:col-span-1 flex flex-col justify-between">
            <CardHeader className="pb-3 px-6 pt-6">
              <CardTitle className="text-sm font-bold font-heading flex items-center gap-2">
                <Server className="h-4.5 w-4.5 text-primary" />
                <span>Host Performance Node</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">AWS EC2 micro hardware utilization & telemetry.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6 flex-1 flex flex-col justify-center">
              <ProgressBar value={data.cpuUsage} label="cpu" subtext="AMD EPYC 2 vCPUs @ 2.5GHz" />
              <ProgressBar value={data.memoryUsage} label="memory" subtext="1.0 GB RAM (Virtual Memory active)" />
              <ProgressBar 
                value={Math.round((data.storageUsed / data.storageTotal) * 100)} 
                label="storage" 
                subtext={`${data.storageUsed}GB of ${data.storageTotal}GB SSD volume`} 
              />
            </CardContent>
          </Card>

          {/* Active Pipelines */}
          <Card className="border-border/40 bg-card/45 backdrop-blur-md shadow-sm lg:col-span-2">
            <CardHeader className="px-6 pt-6 pb-3 border-b border-border/20">
              <CardTitle className="text-sm font-bold font-heading flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <GitBranch className="h-4.5 w-4.5 text-primary" />
                  <span>CI/CD Pipelines</span>
                </span>
                <span className="text-[10px] bg-background/50 px-2.5 py-1 rounded-full border border-border/40 text-muted-foreground font-normal">
                  Stages: SRC ➜ BLD ➜ TST ➜ DEP
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-4">
              {isBuilding && (
                <div className="mb-4 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 animate-pulse-glow flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-500" />
                      Manual-Trigger-Pipeline
                    </p>
                    <p className="text-[10px] text-muted-foreground">Running building commands inside agent container</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <VisualPipeline status="Running" progress={simulatedProgress} />
                    <span className="font-mono text-xs font-bold text-blue-500">{simulatedProgress}%</span>
                  </div>
                </div>
              )}

              {data.pipelines.length === 0 && !isBuilding ? (
                <EmptyState title="No active pipelines" description="You have no pipelines configured yet." />
              ) : (
                <ScrollArea className="h-[250px] pr-3">
                  <div className="space-y-3">
                    {data.pipelines.map((pipeline: Pipeline) => (
                      <div
                        key={pipeline.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/30 p-3.5 backdrop-blur-sm hover:border-primary/25 hover:bg-background/50 transition-all group"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{pipeline.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">
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
        </div>

        {/* Recent Deployments & Audit logs */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Deployments */}
          <Card className="border-border/40 bg-card/45 backdrop-blur-md shadow-sm">
            <CardHeader className="px-6 pt-6">
              <CardTitle className="text-sm font-bold font-heading flex items-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-primary" />
                <span>Recent Deployments</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {data.recentDeployments.length === 0 ? (
                <EmptyState title="No recent deployments" description="No deployments completed in this environment." />
              ) : (
                <ScrollArea className="h-[250px] pr-3">
                  <div className="space-y-3">
                    {data.recentDeployments.map((deployment: Deployment) => (
                      <div
                        key={deployment.id}
                        className="flex items-center justify-between rounded-xl border border-border/40 bg-background/30 p-3.5 hover:border-primary/25 hover:bg-background/50 transition-all cursor-pointer group"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{deployment.projectName}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-medium">
                            <span className="font-bold text-primary">{deployment.branch}</span>
                            <span>&middot;</span>
                            <span>{deployment.deployedBy}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2.5">
                          {deployment.commitSha && (
                            <code className="text-[9px] font-mono bg-muted/60 px-2 py-0.5 rounded border border-border/45 text-muted-foreground">
                              {deployment.commitSha.substring(0, 7)}
                            </code>
                          )}
                          <DeploymentBadge status={deployment.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

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
                      <div key={activity.id} className="flex items-start gap-3 text-xs p-2.5 rounded-xl hover:bg-accent/20 transition-all border border-transparent hover:border-border/10">
                        <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70 shadow-sm shadow-primary/30" />
                        <div className="space-y-0.5">
                          <p className="text-foreground/90 leading-relaxed text-xs">{activity.details}</p>
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
        </div>

        {/* Real-time System Logs Terminal */}
        <Card className="border-border/40 bg-card/45 backdrop-blur-md shadow-lg overflow-hidden">
          <CardHeader className="px-6 pt-6 pb-3 border-b border-border/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <CardTitle className="text-sm font-bold font-heading flex items-center gap-2.5">
                <TerminalIcon className="h-4.5 w-4.5 text-primary" />
                <span>Interactive Log Streamer</span>
              </CardTitle>

              {/* Console Filters */}
              <div className="flex flex-wrap items-center gap-1.5">
                {["ALL", "INFO", "WARN", "SUCCESS", "ERROR"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setLogFilter(filter)}
                    className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer",
                      logFilter === filter 
                        ? "bg-primary/10 text-primary border-primary/30 shadow-inner"
                        : "border-border/40 bg-background/50 hover:bg-accent/40 text-muted-foreground"
                    )}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Terminal Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-2.5 bg-background/60 border-b border-border/20">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter outputs..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="h-7 text-[10px] pl-8 bg-background/40 border-border/30 rounded-md focus-visible:ring-primary w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setAutoScroll(!autoScroll)} 
                  title={autoScroll ? "Lock Scroll active" : "Auto-scroll disabled"}
                  className={cn("h-7 w-7 rounded-md", autoScroll ? "text-primary hover:text-primary bg-primary/5 border border-primary/20" : "text-muted-foreground")}
                >
                  {autoScroll ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                </Button>

                <Button variant="ghost" size="icon" onClick={copyLogsToClipboard} title="Copy all logs" className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground">
                  <Copy className="h-3.5 w-3.5" />
                </Button>

                <Button variant="ghost" size="icon" onClick={() => setLogs([])} title="Clear terminal screen" className="h-7 w-7 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Terminal Panel */}
            <div className="bg-slate-950 p-4 shadow-inner" ref={logScrollRef}>
              <div className="flex items-center gap-1.5 pb-2.5 mb-2 border-b border-white/5">
                <div className="h-2 w-2 rounded-full bg-rose-500/80" />
                <div className="h-2 w-2 rounded-full bg-amber-500/80" />
                <div className="h-2 w-2 rounded-full bg-emerald-500/80" />
                <span className="text-[9px] text-slate-500 font-mono pl-1.5 font-bold">host.daemon.log</span>
              </div>
              <ScrollArea className="h-[220px] font-mono text-[10px] leading-relaxed text-slate-300">
                <div className="space-y-1">
                  {filteredLogs.length === 0 ? (
                    <div className="text-slate-500 text-center py-10 font-sans text-xs">No matching system outputs found.</div>
                  ) : (
                    filteredLogs.map((log: string, i: number) => {
                      let colorClass = "text-slate-400"
                      if (log.includes("ERROR") || log.includes("failed")) {
                        colorClass = "text-rose-400 font-medium"
                      } else if (log.includes("WARN")) {
                        colorClass = "text-amber-400 font-medium"
                      } else if (log.includes("INFO")) {
                        colorClass = "text-slate-300"
                      } else if (log.includes("SUCCESS")) {
                        colorClass = "text-emerald-400 font-semibold"
                      }
                      return (
                        <div key={i} className={cn("px-2 py-0.5 hover:bg-white/5 rounded transition-all", colorClass)}>
                          <span className="text-slate-600 mr-2 select-none">{(i + 1).toString().padStart(3, "0")}</span>
                          {log}
                        </div>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  )
}
