"use client"

import { motion } from "framer-motion"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Link from "next/link"

const tiers = [
  {
    name: "Starter",
    price: "$0",
    period: "/month",
    description: "Perfect for individual developers and small projects.",
    features: [
      { text: "Up to 3 projects", included: true },
      { text: "Basic monitoring", included: true },
      { text: "Manual deployments", included: true },
      { text: "Community support", included: true },
      { text: "Email notifications", included: true },
      { text: "Team collaboration", included: false },
      { text: "Advanced analytics", included: false },
      { text: "SSO & SAML", included: false },
      { text: "Priority support", included: false },
    ],
    cta: "Get Started Free",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "$29",
    period: "/month",
    description: "For growing teams that need advanced features.",
    features: [
      { text: "Unlimited projects", included: true },
      { text: "Advanced monitoring", included: true },
      { text: "Automated deploys", included: true },
      { text: "Priority support", included: true },
      { text: "Email & Slack alerts", included: true },
      { text: "Team collaboration", included: true },
      { text: "Advanced analytics", included: true },
      { text: "SSO & SAML", included: false },
      { text: "24/7 phone support", included: false },
    ],
    cta: "Start Free Trial",
    href: "/register",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "/month",
    description: "For large organizations with enterprise requirements.",
    features: [
      { text: "Unlimited projects", included: true },
      { text: "Enterprise monitoring", included: true },
      { text: "Automated deploys", included: true },
      { text: "24/7 phone support", included: true },
      { text: "All notification channels", included: true },
      { text: "Team collaboration", included: true },
      { text: "Advanced analytics", included: true },
      { text: "SSO & SAML", included: true },
      { text: "Dedicated account manager", included: true },
    ],
    cta: "Contact Sales",
    href: "/contact",
    highlighted: false,
  },
]

function FadeInUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="h-full"
    >
      {children}
    </motion.div>
  )
}

export default function PricingPage() {
  return (
    <div className="px-4 py-28 grid-bg min-h-screen relative overflow-hidden">
      {/* Decorative Glow Elements */}
      <div className="absolute top-[10%] left-[20%] -z-10 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px]" />
      <div className="absolute bottom-[10%] right-[10%] -z-10 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[100px]" />

      <div className="mx-auto max-w-7xl">
        <FadeInUp>
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              Pricing Options
            </div>
            <h1 className="text-4xl font-extrabold sm:text-5xl tracking-tight">Simple, Transparent Plans</h1>
            <p className="text-xs text-muted-foreground leading-relaxed md:text-sm">
              Choose the plan that fits your pipeline frequency. Cancel or change plans anytime.
            </p>
          </div>
        </FadeInUp>

        <div className="mt-20 grid gap-8 lg:grid-cols-3 items-stretch">
          {tiers.map((tier, i) => (
            <FadeInUp key={tier.name} delay={i * 0.15}>
              <Card
                className={cn(
                  "relative flex flex-col h-full border-border/40 bg-card/35 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
                  tier.highlighted && "border-primary bg-card/50 scale-[1.03] shadow-md shadow-primary/5 lg:z-10"
                )}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm">
                    Most Popular
                  </div>
                )}
                <CardHeader className="space-y-1">
                  <CardTitle className="text-lg font-bold font-heading">{tier.name}</CardTitle>
                  <div className="flex items-baseline gap-1 pt-2">
                    <span className="text-4xl font-extrabold tracking-tight">{tier.price}</span>
                    <span className="text-xs text-muted-foreground">{tier.period}</span>
                  </div>
                  <CardDescription className="text-xs pt-1.5 leading-relaxed">{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pt-4">
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature.text} className="flex items-center gap-3">
                        {feature.included ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                        ) : (
                          <X className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30" />
                        )}
                        <span
                          className={cn(
                            "text-xs",
                            feature.included ? "text-foreground" : "text-muted-foreground/30"
                          )}
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-6">
                  <Link href={tier.href} className="w-full">
                    <Button
                      className="w-full rounded-full text-xs font-bold"
                      variant={tier.highlighted ? "default" : "outline"}
                      size="lg"
                    >
                      {tier.cta}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </FadeInUp>
          ))}
        </div>
      </div>
    </div>
  )
}
