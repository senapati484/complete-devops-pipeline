"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, Trash2, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { TableSkeleton } from "@/components/loading-skeleton"
import { EmptyState } from "@/components/empty-state"
import { ErrorBoundary } from "@/components/error-boundary"
import { apiFetch } from "@/lib/api"
import { useToast } from "@/components/toast-provider"
import { cn } from "@/lib/utils"

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

export default function AdminPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      const data = await apiFetch<{ users: AdminUser[] }>("/api/users")
      setUsers(data.users)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers()
  }, [fetchUsers])

  const handleDelete = useCallback(async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/users/${deleteId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Delete failed")
      }
      setUsers((prev) => prev.filter((u) => u.id !== deleteId))
      toast({ title: "User deleted", variant: "success" })
    } catch (err) {
      toast({ title: "Delete failed", description: (err as Error).message, variant: "error" })
    } finally {
      setDeleteId(null)
    }
  }, [deleteId, toast])

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <TableSkeleton rows={8} />

  if (error) {
    return <EmptyState title="Failed to load admin data" description={error} />
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Console</h1>
            <p className="text-xs text-muted-foreground">
              Manage accounts, roles, and security policies.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/40 bg-card/45 backdrop-blur-md p-5 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total users</p>
            <p className="text-3xl font-extrabold tracking-tight mt-1">{users.length}</p>
          </div>
          <div className="rounded-2xl border border-border/40 bg-card/45 backdrop-blur-md p-5 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Admins</p>
            <p className="text-3xl font-extrabold tracking-tight mt-1 text-primary">
              {users.filter((u) => u.role === "Admin").length}
            </p>
          </div>
          <div className="rounded-2xl border border-border/40 bg-card/45 backdrop-blur-md p-5 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Developers</p>
            <p className="text-3xl font-extrabold tracking-tight mt-1">
              {users.filter((u) => u.role === "User").length}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-9 rounded-full bg-background/50 border-border/40 text-xs focus-visible:ring-primary"
          />
        </div>

        {/* Users Table */}
        {filtered.length === 0 ? (
          <EmptyState title="No accounts matched" description="Try a different query." />
        ) : (
          <div className="rounded-2xl border border-border/40 bg-card/45 backdrop-blur-md shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-b border-border/40 hover:bg-transparent">
                  <TableHead className="text-xs font-bold text-muted-foreground">Name</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">Email</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">Role</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">Joined</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                    <TableCell className="font-bold text-xs">{user.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.role === "Admin" ? "default" : "secondary"}
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide",
                          user.role === "Admin" && "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20",
                          user.role === "User" && "border-border/60 bg-muted/40 hover:bg-muted/60"
                        )}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Dialog open={deleteId === user.id} onOpenChange={(o) => !o && setDeleteId(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                            onClick={() => setDeleteId(user.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="border-border/40 shadow-2xl rounded-2xl">
                          <DialogHeader>
                            <DialogTitle className="font-heading font-bold text-base flex items-center gap-1.5 text-rose-500">
                              <ShieldAlert className="h-5 w-5" />
                              <span>Confirm Deletion</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                              Are you sure you want to delete {user.name}? This will permanently remove their credentials and revoke workspace access.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" className="rounded-full text-xs font-bold" onClick={() => setDeleteId(null)}>
                              Cancel
                            </Button>
                            <Button variant="destructive" className="rounded-full text-xs font-bold" onClick={handleDelete}>
                              Revoke Access
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
        )}
      </div>
    </ErrorBoundary>
  )
}
