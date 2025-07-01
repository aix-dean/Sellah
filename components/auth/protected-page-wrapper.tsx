"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { wasLoggedOut, clearLogoutFlags } from "@/lib/auth"

const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/about"]

interface ProtectedPageWrapperProps {
  children: React.ReactNode
}

export default function ProtectedPageWrapper({ children }: ProtectedPageWrapperProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // If it's a public route, clear logout flags and allow access
    if (PUBLIC_ROUTES.includes(pathname)) {
      clearLogoutFlags()
      setIsChecking(false)
      return
    }

    // For protected routes, check logout status
    if (wasLoggedOut()) {
      router.push("/login?session=expired")
      return
    }

    setIsChecking(false)
  }, [router, pathname])

  // Show loading for protected routes while checking
  if (isChecking && !PUBLIC_ROUTES.includes(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return <>{children}</>
}
