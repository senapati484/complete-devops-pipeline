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
      transition={{ duration: 0.5, delay }}
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
    // Simulate sending
    await new Promise((r) => setTimeout(r, 1000))
    toast({ title: "Message sent!", description: "We'll get back to you soon.", variant: "success" })
    setFormData({ name: "", email: "", subject: "", message: "" })
    setSending(false)
  }

  return (
    <div className="px-4 py-24">
      <div className="mx-auto max-w-7xl">
        <FadeInUp>
          <div className="text-center">
            <h1 className="text-4xl font-bold sm:text-5xl">Get in Touch</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Have a question, feedback, or want to learn more? We&apos;d love to hear from you.
            </p>
          </div>
        </FadeInUp>

        <div className="mt-16 grid gap-12 lg:grid-cols-2">
          {/* Form */}
          <FadeInUp delay={0.1}>
            <Card>
              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="How can we help?"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <textarea
                      id="message"
                      rows={5}
                      className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Tell us more..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={sending}>
                    {sending ? (
                      "Sending..."
                    ) : (
                      <>
                        Send Message
                        <Send className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </FadeInUp>

          {/* Contact Info */}
          <FadeInUp delay={0.2}>
            <div className="space-y-8">
              {contactInfo.map((info) => {
                const Icon = info.icon
                return (
                  <a
                    key={info.label}
                    href={info.href}
                    className="flex items-start gap-4 rounded-lg border bg-card p-6 transition-shadow hover:shadow-md"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{info.label}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{info.value}</p>
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
