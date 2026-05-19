"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { login } from "@/lib/api/auth";
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setError("");
    startTransition(async () => {
      try {
        await login(email.trim(), password);
        router.push("/dashboard");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Login failed");
      }
    });
  }

  return (
    <div className="w-full max-w-[360px]">
      {/* Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Top accent bar */}
        <div
          className="h-1 w-full"
          style={{ background: "linear-gradient(90deg, #0D2542 0%, #444882 50%, #00ACD3 100%)" }}
        />

        <div className="px-7 pt-8 pb-7">
          {/* Logo + badge */}
          <div className="flex flex-col items-center mb-7">
            <Image
              src="/abjad-logo.png"
              alt="Abjad"
              width={80}
              height={80}
              className="object-contain mb-3"
              priority
            />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500 tracking-wide uppercase">
              <Shield className="h-3 w-3" />
              Admin Console
            </span>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Sign in</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your admin credentials to access the console
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="email"
                  placeholder="admin@abjad.com.sa"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10 text-sm bg-slate-50 border-slate-200 rounded-xl focus:border-[#0D2542] focus:ring-[#0D2542]"
                  required
                  autoFocus
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-10 text-sm bg-slate-50 border-slate-200 rounded-xl focus:border-[#0D2542] focus:ring-[#0D2542]"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-10 text-sm font-semibold text-white border-0 rounded-xl mt-1 shadow-sm"
              style={{ background: "linear-gradient(135deg, #0D2542 0%, #1a3d6b 100%)" }}
              disabled={isPending || !email || !password}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-slate-400 mt-5">
        Abjad Platform · Admin Access Only
      </p>
    </div>
  );
}
