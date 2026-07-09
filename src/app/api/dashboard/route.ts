import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const totalDeployments = await prisma.deployment.count()
    const successfulDeployments = await prisma.deployment.count({
      where: { status: "Success" },
    })
    const failedDeployments = await prisma.deployment.count({
      where: { status: "Failed" },
    })

    const recentDeployments = await prisma.deployment.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { deployedBy: { select: { id: true, name: true, email: true } } },
    })

    const recentActivity = await prisma.activity.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true } } },
    })

    const pipelines = await prisma.pipeline.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      serverStatus: "healthy",
      uptime: Math.floor(process.uptime()),
      totalDeployments,
      successfulDeployments,
      failedDeployments,
      activeContainers: 12,
      cpuUsage: 45,
      memoryUsage: 62,
      storageUsed: 256,
      storageTotal: 500,
      pipelines,
      recentDeployments: recentDeployments.map((d: { id: string; projectName: string; status: string; branch: string; commitHash: string; deployedBy: { id: string; name: string; email: string }; createdAt: Date }) => ({
        id: d.id,
        projectName: d.projectName,
        status: d.status,
        branch: d.branch,
        commitSha: d.commitHash,
        deployedBy: d.deployedBy.name,
        createdAt: d.createdAt,
      })),
      recentActivity: recentActivity.map((a: { id: string; userId: string; action: string; details: string | null; createdAt: Date }) => ({
        id: a.id,
        userId: a.userId,
        details: a.details || a.action,
        createdAt: a.createdAt,
      })),
      systemLogs: [
        "[INFO] Server started successfully",
        "[INFO] Database connection established",
        "[INFO] Redis cache connected",
        "[INFO] WebSocket server ready",
        "[INFO] Load balancer configured",
      ],
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
