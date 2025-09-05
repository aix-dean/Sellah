"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Loader2,
  Eye,
  EyeOff,
  Users,
  Phone,
  Mail
} from "lucide-react"
import { ExclamationTriangleIcon } from "@radix-ui/react-icons"

import { signInWithEmail, wasLoggedOut, wasSessionExpired, getLogoutReason, clearLogoutFlags, sendEmailVerification } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const router = useRouter()

  const logoutReason = getLogoutReason()
  const loggedOut = wasLoggedOut()
  const sessionExpired = wasSessionExpired()

  useEffect(() => {
    if (loggedOut || sessionExpired) {
      clearLogoutFlags()
    }
  }, [loggedOut, sessionExpired])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await signInWithEmail(email, password)

      if (result.success) {
        router.push("/dashboard")
      } else {
        setError(result.error || "Login failed. Please try again.")
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side – Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-md">
          <div className="mb-4">
            <h1 className="text-3xl font-bold mt-2">Login to your Account</h1>
          </div>

          {loggedOut && logoutReason && (
            <Alert variant="default" className="mb-4 bg-blue-50 border-blue-200 text-blue-800">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Logged Out</AlertTitle>
              <AlertDescription>
                {sessionExpired
                  ? "Your session has expired due to inactivity. Please log in again."
                  : `You have been logged out: ${logoutReason.replace(/_/g, " ")}.`}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Login Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email:</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password:</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-1 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </Button>
              </div>
            </div>

            <div className="text-right text-sm">
              <Link href="/forgot-password" className="text-gray-600 hover:underline">
                Forgot Password?
              </Link>
            </div>

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>

          {/* Social login (icons are placeholders) */}
          {/*
          <div className="flex items-center justify-center space-x-4 mt-6">
            <Button variant="outline" className="rounded-full p-3">
              <Users className="h-5 w-5" />
            </Button>
            <Button variant="outline" className="rounded-full p-3">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="outline" className="rounded-full p-3">
              <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21.35 11.1H12v2.8h5.4c-.3 1.6-1.9 4.7-5.4 4.7a6.3 6.3 0 1 1 0-12.6c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.7 3.6 14.5 2.7 12 2.7a9.3 9.3 0 0 0 0 18.6c5.4 0 9-3.8 9-9 0-.6-.1-1.2-.2-1.8z" />
              </svg>
            </Button>
          </div>
          */}
          <div className="mt-6 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-red-600 font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Right side – Logo/Visual */}
      <div className="hidden md:flex w-1/2 bg-orange-500 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] bg-cover opacity-10" />
        <div className="z-10 text-center text-white">
          <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Login-Q1uRkQ6tX8FmAEN0XCpOshfCn9X6qw.png" alt="Sellah Logo" className="w-full min-h-screen object-cover" />
        </div>
      </div>
    </div>
  )
}
