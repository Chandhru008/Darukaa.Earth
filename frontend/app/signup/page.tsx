'use client'

import { AuthShell } from '@/components/auth/auth-shell'
import { AuthField } from '@/components/auth/auth-field'
import Link from 'next/link'
import { ArrowRight, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { API_BASE_URL } from '@/lib/api-config'

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: name,
          email: email,
          password: password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to register account')
      }

      setIsSuccess(true)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Is the backend running?')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <AuthShell
        eyebrow="Success"
        title="Account created."
        subtitle="You have successfully registered. You can now sign in to your account."
        image="/images/biodiversity-ecosystem.png"
        imageAlt="Biodiversity ecosystem with wildlife in a forested wetland"
        quote="Turn environmental data into environmental insight."
      >
        <div className="flex flex-col items-center justify-center space-y-6 py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-green-500/20">
            <CheckCircle2 className="size-8 text-green-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Welcome to Darukaa.Earth</h2>
            <p className="mt-2 text-sm text-muted-foreground">Your account has been securely stored in the PostgreSQL database.</p>
          </div>
          <Link
            href="/login"
            className="group mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:brightness-110"
          >
            Go to Login
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Create account"
      title="Start understanding the Earth."
      subtitle="Create an account to map project sites, connect environmental data, and track change over time."
      image="/images/biodiversity-ecosystem.png"
      imageAlt="Biodiversity ecosystem with wildlife in a forested wetland"
      quote="Turn environmental data into environmental insight."
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={handleSubmit}
      >
        <AuthField
          id="name"
          label="Full name"
          type="text"
          autoComplete="name"
          placeholder="Ada Lovelace"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <AuthField
          id="email"
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="you@organization.earth"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="flex flex-col gap-2">
          <label
            htmlFor="password"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-input bg-card/60 px-4 py-3 pr-11 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/70 focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
            {error}
          </div>
        )}

        <label className="flex items-start gap-3 text-xs leading-relaxed text-muted-foreground">
          <input
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-input bg-card/60 accent-primary"
          />
          <span>
            I agree to the{' '}
            <a
              href="#terms"
              className="text-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              Terms
            </a>{' '}
            and{' '}
            <a
              href="#privacy"
              className="text-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              Privacy Policy
            </a>
            .
          </span>
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="group mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
          {!isLoading && <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />}
        </button>
      </form>

      <p className="mt-8 text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
