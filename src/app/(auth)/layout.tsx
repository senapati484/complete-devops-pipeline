export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 grid-bg relative overflow-hidden bg-background/50">
      {/* Glow backgrounds */}
      <div className="absolute top-[20%] left-[20%] -z-10 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[80px]" />
      <div className="absolute bottom-[20%] right-[20%] -z-10 h-[400px] w-[400px] rounded-full bg-indigo-500/5 blur-[80px]" />
      
      <div className="w-full max-w-md relative">
        {/* Glow behind card */}
        <div className="absolute inset-[-6px] -z-10 rounded-2xl bg-gradient-to-tr from-primary/5 to-indigo-500/5 blur-lg" />
        {children}
      </div>
    </div>
  )
}
