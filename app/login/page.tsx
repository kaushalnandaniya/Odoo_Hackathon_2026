import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-background font-sans selection:bg-primary/20">

      {/* Left Panel: Immersive Branding & Animated Mesh */}
      <div className="relative hidden lg:flex flex-col items-start justify-between p-12 overflow-hidden bg-zinc-950 text-white">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/40 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/30 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
        </div>

        {/* Top Content */}
        <div className="relative z-10 w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-white"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight">TransitOps</span>
              <p className="text-[10px] font-medium text-zinc-500 tracking-wider uppercase">Fleet Platform</p>
            </div>
          </div>
        </div>

        {/* Center Content */}
        <div className="relative z-10 max-w-lg mt-auto mb-auto">
          <h1 className="text-5xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Intelligent fleet operations, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">simplified.</span>
          </h1>
          <p className="text-lg text-zinc-400 font-medium leading-relaxed">
            Manage your vehicles, track expenses, and oversee driver assignments in real-time. Join the future of transit operations today.
          </p>
        </div>

        {/* Bottom Content */}
        <div className="relative z-10 w-full border-t border-white/10 pt-8 flex items-center justify-between text-sm text-zinc-500 font-medium">
          <p>© 2026 TransitOps. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel: Glassmorphic Form */}
      <div className="relative flex items-center justify-center p-8 sm:p-12 lg:p-16">
        {/* Subtle background glow for right side */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-white"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight">TransitOps</span>
              <p className="text-[10px] font-medium text-muted-foreground tracking-wider uppercase">Fleet Platform</p>
            </div>
          </div>

          <div className="space-y-2 mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Welcome back
            </h2>
            <p className="text-muted-foreground font-medium text-[1.05rem]">
              Sign in to your account to continue
            </p>
          </div>

          <LoginForm />

          <div className="mt-10 text-center text-sm font-medium text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary hover:text-primary/80 font-bold transition-colors">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline Badge component to avoid creating a new file just for a badge in the layout
function Badge({ children, className, variant = "default" }: { children: React.ReactNode, className?: string, variant?: "default" | "outline" }) {
  return (
    <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variant === "outline" ? "border border-input" : "bg-primary text-primary-foreground hover:bg-primary/80"} ${className}`}>
      {children}
    </div>
  )
}
