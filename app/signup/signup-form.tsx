"use client";

import { useActionState, useState, useEffect } from "react";
import { register, verifyOTP, resendOTP } from "@/lib/actions/auth";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { Loader2, User, Mail, Lock, KeyRound, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export function SignupForm() {
  const router = useRouter();
  const [registerResult, registerAction, registerPending] = useActionState(register, undefined);
  const [verifyResult, verifyAction, verifyPending] = useActionState(verifyOTP, undefined);
  
  const [step, setStep] = useState<1 | 2>(1);
  const [registeredEmail, setRegisteredEmail] = useState("");

  // Resend OTP State
  const [resendPending, setResendPending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (registerResult?.startsWith("REQUIRE_OTP:")) {
      setRegisteredEmail(registerResult.replace("REQUIRE_OTP:", ""));
      setStep(2);
      setCooldown(60); // Start 60s cooldown when entering Step 2
    }
  }, [registerResult]);

  useEffect(() => {
    if (verifyResult?.startsWith("SUCCESS:")) {
      const timer = setTimeout(() => {
        router.push("/login");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [verifyResult, router]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || resendPending) return;
    setResendPending(true);
    const formData = new FormData();
    formData.append("email", registeredEmail);
    const result = await resendOTP(formData);
    setResendMessage(result || "");
    setResendPending(false);
    if (result?.startsWith("SUCCESS:")) {
      setCooldown(60);
    }
  };

  return (
    <div className="mt-8">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.form 
            key="step1"
            action={registerAction} 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {registerResult && !registerResult.startsWith("REQUIRE_OTP:") && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                className="bg-destructive/10 text-destructive p-4 rounded-xl text-[0.95rem] font-medium border border-destructive/20 shadow-sm flex items-center gap-3"
              >
                <div className="w-1 h-8 bg-destructive rounded-full" />
                {registerResult}
              </motion.div>
            )}
            
            <motion.div variants={itemVariants} className="space-y-2 relative group">
              <label htmlFor="name" className="block text-sm font-semibold text-foreground/80 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute z-10 left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  autoComplete="name"
                  maxLength={100}
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-border/50 bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all shadow-sm"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2 relative group">
              <label htmlFor="email" className="block text-sm font-semibold text-foreground/80 ml-1">Email Address</label>
              <div className="relative">
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
            
            <motion.div variants={itemVariants} className="space-y-2 relative group">
              <label htmlFor="password" className="block text-sm font-semibold text-foreground/80 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute z-10 left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••••"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-border/50 bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all shadow-sm"
                />
              </div>
            </motion.div>
            
            <motion.button 
              variants={itemVariants}
              whileHover={{ scale: 1.01, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={registerPending}
              className="relative overflow-hidden w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-2xl transition-all disabled:opacity-70 mt-8 text-[1rem] tracking-wide shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 flex items-center justify-center gap-2"
            >
              {registerPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending Code...
                </>
              ) : (
                "Continue"
              )}
            </motion.button>
          </motion.form>
        )}

        {step === 2 && (
          <motion.form 
            key="step2"
            action={verifyAction} 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div variants={itemVariants} className="bg-primary/5 border border-primary/20 p-4 rounded-2xl text-sm text-foreground/80 mb-6">
              We sent a 6-digit verification code to <span className="font-bold text-foreground">{registeredEmail}</span>. Enter it below to secure your account.
            </motion.div>

            {resendMessage && resendMessage.startsWith("SUCCESS:") && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="bg-emerald-500/10 text-emerald-600 p-3 rounded-lg text-sm font-medium border border-emerald-500/20 shadow-sm"
              >
                {resendMessage.replace("SUCCESS: ", "")}
              </motion.div>
            )}

            {resendMessage && !resendMessage.startsWith("SUCCESS:") && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm font-medium border border-destructive/20 shadow-sm"
              >
                {resendMessage}
              </motion.div>
            )}

            {verifyResult && verifyResult.startsWith("SUCCESS:") ? (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                className="bg-emerald-500/10 text-emerald-600 p-4 rounded-xl text-[0.95rem] font-medium border border-emerald-500/20 shadow-sm flex flex-col items-center gap-2 text-center"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-1 h-8 bg-emerald-500 rounded-full" />
                  <span className="flex-1 text-left">{verifyResult.replace("SUCCESS: ", "")}</span>
                </div>
                <div className="text-sm mt-2 flex items-center gap-2 text-emerald-700 font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin" /> Redirecting to login...
                </div>
              </motion.div>
            ) : verifyResult ? (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                className="bg-destructive/10 text-destructive p-4 rounded-xl text-[0.95rem] font-medium border border-destructive/20 shadow-sm flex items-center gap-3"
              >
                <div className="w-1 h-8 bg-destructive rounded-full" />
                {verifyResult}
              </motion.div>
            ) : null}
            
            <input type="hidden" name="email" value={registeredEmail} />

            <motion.div variants={itemVariants} className="space-y-2 relative group">
              <label htmlFor="otp" className="block text-sm font-semibold text-foreground/80 ml-1">Verification Code</label>
              <div className="relative">
                <KeyRound className="absolute z-10 left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  placeholder="000000"
                  required
                  maxLength={6}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-border/50 bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground font-bold text-center tracking-[0.5em] text-lg focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all shadow-sm"
                />
              </div>
            </motion.div>
            
            <motion.button 
              variants={itemVariants}
              whileHover={verifyResult?.startsWith("SUCCESS:") ? {} : { scale: 1.01, translateY: -2 }}
              whileTap={verifyResult?.startsWith("SUCCESS:") ? {} : { scale: 0.98 }}
              type="submit" 
              disabled={verifyPending || verifyResult?.startsWith("SUCCESS:")}
              className="relative overflow-hidden w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-2xl transition-all disabled:opacity-70 mt-8 text-[1rem] tracking-wide shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 flex items-center justify-center gap-2"
            >
              {verifyPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : verifyResult?.startsWith("SUCCESS:") ? (
                "Verified!"
              ) : (
                "Complete Signup"
              )}
            </motion.button>
            
            {!verifyResult?.startsWith("SUCCESS:") && (
              <motion.div variants={itemVariants} className="flex flex-col items-center gap-2 mt-6">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || resendPending}
                  className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-50 disabled:hover:text-primary"
                >
                  {resendPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {cooldown > 0 ? `Resend Code in ${cooldown}s` : "Resend Verification Code"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mt-2"
                >
                  Change Email Address
                </button>
              </motion.div>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
