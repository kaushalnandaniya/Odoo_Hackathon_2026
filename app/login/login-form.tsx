"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";
import { motion, Variants } from "framer-motion";
import { Loader2, Mail, Lock } from "lucide-react";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export function LoginForm() {
  const [error, formAction, pending] = useActionState(login, undefined);

  return (
    <motion.form 
      action={formAction} 
      className="space-y-6 mt-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      suppressHydrationWarning
    >
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10, scale: 0.95 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          className="bg-destructive/10 text-destructive p-4 rounded-xl text-[0.95rem] font-medium border border-destructive/20 shadow-sm flex items-center gap-3"
        >
          <div className="w-1 h-8 bg-destructive rounded-full" />
          {error}
        </motion.div>
      )}
      
      <motion.div variants={itemVariants} className="space-y-2 relative group" suppressHydrationWarning>
        <label htmlFor="email" className="block text-sm font-semibold text-foreground/80 ml-1">Email Address</label>
        <div className="relative" suppressHydrationWarning>
          <Mail className="absolute z-10 left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            id="email"
            name="email"
            type="email"
            placeholder="manager@transitops.in"
            autoComplete="email"
            maxLength={255}
            required
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-border/50 bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all shadow-sm"
          />
        </div>
      </motion.div>
      
      <motion.div variants={itemVariants} className="space-y-2 relative group" suppressHydrationWarning>
        <label htmlFor="password" className="block text-sm font-semibold text-foreground/80 ml-1">Password</label>
        <div className="relative" suppressHydrationWarning>
          <Lock className="absolute z-10 left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••••"
            autoComplete="current-password"
            required
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-border/50 bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all shadow-sm"
          />
        </div>
      </motion.div>
      
      <motion.div variants={itemVariants} className="flex items-center justify-between pt-2 px-1">
        <label className="flex items-center space-x-3 cursor-pointer group">
          <div className="relative flex items-center justify-center">
            <input type="checkbox" className="peer w-5 h-5 rounded-md border-2 border-border text-primary focus:ring-primary focus:ring-offset-background appearance-none checked:bg-primary checked:border-primary transition-all cursor-pointer" />
            <svg className="absolute w-3 h-3 text-primary-foreground opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">Remember me</span>
        </label>
        <a href="#" className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">Forgot password?</a>
      </motion.div>
      
      <motion.button 
        variants={itemVariants}
        whileHover={{ scale: 1.01, translateY: -2 }}
        whileTap={{ scale: 0.98 }}
        type="submit" 
        disabled={pending}
        className="relative overflow-hidden w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-2xl transition-all disabled:opacity-70 mt-8 text-[1rem] tracking-wide shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 flex items-center justify-center gap-2"
      >
        {pending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </motion.button>
    </motion.form>
  );
}
