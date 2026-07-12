"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";

export function LoginForm() {
  const [error, formAction, pending] = useActionState(login, undefined);

  return (
    <form action={formAction} className="space-y-6 mt-4" suppressHydrationWarning>
      {error && (
        <div className="bg-red-100 text-[#ef4444] p-4 rounded-xl text-[0.95rem] font-bold border border-[#ef4444]/30 shadow-sm">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <label htmlFor="email" className="block text-[0.95rem] font-bold text-[#111827]">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="manager@transitops.in"
          autoComplete="email"
          required
          className="w-full px-4 py-3.5 rounded-xl border-2 border-transparent bg-[#fef9c3] text-[#111827] placeholder:text-slate-500 font-medium focus:outline-none focus:border-[#ef4444] focus:ring-4 focus:ring-[#ef4444]/20 transition-all shadow-sm"
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="password" className="block text-[0.95rem] font-bold text-[#111827]">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••••"
          autoComplete="current-password"
          required
          className="w-full px-4 py-3.5 rounded-xl border-2 border-transparent bg-[#fef9c3] text-[#111827] placeholder:text-slate-500 font-medium focus:outline-none focus:border-[#ef4444] focus:ring-4 focus:ring-[#ef4444]/20 transition-all shadow-sm"
        />
      </div>
      
      <div className="flex items-center justify-between pt-2">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#ef4444] focus:ring-[#ef4444]" />
          <span className="text-[0.95rem] font-bold text-[#111827]">Remember me</span>
        </label>
        <a href="#" className="text-[0.95rem] font-bold text-[#111827] hover:text-[#ef4444] transition-colors">Forgot password?</a>
      </div>
      
      <button 
        type="submit" 
        disabled={pending}
        className="w-full bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold py-4 rounded-xl transition-all disabled:opacity-70 mt-6 text-[1rem] tracking-wide shadow-[0_4px_14px_0_rgba(239,68,68,0.39)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.23)] hover:-translate-y-[1px]"
      >
        {pending ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
