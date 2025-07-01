"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { wasLoggedOut, clearLogoutFlags } from "@/lib/auth"

const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/about"]

export default function PageVisibilityDetector() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Clear logout flags for public routes
    if (PUBLIC_ROUTES.includes(pathname)) {
      clearLogoutFlags()
      return
    }

    // Only monitor protected routes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && wasLoggedOut()) {
        router.push("/login?session=expired")
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [router, pathname])

  return null
}
