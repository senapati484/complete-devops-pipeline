export interface User {
  id: string
  name: string
  email: string
  role: "User" | "Admin"
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface Deployment {
  id: string
  projectName: string
  status: "Pending" | "InProgress" | "Success" | "Failed"
  branch: string
  commitSha: string
  deployedBy: string
  createdAt: Date
}

export interface Pipeline {
  id: string
  name: string
  status: "Pending" | "Running" | "Success" | "Failed"
  trigger: string
  progress: number
  startedAt: Date | null
  finishedAt: Date | null
}

export interface Activity {
  id: string
  userId: string
  details: string
  createdAt: Date
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: "Info" | "Success" | "Warning" | "Error"
  read: boolean
  createdAt: Date
}

export interface DashboardData {
  serverStatus: string
  uptime: number
  totalDeployments: number
  successfulDeployments: number
  failedDeployments: number
  activeContainers: number
  cpuUsage: number
  memoryUsage: number
  storageUsed: number
  storageTotal: number
  pipelines: Pipeline[]
  recentDeployments: Deployment[]
  recentActivity: Activity[]
  systemLogs: string[]
}

export interface HealthResponse {
  status: string
  uptime: number
  version: string
}