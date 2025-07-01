"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { wasLoggedOut } from "@/lib/auth"

interface PageVisibilityDetectorProps {
  onVisibilityChange?: (isVisible: boolean) => void
}

export function PageVisibilityDetector({ onVisibilityChange }: PageVisibilityDetectorProps) {
  const router = useRouter()

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden

      // Call the callback if provided
      if (onVisibilityChange) {
        onVisibilityChange(isVisible)
      }

      // If page becomes visible and user was logged out, redirect to login
      if (isVisible && wasLoggedOut()) {
        console.log("Page became visible after logout, redirecting to login")
        router.push("/login?prevented=true")
      }
    }

    // Add event listener
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Initial check
    if (wasLoggedOut()) {
      console.log("Page loaded after logout, redirecting to login")
      router.push("/login?prevented=true")
    }

    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [router, onVisibilityChange])

  // This component doesn't render anything
  return null
}
