"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { PageVisibilityDetector } from "./page-visibility-detector"
import { wasLoggedOut } from "@/lib/auth"

interface ProtectedPageWrapperProps {
  children: React.ReactNode
}

export function ProtectedPageWrapper({ children }: ProtectedPageWrapperProps) {
  const router = useRouter()

  useEffect(() => {
    // Set cache control headers
    document.cookie = "cache-control=no-store, no-cache, must-revalidate; path=/;"
    document.cookie = "pragma=no-cache; path=/;"
    document.cookie = "expires=0; path=/;"

    // Check if user was logged out
    if (wasLoggedOut()) {
      console.log("Protected page accessed after logout, redirecting to login")
      router.push("/login?prevented=true")
    }

    // Handle back/forward navigation
    const handlePopState = () => {
      if (wasLoggedOut()) {
        console.log("History navigation detected after logout, redirecting to login")
        router.push("/login?prevented=true")
      }
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [router])

  return (
    <>
      <PageVisibilityDetector />
      {children}
    </>
  )
}
