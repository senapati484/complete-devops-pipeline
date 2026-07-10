"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, Phone, MapPin, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/toast-provider"

const contactInfo = [
  {
    icon: Mail,
    label: "Email",
    value: "hello@devopscontrolcenter.com",
    href: "mailto:hello@devopscontrolcenter.com",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+1 (555) 123-4567",
    href: "tel:+15551234567",
  },
  {
    icon: MapPin,
    label: "Office",
    value: "123 Tech Street, San Francisco, CA 94105",
    href: "#",
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

export default function ContactPage() {
  const { toast } = useToast()
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" })
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    await new Promise((r) => setTimeout(r, 1000))
    toast({ title: "Message sent!", description: "We'll get back to you soon.", variant: "success" })
    setFormData({ name: "", email: "", subject: "", message: "" })
    setSending(false)
  }

  return (
    <div className="px-4 py-28 grid-bg min-h-screen relative overflow-hidden">
      {/* Glow overlays */}
      <div className="absolute top-[10%] left-[10%] -z-10 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px]" />
      <div className="absolute bottom-[10%] right-[10%] -z-10 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[100px]" />

      <div className="mx-auto max-w-7xl">
        <FadeInUp>
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              Contact Us
            </div>
            <h1 className="text-4xl font-extrabold sm:text-5xl tracking-tight">Get in Touch</h1>
            <p className="text-xs text-muted-foreground leading-relaxed md:text-sm">
              Have a question, feedback, or want to discuss enterprise integrations? Contact our DevOps team.
            </p>
          </div>
        </FadeInUp>

        <div className="mt-20 grid gap-12 lg:grid-cols-2 items-start">
          {/* Form */}
          <FadeInUp delay={0.1}>
            <Card className="border-border/40 bg-card/35 backdrop-blur-md shadow-lg">
              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-semibold">Name</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="glass-input h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="glass-input h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="subject" className="text-xs font-semibold">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="How can we help?"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                      className="glass-input h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="text-xs font-semibold">Message</Label>
                    <textarea
                      id="message"
                      rows={5}
                      className="flex w-full rounded-lg border border-border/40 bg-background/50 glass-input px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Tell us more about your infrastructure requirements..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full rounded-full text-xs font-bold h-10" disabled={sending}>
                    {sending ? (
                      "Sending..."
                    ) : (
                      <>
                        Send Message
                        <Send className="ml-1.5 h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </FadeInUp>

          {/* Contact Info */}
          <FadeInUp delay={0.2}>
            <div className="space-y-6">
              {contactInfo.map((info) => {
                const Icon = info.icon
                return (
                  <a
                    key={info.label}
                    href={info.href}
                    className="flex items-start gap-4 rounded-2xl border border-border/40 bg-card/35 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20 group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary border border-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm tracking-tight">{info.label}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{info.value}</p>
                    </div>
                  </a>
                )
              })}
            </div>
          </FadeInUp>
        </div>
      </div>
    </div>
  )
}
