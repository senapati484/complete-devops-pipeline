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

    const deployments = await prisma.deployment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        deployedBy: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({ deployments })
  } catch (error) {
    console.error("Deployments error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
