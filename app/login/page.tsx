'use client'

import { AuthShell } from '@/components/auth/auth-shell'
import { AuthField } from '@/components/auth/auth-field'
import Link from 'next/link'
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('http://127.0.0.1:8001/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to sign in')
      }

      const data = await response.json()
      // Save token in localStorage
      localStorage.setItem('token', data.access_token)
      
      // Redirect to the dashboard/projects
      router.push('/projects')
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Sign in"
      title="Welcome back."
      subtitle="Access your carbon and biodiversity projects and the geospatial data behind them."
      image="/images/landscape-broad.png"
      imageAlt="Aerial satellite view of a broad forested landscape"
      quote="Every environmental project starts with a place."
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={handleSubmit}
      >
        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@organization.earth"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
            >
              Password
            </label>
            <a
              href="#reset"
              className="text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              Forgot?
            </a>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
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

        <button
          type="submit"
          disabled={isLoading}
          className="group mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
          {!isLoading && <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />}
        </button>
      </form>

      <p className="mt-8 text-sm text-muted-foreground">
        New to Darukaa.Earth?{' '}
        <Link
          href="/signup"
          className="text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  )
}
