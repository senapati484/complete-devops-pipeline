import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// One-shot seed endpoint. Call once after deployment to populate demo data.
// Protected by SEED_SECRET env var (or the first registered user's existence).
// Idempotent — safe to call multiple times; skips if data already exists.
export async function GET(request: Request) {
  try {
    // Optional secret guard: set SEED_SECRET in Jenkins credentials if desired.
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get("secret")
    if (process.env.SEED_SECRET && secret !== process.env.SEED_SECRET) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Find the first registered user to use as the actor for all demo data.
    const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } })
    if (!user) {
      return NextResponse.json(
        { error: "No users found. Register an account first, then call /api/seed." },
        { status: 400 }
      )
    }

    // Skip if already seeded (deployments exist).
    const existing = await prisma.deployment.count()
    if (existing > 0) {
      return NextResponse.json({ message: "Already seeded — skipping.", deployments: existing })
    }

    const now = new Date()
    const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000)

    // ── Deployments ──────────────────────────────────────────────────────────
    await prisma.deployment.createMany({
      data: [
        { projectName: "devops-control-center", status: "Success",    branch: "main",    commitHash: "6a33c44", deployedById: user.id, createdAt: ago(5) },
        { projectName: "devops-control-center", status: "Success",    branch: "main",    commitHash: "f7a0960", deployedById: user.id, createdAt: ago(120) },
        { projectName: "devops-nginx",           status: "Success",    branch: "main",    commitHash: "a1b2c3d", deployedById: user.id, createdAt: ago(130) },
        { projectName: "api-gateway",            status: "Failed",     branch: "feature/rate-limit", commitHash: "d4e5f6a", deployedById: user.id, createdAt: ago(200) },
        { projectName: "auth-service",           status: "Success",    branch: "main",    commitHash: "b7c8d9e", deployedById: user.id, createdAt: ago(360) },
        { projectName: "metrics-collector",      status: "InProgress", branch: "develop", commitHash: "e0f1a2b", deployedById: user.id, createdAt: ago(3) },
        { projectName: "notification-worker",    status: "Success",    branch: "main",    commitHash: "c3d4e5f", deployedById: user.id, createdAt: ago(720) },
        { projectName: "api-gateway",            status: "Success",    branch: "main",    commitHash: "f6a7b8c", deployedById: user.id, createdAt: ago(800) },
        { projectName: "frontend-cdn",           status: "Failed",     branch: "hotfix/csp-header", commitHash: "a9b0c1d", deployedById: user.id, createdAt: ago(1440) },
        { projectName: "frontend-cdn",           status: "Success",    branch: "main",    commitHash: "d2e3f4a", deployedById: user.id, createdAt: ago(1500) },
      ],
    })

    // ── Pipelines ─────────────────────────────────────────────────────────────
    await prisma.pipeline.createMany({
      data: [
        { name: "Complete-DevOps-Pipeline",   status: "Success",    stage: "deploy",   progress: 100, startedAt: ago(135), finishedAt: ago(125), createdAt: ago(140) },
        { name: "metrics-collector-CI",       status: "Running",    stage: "build",    progress: 38,  startedAt: ago(3),                         createdAt: ago(4) },
        { name: "api-gateway-CI",             status: "Failed",     stage: "test",     progress: 72,  startedAt: ago(205), finishedAt: ago(200),  createdAt: ago(210) },
        { name: "auth-service-CI",            status: "Success",    stage: "deploy",   progress: 100, startedAt: ago(365), finishedAt: ago(358),  createdAt: ago(370) },
        { name: "notification-worker-CI",     status: "Success",    stage: "deploy",   progress: 100, startedAt: ago(725), finishedAt: ago(718),  createdAt: ago(730) },
      ],
    })

    // ── Activity ──────────────────────────────────────────────────────────────
    await prisma.activity.createMany({
      data: [
        { action: "DEPLOY",  details: "Deployed devops-control-center:26 to production (main@6a33c44)",           userId: user.id, createdAt: ago(5) },
        { action: "DEPLOY",  details: "Deployed devops-nginx:latest to production — nginx config baked in image",  userId: user.id, createdAt: ago(130) },
        { action: "DEPLOY",  details: "Pipeline metrics-collector-CI started on branch develop",                   userId: user.id, createdAt: ago(3) },
        { action: "FAILED",  details: "Pipeline api-gateway-CI failed at test stage — 2 tests timed out",         userId: user.id, createdAt: ago(200) },
        { action: "DEPLOY",  details: "Deployed auth-service:v2.1.0 to production successfully",                  userId: user.id, createdAt: ago(360) },
        { action: "LOGIN",   details: `User ${user.name} signed in from ${user.email}`,                            userId: user.id, createdAt: ago(6) },
        { action: "DEPLOY",  details: "Deployed notification-worker:latest to production",                        userId: user.id, createdAt: ago(720) },
        { action: "FAILED",  details: "frontend-cdn deployment failed — CSP header regex syntax error",            userId: user.id, createdAt: ago(1440) },
        { action: "DEPLOY",  details: "Deployed frontend-cdn:stable to production — hotfix rolled back",          userId: user.id, createdAt: ago(1500) },
        { action: "REGISTER",details: `New user registered: ${user.name} (${user.email})`,                        userId: user.id, createdAt: user.createdAt },
      ],
    })

    return NextResponse.json({
      message: "Database seeded successfully!",
      seededFor: user.email,
      created: { deployments: 10, pipelines: 5, activities: 10 },
    })
  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json({ error: "Seed failed", detail: String(error) }, { status: 500 })
  }
}
