"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { wasLoggedOut, clearLogoutFlags } from "@/lib/auth"

const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/about"]

export default function BackNavigationGuard() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Clear logout flags for public routes
    if (PUBLIC_ROUTES.includes(pathname)) {
      clearLogoutFlags()
      return
    }

    // Only guard protected routes
    const handlePopState = () => {
      if (wasLoggedOut()) {
        router.push("/login?session=expired")
      }
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [router, pathname])

  return null
}
