"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, Mail, CheckCircle } from "lucide-react"
import { resetPassword } from "@/lib/auth"

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await resetPassword(email)
      setSuccess(true)
    } catch (error: any) {
      let errorMessage = "Failed to send reset email"

      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No account found with this email address"
          break
        case "auth/invalid-email":
          errorMessage = "Invalid email address"
          break
        case "auth/too-many-requests":
          errorMessage = "Too many requests. Please try again later"
          break
        default:
          errorMessage = error.message || "Failed to send reset email"
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex">
        {/* Left side - Success Message */}
        <div className="flex-1 flex items-center justify-center bg-white p-4 md:p-8">
          <div className="w-full max-w-md px-4 md:px-0 text-center">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-green-600 mb-4">Email Sent!</h1>
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to <strong>{email}</strong>. Please check your email and follow the
                instructions to reset your password.
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Didn't receive the email? Check your spam folder or try again.
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => setSuccess(false)}
                variant="outline"
                className="w-full h-12 border-red-500 text-red-500 hover:bg-red-50"
              >
                Send Another Email
              </Button>
              <Button
                onClick={() => (window.location.href = "/login")}
                className="w-full h-12 bg-red-500 hover:bg-red-600 text-white"
              >
                Back to Login
              </Button>
            </div>
          </div>
        </div>

        {/* Right side - Sellah Branding */}
        <div className="hidden md:flex flex-1 bg-gradient-to-br from-orange-400 to-orange-500">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Login-Q1uRkQ6tX8FmAEN0XCpOshfCn9X6qw.png"
            alt="Sellah Logo"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Forgot Password Form */}
      <div className="flex-1 flex items-center justify-center bg-white p-4 md:p-8">
        <div className="w-full max-w-md px-4 md:px-0">
          <Button
            onClick={() => (window.location.href = "/login")}
            variant="ghost"
            className="mb-6 p-0 h-auto text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Login
          </Button>

          <div className="text-center mb-8">
            <Mail className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-red-500 mb-4">Forgot Password?</h1>
            <p className="text-gray-600">
              No worries! Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-gray-300 rounded-lg"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg"
              disabled={loading || !email}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600 mt-6">
            Remember your password?{" "}
            <a href="/login" className="text-red-500 hover:text-red-600 font-medium">
              Sign in
            </a>
          </div>
        </div>
      </div>

      {/* Right side - Sellah Branding */}
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-orange-400 to-orange-500">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Login-Q1uRkQ6tX8FmAEN0XCpOshfCn9X6qw.png"
          alt="Sellah Logo"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  )
}
