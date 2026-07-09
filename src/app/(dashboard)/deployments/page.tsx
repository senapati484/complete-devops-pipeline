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

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    Pending: "secondary",
    InProgress: "default",
    Success: "outline",
    Failed: "destructive",
  }
  return <Badge variant={variants[status] || "secondary"}>{status}</Badge>
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
    return <EmptyState title="Failed to load" description={error} />
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Deployments</h1>
            <p className="text-sm text-muted-foreground">
              Manage all deployments across your projects.
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Deployment
          </Button>
        </div>

        {deployments.length === 0 ? (
          <EmptyState
            title="No deployments"
            description="Create your first deployment to get started."
            action={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Deployment
              </Button>
            }
          />
        ) : (
          <>
            <div className="rounded-xl border bg-card shadow">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Commit</TableHead>
                    <TableHead>Deployed By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDeployments.map((deployment) => (
                    <TableRow key={deployment.id}>
                      <TableCell className="font-medium">{deployment.projectName}</TableCell>
                      <TableCell>
                        <StatusBadge status={deployment.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {deployment.branch}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {deployment.commitSha?.slice(0, 7)}
                      </TableCell>
                      <TableCell className="text-sm">{deployment.deployedBy}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(deployment.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Dialog open={deleteId === deployment.id} onOpenChange={(o) => !o && setDeleteId(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteId(deployment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Deployment</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete this deployment? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setDeleteId(null)}>
                                Cancel
                              </Button>
                              <Button variant="destructive" onClick={handleDelete}>
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
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
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
