"use client"

import { motion } from "framer-motion"
import { Target, Heart, Shield, Zap, Users as UsersIcon, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const values = [
  {
    icon: Shield,
    title: "Trust & Security",
    description: "We prioritize the security and privacy of our users' data above everything else.",
  },
  {
    icon: Zap,
    title: "Speed & Reliability",
    description: "We build tools that are fast, reliable, and always available when you need them.",
  },
  {
    icon: UsersIcon,
    title: "Team First",
    description: "Great software is built by great teams. We foster collaboration and growth.",
  },
  {
    icon: Heart,
    title: "User Love",
    description: "Every feature we build starts with understanding our users' needs.",
  },
  {
    icon: Target,
    title: "Continuous Improvement",
    description: "We never stop iterating. Every day we strive to be better than yesterday.",
  },
  {
    icon: TrendingUp,
    title: "Data-Driven",
    description: "We make decisions based on data, not assumptions.",
  },
]

const teamMembers = [
  { name: "Alex Rivera", role: "CEO & Co-Founder", initials: "AR" },
  { name: "Jordan Kim", role: "CTO & Co-Founder", initials: "JK" },
  { name: "Taylor Brooks", role: "Head of Engineering", initials: "TB" },
  { name: "Morgan Lee", role: "Head of Product", initials: "ML" },
  { name: "Casey Williams", role: "Head of Design", initials: "CW" },
  { name: "Riley Thompson", role: "Head of Sales", initials: "RT" },
]

function FadeInUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  )
}

export default function AboutPage() {
  return (
    <div className="px-4 py-24">
      <div className="mx-auto max-w-7xl">
        {/* Mission */}
        <FadeInUp>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold sm:text-5xl">Our Mission</h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              We believe that deploying software should be simple, fast, and reliable.
              DevOps Control Center was built to eliminate the complexity of modern
              infrastructure management, giving engineering teams the tools they need
              to ship with confidence.
            </p>
          </div>
        </FadeInUp>

        {/* Story */}
        <FadeInUp delay={0.2}>
          <div className="mx-auto mt-20 max-w-3xl">
            <h2 className="text-2xl font-bold">Our Story</h2>
            <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Founded in 2024, DevOps Control Center started as an internal tool at a
                fast-growing startup. Our founders, Alex and Jordan, were frustrated by
                the complexity of managing deployments across multiple environments with
                existing tools that were either too simplistic or overly complex.
              </p>
              <p>
                They built a simple dashboard that brought together monitoring, deployments,
                and pipeline management in one place. When other teams started asking for
                access, they realized they had built something that every engineering team needs.
              </p>
              <p>
                Today, DevOps Control Center powers deployments for thousands of teams
                worldwide, from early-stage startups to Fortune 500 enterprises.
              </p>
            </div>
          </div>
        </FadeInUp>

        {/* Values */}
        <div className="mt-24">
          <FadeInUp>
            <h2 className="text-center text-2xl font-bold">Our Values</h2>
            <p className="mt-2 text-center text-muted-foreground">
              The principles that guide everything we do.
            </p>
          </FadeInUp>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value, i) => {
              const Icon = value.icon
              return (
                <FadeInUp key={value.title} delay={i * 0.1}>
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <Icon className="h-8 w-8 text-primary" />
                      <h3 className="mt-4 text-lg font-semibold">{value.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{value.description}</p>
                    </CardContent>
                  </Card>
                </FadeInUp>
              )
            })}
          </div>
        </div>

        {/* Team */}
        <div className="mt-24">
          <FadeInUp>
            <h2 className="text-center text-2xl font-bold">Meet the Team</h2>
            <p className="mt-2 text-center text-muted-foreground">
              The people building DevOps Control Center.
            </p>
          </FadeInUp>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member, i) => (
              <FadeInUp key={member.name} delay={i * 0.1}>
                <Card className="h-full">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="text-lg">{member.initials}</AvatarFallback>
                    </Avatar>
                    <h3 className="mt-4 text-lg font-semibold">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </CardContent>
                </Card>
              </FadeInUp>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
