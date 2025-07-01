"use client"

import { useState } from "react"
import { signOut, forceLogout } from "@/lib/auth"

interface UseLogoutReturn {
  logout: () => Promise<void>
  forceLogoutUser: () => Promise<void>
  isLoggingOut: boolean
  logoutError: string | null
}

export function useLogout(): UseLogoutReturn {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  const logout = async (): Promise<void> => {
    setIsLoggingOut(true)
    setLogoutError(null)

    try {
      await signOut()
      // The signOut function now handles redirection and history manipulation
    } catch (error: any) {
      console.error("Logout error:", error)
      setLogoutError(error.message || "Failed to logout")

      // Even if there's an error, try to redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/login?error=logout_failed"
      }

      throw error
    } finally {
      setIsLoggingOut(false)
    }
  }

  const forceLogoutUser = async (): Promise<void> => {
    setIsLoggingOut(true)
    setLogoutError(null)

    try {
      await forceLogout()
      // The forceLogout function now handles redirection and history manipulation
    } catch (error: any) {
      console.error("Force logout error:", error)
      setLogoutError(error.message || "Failed to force logout")
      // Don't throw error for force logout - always redirect
    } finally {
      setIsLoggingOut(false)
    }
  }

  return {
    logout,
    forceLogoutUser,
    isLoggingOut,
    logoutError,
  }
}
