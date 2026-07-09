import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function POST(request: Request) {
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

    if (payload.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can create deployments" },
        { status: 403 }
      )
    }

    const { projectName, branch, commitHash } = await request.json()

    if (!projectName || !branch || !commitHash) {
      return NextResponse.json(
        { error: "projectName, branch, and commitHash are required" },
        { status: 400 }
      )
    }

    const deployment = await prisma.deployment.create({
      data: {
        projectName,
        branch,
        commitHash,
        status: "InProgress",
        deployedById: payload.userId,
      },
      include: {
        deployedBy: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({ deployment }, { status: 201 })
  } catch (error) {
    console.error("Deploy error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
