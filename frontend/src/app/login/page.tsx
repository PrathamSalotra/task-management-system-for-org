'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setFormError(result.error || 'Invalid email or password');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-sm font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle Aesthetic Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 text-xs font-semibold tracking-wider uppercase shadow-sm">
              Agile Workspace
            </span>
          </Link>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
            Welcome Back
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Sign in to access your enterprise task boards
          </p>
        </div>

        {/* Centered Surface Card */}
        <div className="p-8 sm:p-10 rounded-[20px] bg-surface border border-border-subtle shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-6 transition-all">
          {formError && (
            <div
              id="login-error-banner"
              className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm flex items-start gap-3 shadow-sm transition-all"
            >
              <span className="text-base leading-none">⚠️</span>
              <span className="font-medium leading-snug">{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full px-4 py-3.5 rounded-xl bg-surface-muted border border-border-subtle text-text-primary placeholder-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3.5 rounded-xl bg-surface-muted border border-border-subtle text-text-primary placeholder-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all text-sm"
              />
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-full bg-accent hover:bg-accent-hover text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-border-subtle text-center text-sm text-text-secondary">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-accent hover:text-accent-hover font-semibold transition-colors ml-1"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

