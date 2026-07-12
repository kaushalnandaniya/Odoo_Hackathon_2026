import Link from "next/link";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-background font-sans selection:bg-primary/20" suppressHydrationWarning>
      
      {/* Left Panel: Immersive Branding & Animated Mesh */}
      <div className="relative hidden lg:flex flex-col items-start justify-between p-12 overflow-hidden bg-zinc-950 text-white">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/40 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/30 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
        </div>
        
        {/* Top Content */}
        <div className="relative z-10 w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v10c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
            </div>
            <span className="text-xl font-bold tracking-tight">TRANSITOPS</span>
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
          <div className="lg:hidden flex items-center gap-2 mb-12">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v10c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
            </div>
            <span className="text-2xl font-bold tracking-tight">TRANSITOPS</span>
          </div>

          <div className="space-y-2 mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Create an account
            </h2>
            <p className="text-muted-foreground font-medium text-[1.05rem]">
              Enter your details to get started
            </p>
          </div>
          
          <SignupForm />
          
          <div className="mt-10 text-center text-sm font-medium text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:text-primary/80 font-bold transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
