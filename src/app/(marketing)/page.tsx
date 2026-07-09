"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import {
  Activity,
  Rocket,
  GitBranch,
  Container,
  Users,
  Shield,
  ChevronDown,
  ArrowRight,
  Star,
  Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const features = [
  {
    icon: Activity,
    title: "Real-time Monitoring",
    description: "Track deployment health, server metrics, and application performance in real time with live dashboards.",
  },
  {
    icon: Rocket,
    title: "Automated Deployments",
    description: "Deploy to production with one click or set up automated pipelines that trigger on every commit.",
  },
  {
    icon: GitBranch,
    title: "Pipeline Management",
    description: "Design, visualize, and manage complex CI/CD pipelines with an intuitive drag-and-drop interface.",
  },
  {
    icon: Container,
    title: "Docker Integration",
    description: "Seamlessly build, push, and deploy Docker containers across your infrastructure with built-in registry.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Invite team members, assign roles, and collaborate on deployments with real-time notifications.",
  },
  {
    icon: Shield,
    title: "Security & Compliance",
    description: "Enterprise-grade security with role-based access control, audit logs, and compliance reporting.",
  },
]

const statsData = [
  { label: "Uptime", value: 99.9, suffix: "%" },
  { label: "Deployments", value: 10, suffix: "K+" },
  { label: "Users", value: 5, suffix: "K+" },
  { label: "Integrations", value: 50, suffix: "+" },
]

const testimonials = [
  {
    quote: "DevOps Control Center transformed our deployment workflow. We went from manual deploys to fully automated pipelines in days.",
    name: "Sarah Chen",
    title: "CTO, TechFlow",
    avatar: "/avatars/sarah.jpg",
    initials: "SC",
  },
  {
    quote: "The monitoring and alerting capabilities are outstanding. We caught production issues before they affected our users.",
    name: "Marcus Johnson",
    title: "DevOps Lead, CloudScale",
    avatar: "/avatars/marcus.jpg",
    initials: "MJ",
  },
  {
    quote: "Best DevOps platform we've used. The team collaboration features alone saved us hours of coordination every week.",
    name: "Priya Patel",
    title: "Engineering Manager, DataSync",
    avatar: "/avatars/priya.jpg",
    initials: "PP",
  },
]

const faqs = [
  {
    question: "What is DevOps Control Center?",
    answer: "DevOps Control Center is an enterprise-grade platform for managing deployments, monitoring infrastructure, and orchestrating CI/CD pipelines. It provides a unified dashboard for all your DevOps operations.",
  },
  {
    question: "How does deployment work?",
    answer: "Connect your Git repository, configure your deployment pipeline, and deploy with one click or automatically on every push. We support Docker containers, serverless functions, and traditional VM deployments.",
  },
  {
    question: "Is it secure?",
    answer: "Yes. We use end-to-end encryption, SOC 2 compliance, role-based access control, and detailed audit logs. Your data is encrypted at rest and in transit.",
  },
  {
    question: "Can I integrate with existing tools?",
    answer: "Absolutely. We integrate with GitHub, GitLab, Bitbucket, Docker Hub, AWS, Azure, GCP, Slack, PagerDuty, and 50+ other tools.",
  },
  {
    question: "What kind of support do you offer?",
    answer: "All plans include email support. Professional plans include priority support, and Enterprise plans include 24/7 phone support with a dedicated account manager.",
  },
]

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const duration = 2000
    const step = Math.max(1, Math.floor(target / 60))
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(start)
      }
    }, duration / 60)
    return () => clearInterval(timer)
  }, [isInView, target])

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  )
}

function AccordionItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string
  answer: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-border">
      <button
        className="flex w-full items-center justify-between py-4 text-left text-base font-medium transition-colors hover:text-primary"
        onClick={onToggle}
      >
        {question}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <p className="pb-4 text-sm text-muted-foreground">{answer}</p>
      </motion.div>
    </div>
  )
}

function FadeInUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  )
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const scrollToFeatures = useCallback(() => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
  }, [])

  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="absolute inset-0 -z-10 animate-gradient bg-[linear-gradient(-45deg,#3b82f6,#8b5cf6,#ec4899,#3b82f6)] bg-[length:400%_400%]" />
        <div className="absolute inset-0 -z-10 bg-background/60 backdrop-blur-sm" />
        <div className="mx-auto max-w-4xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
          >
            DevOps Control Center
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="mt-6 text-lg text-muted-foreground sm:text-xl"
          >
            Manage deployments, monitor infrastructure, and orchestrate pipelines — all from one powerful dashboard.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 text-base">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base" onClick={scrollToFeatures}>
              Learn More
            </Button>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <FadeInUp>
            <div className="text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">Everything you need to ship faster</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Powerful tools for modern DevOps teams.
              </p>
            </div>
          </FadeInUp>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <FadeInUp key={feature.title} delay={i * 0.1}>
                  <Card className="group h-full transition-shadow hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </FadeInUp>
              )
            })}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-border bg-muted/50 px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {statsData.map((stat, i) => (
              <FadeInUp key={stat.label} delay={i * 0.15}>
                <div className="text-center">
                  <div className="text-4xl font-bold sm:text-5xl">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </FadeInUp>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <FadeInUp>
            <div className="text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">Loved by engineering teams</h2>
              <p className="mt-4 text-lg text-muted-foreground">Hear from our customers.</p>
            </div>
          </FadeInUp>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <FadeInUp key={t.name} delay={i * 0.15}>
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-1 text-primary">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="mt-4 text-sm italic text-muted-foreground">&ldquo;{t.quote}&rdquo;</p>
                    <div className="mt-6 flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={t.avatar} alt={t.name} />
                        <AvatarFallback>{t.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.title}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeInUp>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 px-4 py-24">
        <div className="mx-auto max-w-3xl">
          <FadeInUp>
            <div className="text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">Frequently asked questions</h2>
              <p className="mt-4 text-lg text-muted-foreground">Everything you need to know.</p>
            </div>
          </FadeInUp>
          <FadeInUp delay={0.2}>
            <div className="mt-12 rounded-xl border bg-card p-6 shadow-sm">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  question={faq.question}
                  answer={faq.answer}
                  open={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              ))}
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <FadeInUp>
            <h2 className="text-3xl font-bold sm:text-4xl">Ready to Get Started?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands of teams already shipping faster with DevOps Control Center.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <div className="relative w-full max-w-sm">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="h-12 pl-10"
                />
              </div>
              <Button size="lg" className="h-12 w-full px-8 sm:w-auto">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Free 14-day trial. No credit card required.
            </p>
          </FadeInUp>
        </div>
      </section>
    </div>
  )
}
