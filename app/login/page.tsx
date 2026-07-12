import Image from "next/image";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-bold tracking-tight">TransitOps</h1>
          <p className="mb-8 text-sm text-muted-foreground">
            Smart Transport Operations Platform
          </p>
          <h2 className="mb-1 text-xl font-semibold">Sign in to your account</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Enter your credentials to continue. Your role is attached to your account.
          </p>
          <LoginForm />
        </div>
      </div>
      {/* Right: illustration (from the original design) */}
      <div className="relative hidden items-center justify-center bg-muted lg:flex">
        <Image
          src="/illustration.png"
          alt="TransitOps illustration"
          width={640}
          height={640}
          className="max-h-[70vh] w-auto object-contain"
          priority
        />
      </div>
    </div>
  );
}
