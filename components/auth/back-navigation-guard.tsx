"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { wasLoggedOut } from "@/lib/auth"

export function BackNavigationGuard() {
  const router = useRouter()

  useEffect(() => {
    // Function to check auth status when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && wasLoggedOut()) {
        console.log("Detected back navigation after logout, redirecting to login")
        router.push("/login?prevented=true")
      }
    }

    // Function to handle popstate (back/forward navigation)
    const handlePopState = () => {
      if (wasLoggedOut()) {
        console.log("Detected history navigation after logout, redirecting to login")
        router.push("/login?prevented=true")
      }
    }

    // Set up cache control headers
    const setupCacheControl = () => {
      if (wasLoggedOut()) {
        // Set cache control headers
        document.cookie = "cache-control=no-store, no-cache, must-revalidate; path=/;"
        document.cookie = "pragma=no-cache; path=/;"
        document.cookie = "expires=0; path=/;"
      }
    }

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("popstate", handlePopState)

    // Initial check
    if (wasLoggedOut()) {
      console.log("Page loaded after logout, redirecting to login")
      router.push("/login?prevented=true")
    }

    setupCacheControl()

    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("popstate", handlePopState)
    }
  }, [router])

  // This component doesn't render anything
  return null
}
