import Image from "next/image";
import Link from "next/link";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-[#f8f9fa]">
      {/* Left: form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold tracking-tight text-[#111827] mb-1 uppercase">TRANSITOPS</h1>
          <p className="mb-12 text-[0.95rem] text-slate-500 font-medium">
            Smart Transport Operations Platform
          </p>
          
          <h2 className="text-[1.8rem] font-bold tracking-wide uppercase mb-2 text-[#111827]">
            Create an account
          </h2>
          <p className="mb-8 text-[1rem] text-slate-500 font-medium">
            Join the network. Enter your details below.
          </p>
          
          <SignupForm />
          
          <div className="mt-8 text-center text-[0.95rem] text-slate-500 font-medium">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-[#ef4444] hover:underline">
              Sign in instead!
            </Link>
          </div>
        </div>
      </div>
      {/* Right: illustration */}
      <div className="relative hidden items-center justify-center bg-[#e2e8f0] lg:flex border-l-[12px] border-[#111827]">
        <Image
          src="/illustration.png"
          alt="TransitOps illustration"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}
