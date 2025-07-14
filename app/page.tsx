"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Loader2 } from "lucide-react"
import LobbyPage from "@/components/lobby-page"

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)

      // If user is logged in, redirect to dashboard
      if (currentUser) {
        window.location.href = "/dashboard/products"
      }
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    )
  }

  // Show lobby page only for non-authenticated users
  return <LobbyPage />
}
