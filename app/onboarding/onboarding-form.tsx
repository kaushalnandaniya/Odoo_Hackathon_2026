"use client";

import { useActionState, useEffect } from "react";
import { completeDriverOnboarding } from "@/lib/actions/drivers";
import { motion, Variants } from "framer-motion";
import { Loader2, User, IdCard, Calendar, Phone, Truck } from "lucide-react";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export function OnboardingForm({ initialName }: { initialName: string }) {
  const [state, formAction, pending] = useActionState(completeDriverOnboarding, undefined);

  return (
    <motion.form 
      action={formAction} 
      className="space-y-6 mt-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      suppressHydrationWarning
    >
      {state?.error && (
        <motion.div 
          initial={{ opacity: 0, y: -10, scale: 0.95 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          className="bg-destructive/10 text-destructive p-4 rounded-xl text-[0.95rem] font-medium border border-destructive/20 shadow-sm flex items-center gap-3"
        >
          <div className="w-1 h-8 bg-destructive rounded-full" />
          {state.error}
        </motion.div>
      )}

      {/* Name Input (Read Only) */}
      <motion.div variants={itemVariants} className="space-y-2 relative group" suppressHydrationWarning>
        <label htmlFor="name" className="block text-sm font-semibold text-foreground/80 ml-1">Full Name</label>
        <div className="relative" suppressHydrationWarning>
          <User className="absolute z-10 left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors" />
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={initialName}
            readOnly
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-border/50 bg-muted/50 text-muted-foreground font-medium focus:outline-none cursor-not-allowed"
          />
        </div>
      </motion.div>
      
      {/* License Number */}
      <motion.div variants={itemVariants} className="space-y-2 relative group" suppressHydrationWarning>
        <label htmlFor="licenseNumber" className="block text-sm font-semibold text-foreground/80 ml-1">License Number</label>
        <div className="relative" suppressHydrationWarning>
          <IdCard className="absolute z-10 left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            id="licenseNumber"
            name="licenseNumber"
            type="text"
            placeholder="MH-0220150054321"
            required
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-border/50 bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all shadow-sm uppercase"
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {/* License Category */}
        <motion.div variants={itemVariants} className="space-y-2 relative group" suppressHydrationWarning>
          <label htmlFor="licenseCategory" className="block text-sm font-semibold text-foreground/80 ml-1">Category</label>
          <div className="relative" suppressHydrationWarning>
            <Truck className="absolute z-10 left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <select
              id="licenseCategory"
              name="licenseCategory"
              required
              defaultValue=""
              className="w-full pl-12 pr-10 py-4 rounded-2xl border-2 border-border/50 bg-background/50 backdrop-blur-sm text-foreground font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all shadow-sm appearance-none"
            >
              <option value="" disabled>Select...</option>
              <option value="LMV">LMV (Light Motor Vehicle)</option>
              <option value="HMV">HMV (Heavy Motor Vehicle)</option>
              <option value="2W">Two-Wheeler</option>
              <option value="COMMERCIAL">Commercial</option>
            </select>
            {/* Custom dropdown arrow since appearance is none */}
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground">
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </motion.div>

        {/* Expiry Date */}
        <motion.div variants={itemVariants} className="space-y-2 relative group" suppressHydrationWarning>
          <label htmlFor="licenseExpiryDate" className="block text-sm font-semibold text-foreground/80 ml-1">Expiry Date</label>
          <div className="relative" suppressHydrationWarning>
            <Calendar className="absolute z-10 left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              id="licenseExpiryDate"
              name="licenseExpiryDate"
              type="date"
              required
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-border/50 bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all shadow-sm"
            />
          </div>
        </motion.div>
      </div>

      {/* Contact Number */}
      <motion.div variants={itemVariants} className="space-y-2 relative group" suppressHydrationWarning>
        <label htmlFor="contactNumber" className="block text-sm font-semibold text-foreground/80 ml-1">Contact Number</label>
        <div className="relative" suppressHydrationWarning>
          <Phone className="absolute z-10 left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            id="contactNumber"
            name="contactNumber"
            type="tel"
            placeholder="+91 98200 33333"
            required
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-border/50 bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all shadow-sm"
          />
        </div>
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
            Saving Profile...
          </>
        ) : (
          "Complete Onboarding"
        )}
      </motion.button>
    </motion.form>
  );
}
