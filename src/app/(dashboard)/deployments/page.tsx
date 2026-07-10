"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TableSkeleton } from "@/components/loading-skeleton"
import { EmptyState } from "@/components/empty-state"
import { ErrorBoundary } from "@/components/error-boundary"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { apiFetch } from "@/lib/api"
import type { Deployment } from "@/types"
import { useToast } from "@/components/toast-provider"
import { cn } from "@/lib/utils"

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    Pending: "secondary",
    InProgress: "default",
    Success: "outline",
    Failed: "destructive",
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
      {status}
    </Badge>
  )
}

const ITEMS_PER_PAGE = 10

export default function DeploymentsPage() {
  const { toast } = useToast()
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchDeployments = useCallback(async () => {
    try {
      const data = await apiFetch<{ deployments: Deployment[] }>("/api/deployments")
      setDeployments(data.deployments)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDeployments()
  }, [fetchDeployments])

  const handleDelete = useCallback(async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/deployments?id=${deleteId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Delete failed")
      }
      setDeployments((prev) => prev.filter((d) => d.id !== deleteId))
      toast({ title: "Deployment deleted", variant: "success" })
    } catch (err) {
      toast({ title: "Failed to delete", description: (err as Error).message, variant: "error" })
    } finally {
      setDeleteId(null)
    }
  }, [deleteId, toast])

  const totalPages = Math.ceil(deployments.length / ITEMS_PER_PAGE)
  const paginatedDeployments = deployments.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  if (loading) return <TableSkeleton rows={8} />

  if (error) {
    return <EmptyState title="Failed to load deployments" description={error} />
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Deployments</h1>
            <p className="text-xs text-muted-foreground">
              Manage and monitor all application deployments.
            </p>
          </div>
          <Button className="rounded-full text-xs font-bold px-4 h-9">
            <Plus className="mr-1.5 h-4 w-4" />
            New Deployment
          </Button>
        </div>

        {deployments.length === 0 ? (
          <EmptyState
            title="No deployments"
            description="Create your first deployment to get started."
            action={
              <Button className="rounded-full text-xs font-bold px-4 h-9">
                <Plus className="mr-1.5 h-4 w-4" />
                New Deployment
              </Button>
            }
          />
        ) : (
          <>
            <div className="rounded-2xl border border-border/40 bg-card/45 backdrop-blur-md shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-b border-border/40 hover:bg-transparent">
                    <TableHead className="text-xs font-bold text-muted-foreground">Project</TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground">Status</TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground">Branch</TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground">Commit</TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground">Deployed By</TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground">Date</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDeployments.map((deployment) => (
                    <TableRow key={deployment.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                      <TableCell className="font-bold text-xs">{deployment.projectName}</TableCell>
                      <TableCell>
                        <StatusBadge status={deployment.status} />
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-muted-foreground">
                        {deployment.branch}
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground/80 font-bold">
                        {deployment.commitSha?.slice(0, 7) || "n/a"}
                      </TableCell>
                      <TableCell className="text-xs font-medium">{deployment.deployedBy}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(deployment.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Dialog open={deleteId === deployment.id} onOpenChange={(o) => !o && setDeleteId(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                              onClick={() => setDeleteId(deployment.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="border-border/40 shadow-2xl rounded-2xl">
                            <DialogHeader>
                              <DialogTitle className="font-heading font-bold text-base">Delete Deployment</DialogTitle>
                              <DialogDescription className="text-xs">
                                Are you sure you want to delete this deployment? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="gap-2 sm:gap-0">
                              <Button variant="outline" className="rounded-full text-xs font-bold" onClick={() => setDeleteId(null)}>
                                Cancel
                              </Button>
                              <Button variant="destructive" className="rounded-full text-xs font-bold" onClick={handleDelete}>
                                Delete
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-full text-xs font-bold h-8 px-4 border-border/40 hover:bg-card/50"
                >
                  Previous
                </Button>
                <span className="text-xs font-semibold text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-full text-xs font-bold h-8 px-4 border-border/40 hover:bg-card/50"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </ErrorBoundary>
  )
}
