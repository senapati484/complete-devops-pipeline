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
    cta: "Start Trial",
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
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  )
}

export default function PricingPage() {
  return (
    <div className="px-4 py-24">
      <div className="mx-auto max-w-7xl">
        <FadeInUp>
          <div className="text-center">
            <h1 className="text-4xl font-bold sm:text-5xl">Simple, transparent pricing</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your team. No hidden fees, no surprises.
            </p>
          </div>
        </FadeInUp>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {tiers.map((tier, i) => (
            <FadeInUp key={tier.name} delay={i * 0.15}>
              <Card
                className={cn(
                  "relative flex flex-col",
                  tier.highlighted && "border-primary shadow-lg shadow-primary/10 scale-105"
                )}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-sm text-muted-foreground">{tier.period}</span>
                  </div>
                  <CardDescription className="mt-2">{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature.text} className="flex items-center gap-3">
                        {feature.included ? (
                          <Check className="h-4 w-4 shrink-0 text-primary" />
                        ) : (
                          <X className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                        )}
                        <span
                          className={cn(
                            "text-sm",
                            feature.included ? "text-foreground" : "text-muted-foreground/40"
                          )}
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href={tier.href} className="w-full">
                    <Button
                      className="w-full"
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
