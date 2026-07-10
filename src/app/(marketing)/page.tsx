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
  CheckCircle2
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
  { label: "Uptime guarantee", value: 99.9, suffix: "%" },
  { label: "Deployments run", value: 10, suffix: "K+" },
  { label: "Active developer users", value: 5, suffix: "K+" },
  { label: "Cloud Integrations", value: 50, suffix: "+" },
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
    <div className="border-b border-border/40">
      <button
        className="flex w-full items-center justify-between py-4 text-left text-xs font-semibold text-foreground transition-colors hover:text-primary md:text-sm"
        onClick={onToggle}
      >
        {question}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180 text-primary"
          )}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <p className="pb-4 text-xs text-muted-foreground leading-relaxed">{answer}</p>
      </motion.div>
    </div>
  )
}

function FadeInUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}

const pipelineSteps = [
  { text: "$ git clone https://github.com/devops/api.git", delay: 1000 },
  { text: "Cloning into 'api'... done (245ms).", delay: 400 },
  { text: "$ docker build -t api-service:latest .", delay: 1100 },
  { text: "Sending build context to Docker daemon... done.", delay: 300 },
  { text: "Step 1/3 : FROM node:20-alpine -> Cache hit.", delay: 200 },
  { text: "Step 2/3 : RUN npm ci -> Installed 156 pkgs.", delay: 700 },
  { text: "Step 3/3 : RUN npm run build -> Compiled.", delay: 900 },
  { text: "$ npm test", delay: 600 },
  { text: "✔ tests/auth.spec.ts passed (1.4s)", delay: 300 },
  { text: "✔ tests/db.spec.ts passed (2.1s)", delay: 300 },
  { text: "$ deploy --env=production --cluster=aws-eks", delay: 1200 },
  { text: "Pushing containers to AWS ECR... done.", delay: 500 },
  { text: "Updating Kubernetes ingress routes... done.", delay: 700 },
  { text: "✔ DEPLOYMENT SUCCESSFUL!", delay: 400 },
  { text: "Live URL: https://api.devops-center.com", delay: 800 }
]

function DevOpsTerminal() {
  const [lines, setLines] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (currentStep >= pipelineSteps.length) {
      const timeout = setTimeout(() => {
        setLines([])
        setCurrentStep(0)
      }, 6000)
      return () => clearTimeout(timeout)
    }

    const next = pipelineSteps[currentStep]
    const timeout = setTimeout(() => {
      setLines(prev => [...prev, next.text])
      setCurrentStep(curr => curr + 1)
    }, next.delay)

    return () => clearTimeout(timeout)
  }, [currentStep])

  return (
    <div className="w-full rounded-2xl border border-border/40 bg-slate-955 bg-card/85 shadow-2xl backdrop-blur-xl overflow-hidden font-mono text-[10px] md:text-xs">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/60 border-b border-border/40">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
        </div>
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground/80 font-bold">pipeline-sim.sh</span>
        <div className="w-10" />
      </div>
      <div className="p-4 space-y-1.5 h-64 overflow-y-auto">
        {lines.map((line, i) => {
          let colorClass = "text-slate-300"
          if (line.startsWith("$")) {
            colorClass = "text-indigo-400 font-semibold"
          } else if (line.includes("✔ tests/")) {
            colorClass = "text-emerald-400 font-medium"
          } else if (line.startsWith("✔ DEPLOY")) {
            colorClass = "text-emerald-400 font-bold tracking-wide"
          } else if (line.startsWith("Live URL:")) {
            colorClass = "text-cyan-400 underline font-semibold"
          } else {
            colorClass = "text-slate-500"
          }
          return (
            <div key={i} className={colorClass}>
              {line}
            </div>
          )
        })}
        {currentStep < pipelineSteps.length && (
          <span className="inline-block w-1.5 h-3 bg-indigo-500 animate-pulse ml-0.5" />
        )}
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const scrollToFeatures = useCallback(() => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
  }, [])

  return (
    <div className="overflow-hidden min-h-screen grid-bg relative">
      {/* Top Ambient Glow Elements */}
      <div className="absolute top-[-20%] left-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[100px] dark:bg-primary/5" />
      <div className="absolute top-[-10%] right-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[100px] dark:bg-indigo-500/5" />

      {/* HERO SECTION */}
      <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 pt-16 md:pt-24 lg:px-8">
        <div className="mx-auto max-w-7xl w-full grid lg:grid-cols-12 gap-12 items-center">
          <div className="text-left lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
              </span>
              Now Supporting Multi-Region AWS EKS
            </div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl xl:text-7xl leading-[1.05]"
            >
              DevOps Control <br />
              <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
                Center
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="text-sm text-muted-foreground sm:text-base md:text-lg max-w-xl leading-relaxed"
            >
              Manage deployments, monitor system infrastructure, and orchestrate complex pipeline steps — all within a single unified workspace built for devops engineers.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="flex flex-col items-start gap-4 sm:flex-row"
            >
              <Link href="/register">
                <Button size="lg" className="h-11 rounded-full px-6 text-xs font-bold transition-all duration-200 hover:scale-105 shadow-md shadow-primary/20">
                  Get Started Free
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-11 rounded-full px-6 text-xs font-bold border-border/40 hover:bg-card/50" onClick={scrollToFeatures}>
                Learn More
              </Button>
            </motion.div>

            {/* Quick Badges */}
            <div className="pt-6 border-t border-border/40 flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> SOC2 Compliant
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> End-to-End Encryption
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Zero configuration
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 w-full flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="w-full max-w-md relative"
            >
              {/* Glow backdrop behind terminal */}
              <div className="absolute inset-[-10px] -z-10 rounded-3xl bg-gradient-to-tr from-primary/10 to-indigo-500/10 blur-xl animate-pulse" />
              <DevOpsTerminal />
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="px-4 py-28 relative">
        <div className="absolute inset-y-0 right-0 -z-10 h-full w-[300px] bg-primary/2.5 blur-[120px] dark:bg-primary/1" />
        <div className="mx-auto max-w-7xl">
          <FadeInUp>
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">Everything you need to ship faster</h2>
              <p className="mx-auto max-w-xl text-xs text-muted-foreground md:text-sm">
                Take control of your infrastructure with our enterprise-grade CI/CD and system monitoring components.
              </p>
            </div>
          </FadeInUp>
          
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <FadeInUp key={feature.title} delay={i * 0.1}>
                  <Card className="group h-full border-border/40 bg-card/45 backdrop-blur-md shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-card/75 hover:shadow-md cursor-pointer">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary border border-primary/15 transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-bold tracking-tight">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </FadeInUp>
              )
            })}
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="border-y border-border/40 bg-card/20 px-4 py-20 backdrop-blur-md">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {statsData.map((stat, i) => (
              <FadeInUp key={stat.label} delay={i * 0.15}>
                <div className="text-center space-y-1">
                  <div className="text-3xl font-extrabold sm:text-5xl tracking-tight bg-gradient-to-b from-foreground to-foreground/80 bg-clip-text">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                </div>
              </FadeInUp>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="px-4 py-28 relative">
        <div className="mx-auto max-w-7xl">
          <FadeInUp>
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">Loved by engineering teams</h2>
              <p className="mx-auto max-w-xl text-xs text-muted-foreground md:text-sm">Hear from cloud specialists and DevOps leaders who use our workspace daily.</p>
            </div>
          </FadeInUp>
          
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <FadeInUp key={t.name} delay={i * 0.15}>
                <Card className="h-full border-border/40 bg-card/30 backdrop-blur-md">
                  <CardContent className="p-6 flex flex-col justify-between h-full">
                    <div className="space-y-4">
                      <div className="flex gap-0.5 text-primary">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} className="h-3.5 w-3.5 fill-current" />
                        ))}
                      </div>
                      <p className="text-xs italic text-muted-foreground leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                    </div>
                    <div className="mt-6 flex items-center gap-3 border-t border-border/40 pt-4">
                      <Avatar className="h-9 w-9 border border-border/60">
                        <AvatarImage src={t.avatar} alt={t.name} />
                        <AvatarFallback className="text-xs font-bold">{t.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-bold text-foreground">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground">{t.title}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeInUp>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="px-4 py-28 bg-card/10 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl">
          <FadeInUp>
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">Frequently asked questions</h2>
              <p className="mx-auto max-w-xl text-xs text-muted-foreground md:text-sm">Everything you need to know about setting up and running DevOps Center.</p>
            </div>
          </FadeInUp>
          
          <FadeInUp delay={0.2}>
            <div className="mt-12 rounded-2xl border border-border/40 bg-card/30 p-6 shadow-sm backdrop-blur-md">
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

      {/* CTA SECTION */}
      <section className="px-4 py-28 relative">
        <div className="mx-auto max-w-4xl relative overflow-hidden rounded-3xl border border-border/40 bg-slate-950 px-6 py-16 text-center sm:px-12">
          {/* Neon Glow Sphere */}
          <div className="absolute bottom-[-50%] right-[-20%] -z-10 h-72 w-72 rounded-full bg-primary/20 blur-[60px]" />
          
          <FadeInUp>
            <div className="space-y-6 max-w-xl mx-auto">
              <h2 className="text-2xl font-bold text-white sm:text-4xl font-heading">Ready to scale your delivery pipelines?</h2>
              <p className="text-xs text-slate-400 leading-relaxed md:text-sm">
                Join engineering organizations building, testing, and monitoring deployments globally at speed.
              </p>
              
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <div className="relative w-full max-w-xs">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    type="email"
                    placeholder="Enter your work email"
                    className="h-10 pl-10 rounded-full border-white/10 bg-white/5 text-xs text-white placeholder:text-slate-500 focus-visible:ring-primary focus-visible:border-primary"
                  />
                </div>
                <Button size="lg" className="h-10 w-full rounded-full px-6 text-xs font-bold sm:w-auto hover:scale-105 transition-all">
                  Start Free Trial
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-slate-500">
                14-day free trial &middot; No credit card required &middot; Instant setup.
              </p>
            </div>
          </FadeInUp>
        </div>
      </section>
    </div>
  )
}
