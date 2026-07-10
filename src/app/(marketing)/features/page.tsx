"use client"

import { motion } from "framer-motion"
import {
  Activity,
  Rocket,
  GitBranch,
  Container,
  Users,
  Shield,
  Bell,
  BarChart3,
  Lock,
  Cloud,
  Zap,
  RefreshCw,
  CheckCircle2
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: Activity,
    title: "Real-time Monitoring",
    description: "Monitor server health, application performance, and deployment status in real time. Custom dashboards with live metrics, logs, and alerts keep you informed of everything happening in your infrastructure.",
    details: ["Live server metrics dashboard", "Custom alert thresholds", "Historical data & trends", "WebSocket-powered real-time updates"],
  },
  {
    icon: Rocket,
    title: "Automated Deployments",
    description: "Deploy to any environment with one click or set up fully automated pipelines. Roll back instantly if something goes wrong, with zero-downtime deployments built in.",
    details: ["One-click deployments", "Automated rollback", "Zero-downtime deploys", "Environment promotion"],
  },
  {
    icon: GitBranch,
    title: "Pipeline Management",
    description: "Design complex CI/CD pipelines with an intuitive visual editor. Chain together build, test, and deploy stages with conditional logic and parallel execution.",
    details: ["Visual pipeline editor", "Parallel stage execution", "Conditional triggers", "Integration with GitHub/GitLab"],
  },
  {
    icon: Container,
    title: "Docker Integration",
    description: "Seamless Docker workflow from build to deploy. Integrated container registry, automatic image builds on push, and one-click container deployment.",
    details: ["Built-in container registry", "Auto image builds", "Multi-architecture support", "Container health checks"],
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Invite your whole team with granular role-based permissions. Share dashboards, collaborate on deployments, and get notified of important events.",
    details: ["Role-based access control", "Team dashboards", "Real-time notifications", "Audit trails"],
  },
  {
    icon: Shield,
    title: "Security & Compliance",
    description: "Enterprise-grade security with end-to-end encryption, SOC 2 compliance, and comprehensive audit logging. Your data is protected at rest and in transit.",
    details: ["SOC 2 compliant", "End-to-end encryption", "Audit logging", "SSO & SAML support"],
  },
  {
    icon: Bell,
    title: "Smart Alerting",
    description: "Get notified of critical events through Slack, email, PagerDuty, or webhooks. Configure intelligent alerting rules to reduce noise.",
    details: ["Multi-channel alerts", "Intelligent noise reduction", "On-call scheduling", "Escalation policies"],
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Gain insights into your deployment frequency, success rates, and team velocity. Make data-driven decisions with detailed reports and exportable metrics.",
    details: ["Deployment frequency trends", "Success rate analytics", "Team velocity metrics", "CSV/PDF export"],
  },
  {
    icon: Lock,
    title: "Secrets Management",
    description: "Store and manage API keys, passwords, and certificates securely. Integrate with HashiCorp Vault and AWS Secrets Manager.",
    details: ["Encrypted secret storage", "Vault integration", "Automatic rotation", "Access logging"],
  },
  {
    icon: Cloud,
    title: "Multi-Cloud Support",
    description: "Deploy to AWS, Azure, GCP, or your own infrastructure from a single interface. Unified management across all your cloud providers.",
    details: ["AWS, Azure, GCP support", "Hybrid cloud deployments", "Unified dashboard", "Cross-cloud monitoring"],
  },
  {
    icon: Zap,
    title: "Performance Optimization",
    description: "Identify bottlenecks and optimize your deployment pipeline with built-in performance analysis and recommendations.",
    details: ["Pipeline performance insights", "Build time optimization", "Resource usage analysis", "Cost optimization tips"],
  },
  {
    icon: RefreshCw,
    title: "Automated Workflows",
    description: "Create automated workflows that trigger on events like pushes, PRs, or schedules. Reduce manual work and deploy with confidence.",
    details: ["Event-driven workflows", "Schedule-based triggers", "Approval gates", "Webhook integrations"],
  },
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

export default function FeaturesPage() {
  return (
    <div className="px-4 py-28 grid-bg relative min-h-screen">
      <div className="absolute top-[10%] left-[-10%] -z-10 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[80px]" />
      <div className="absolute bottom-[20%] right-[-10%] -z-10 h-[400px] w-[400px] rounded-full bg-indigo-500/5 blur-[80px]" />

      <div className="mx-auto max-w-7xl">
        <FadeInUp>
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1 bg-primary/5 border border-primary/15 rounded-full px-3 py-1 text-xs font-semibold text-primary">
              Feature Deep Dive
            </div>
            <h1 className="text-4xl font-extrabold sm:text-5xl tracking-tight leading-none">
              Explore Our Capabilities
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed md:text-sm">
              Everything you need to orchestrate complex cloud infrastructure, secure environment secrets, and deploy with confidence.
            </p>
          </div>
        </FadeInUp>

        <div className="mt-24 space-y-28">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <FadeInUp key={feature.title} delay={0.1}>
                <div className={`flex flex-col gap-12 lg:flex-row items-center ${i % 2 === 1 ? "lg:flex-row-reverse" : ""}`}>
                  <div className="flex-1 space-y-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 text-primary border border-primary/20 shadow-sm animate-pulse-glow">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">{feature.title}</h2>
                    <p className="text-xs text-muted-foreground leading-relaxed md:text-sm">{feature.description}</p>
                    <ul className="grid gap-2 sm:grid-cols-2 pt-2">
                      {feature.details.map((detail) => (
                        <li key={detail} className="flex items-center gap-2 text-xs text-foreground/80">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex-1 w-full">
                    <Card className="border-border/40 bg-card/30 backdrop-blur-md overflow-hidden relative group">
                      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <CardContent className="flex h-64 items-center justify-center p-12 relative">
                        <Icon className="h-28 w-28 text-primary/10 transition-transform duration-300 group-hover:scale-110 group-hover:text-primary/20" />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </FadeInUp>
            )
          })}
        </div>
      </div>
    </div>
  )
}
