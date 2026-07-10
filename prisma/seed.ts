import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create admin user
  const adminPassword = await bcrypt.hash("Admin@123!", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@devops.local" },
    update: {},
    create: {
      name: "Sayan Senapati",
      email: "admin@devops.local",
      password: adminPassword,
      role: "ADMIN",
    },
  })
  console.log(`✅ Admin user: ${admin.email}  (password: Admin@123!)`)

  // Create regular user
  const userPassword = await bcrypt.hash("User@123!", 12)
  const user = await prisma.user.upsert({
    where: { email: "user@devops.local" },
    update: {},
    create: {
      name: "Shradha Piparah",
      email: "user@devops.local",
      password: userPassword,
      role: "USER",
    },
  })
  console.log(`✅ Regular user: ${user.email}  (password: User@123!)`)

  // Seed sample pipelines
  const pipelines = [
    { name: "Build & Test", status: "Success" as const, stage: "test", progress: 100 },
    { name: "Docker Build", status: "Running" as const, stage: "build", progress: 65 },
    { name: "Deploy to Prod", status: "Pending" as const, stage: "deploy", progress: 0 },
  ]

  for (const p of pipelines) {
    await prisma.pipeline.upsert({
      where: { id: p.name }, // use name as synthetic id for idempotency
      update: {},
      create: {
        id: p.name,
        name: p.name,
        status: p.status,
        stage: p.stage,
        progress: p.progress,
        startedAt: p.status !== "Pending" ? new Date() : null,
      },
    })
  }
  console.log(`✅ Seeded ${pipelines.length} sample pipelines`)

  // Seed sample deployment
  await prisma.deployment.upsert({
    where: { id: "seed-deployment-1" },
    update: {},
    create: {
      id: "seed-deployment-1",
      projectName: "api-service",
      status: "Success",
      branch: "main",
      commitHash: "a5191ec",
      deployedById: admin.id,
    },
  })
  console.log("✅ Seeded sample deployment")

  // Seed activity log
  await prisma.activity.create({
    data: {
      action: "SEED",
      details: "Database seeded successfully on first setup.",
      userId: admin.id,
    },
  })
  console.log("✅ Seeded activity log")

  console.log("\n🎉 Database seeding complete!")
  console.log("\n⚠️  CHANGE THESE PASSWORDS IMMEDIATELY IN PRODUCTION!")
  console.log("   Admin: admin@devops.local / Admin@123!")
  console.log("   User:  user@devops.local  / User@123!")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
