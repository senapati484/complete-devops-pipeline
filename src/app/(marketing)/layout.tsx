import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16">{children}</main>
      <Footer />
    </>
  )
}
