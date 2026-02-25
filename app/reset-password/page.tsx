"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <Image
              src="/images/QBOX_logo_upscaled.png"
              alt="THE Q-BOX PLAY LOUNGE"
              width={160}
              height={70}
              className="h-16 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-2xl p-8">
          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8 text-center">
                  <h2 className="text-2xl font-bold text-foreground">
                    Reset password
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Enter the email associated with your account and we will send
                    you a link to reset your password.
                  </p>
                </div>

                <form
                  className="flex flex-col gap-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSent(true);
                  }}
                >
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Email
                    </label>
                    <div className="relative">
                      <Mail
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="h-11 w-full rounded-lg border border-border bg-secondary/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-premium-orange flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-bold uppercase tracking-wider text-primary-foreground"
                  >
                    Send Reset Link
                    <ArrowRight size={16} />
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center py-4 text-center"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 size={32} className="text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  Check your email
                </h2>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  We sent a password reset link to{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-6 text-xs text-primary transition-colors hover:text-primary/80"
                >
                  Didn&apos;t receive an email? Resend
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back to login */}
          <div className="mt-6 flex justify-center">
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={14} />
              Back to login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
