"use client";

import { useActionState } from "react";
import { register } from "@/lib/actions/auth";

export function SignupForm() {
  const [error, formAction, pending] = useActionState(register, undefined);

  return (
    <form action={formAction} className="space-y-6 mt-4">
      {error && error.startsWith("SUCCESS:") ? (
        <div className="bg-emerald-100 text-emerald-700 p-4 rounded-xl text-[0.95rem] font-bold border border-emerald-500/30 shadow-sm">
          {error.replace("SUCCESS: ", "")}
        </div>
      ) : error ? (
        <div className="bg-red-100 text-[#ef4444] p-4 rounded-xl text-[0.95rem] font-bold border border-[#ef4444]/30 shadow-sm">
          {error}
        </div>
      ) : null}
      
      <div className="space-y-2">
        <label htmlFor="name" className="block text-[0.95rem] font-bold text-[#111827]">Full Name</label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Jane Doe"
          autoComplete="name"
          required
          className="w-full px-4 py-3.5 rounded-xl border-2 border-transparent bg-[#fef9c3] text-[#111827] placeholder:text-slate-500 font-medium focus:outline-none focus:border-[#ef4444] focus:ring-4 focus:ring-[#ef4444]/20 transition-all shadow-sm"
        />
      </div>

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
          placeholder="Create a strong password"
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full px-4 py-3.5 rounded-xl border-2 border-transparent bg-[#fef9c3] text-[#111827] placeholder:text-slate-500 font-medium focus:outline-none focus:border-[#ef4444] focus:ring-4 focus:ring-[#ef4444]/20 transition-all shadow-sm"
        />
      </div>
      
      <button 
        type="submit" 
        disabled={pending}
        className="w-full bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold py-4 rounded-xl transition-all disabled:opacity-70 mt-8 text-[1rem] tracking-wide shadow-[0_4px_14px_0_rgba(239,68,68,0.39)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.23)] hover:-translate-y-[1px]"
      >
        {pending ? "Creating account..." : "Sign Up"}
      </button>
    </form>
  );
}
