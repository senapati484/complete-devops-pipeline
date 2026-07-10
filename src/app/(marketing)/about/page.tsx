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
  { name: "Sayan Senapati", role: "CEO & CO-FOUNDER & DEV", initials: "SS" },
  { name: "Shradha Piparah", role: "DEV & MANAGER", initials: "SP" },
]

function FadeInUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}

export default function AboutPage() {
  return (
    <div className="px-4 py-28 grid-bg min-h-screen relative overflow-hidden">
      {/* Decorative Glow Elements */}
      <div className="absolute top-[10%] left-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px]" />
      <div className="absolute bottom-[20%] right-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[100px]" />

      <div className="mx-auto max-w-7xl">
        {/* Mission */}
        <FadeInUp>
          <div className="mx-auto max-w-3xl text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              Our Vision
            </div>
            <h1 className="text-4xl font-extrabold sm:text-5xl tracking-tight leading-none">Our Mission</h1>
            <p className="text-sm text-muted-foreground leading-relaxed pt-2">
              We believe that deploying software should be simple, fast, and reliable.
              DevOps Control Center was built to eliminate the complexity of modern
              infrastructure management, giving engineering teams the tools they need
              to ship with confidence.
            </p>
          </div>
        </FadeInUp>

        {/* Story */}
        <FadeInUp delay={0.2}>
          <div className="mx-auto mt-24 max-w-3xl border border-border/40 rounded-3xl bg-card/35 p-8 backdrop-blur-md shadow-sm">
            <h2 className="text-xl font-bold tracking-tight">Our Story</h2>
            <div className="mt-4 space-y-4 text-xs text-muted-foreground leading-relaxed md:text-sm">
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
        <div className="mt-28">
          <FadeInUp>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Our Values</h2>
              <p className="text-xs text-muted-foreground">
                The principles that guide everything we do.
              </p>
            </div>
          </FadeInUp>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value, i) => {
              const Icon = value.icon
              return (
                <FadeInUp key={value.title} delay={i * 0.1}>
                  <Card className="h-full border-border/40 bg-card/35 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20">
                    <CardContent className="p-6 space-y-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary border border-primary/10">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-bold tracking-tight">{value.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{value.description}</p>
                    </CardContent>
                  </Card>
                </FadeInUp>
              )
            })}
          </div>
        </div>

        {/* Team */}
        <div className="mt-28">
          <FadeInUp>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Meet the Team</h2>
              <p className="text-xs text-muted-foreground">
                The people building the future of developer operations.
              </p>
            </div>
          </FadeInUp>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member, i) => (
              <FadeInUp key={member.name} delay={i * 0.1}>
                <Card className="h-full border-border/40 bg-card/35 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20">
                  <CardContent className="flex flex-col items-center p-6 text-center space-y-4">
                    <Avatar className="h-16 w-16 border border-border/60">
                      <AvatarFallback className="text-sm font-bold bg-primary/5 text-primary">{member.initials}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-foreground">{member.name}</h3>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{member.role}</p>
                    </div>
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
