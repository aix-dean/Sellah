"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { Loader2 } from "lucide-react"
import LobbyPage from "@/components/lobby-page"

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  // Function to get user's IP address and location
  const getUserLocationData = async () => {
    try {
      const response = await fetch("https://ipapi.co/json/")
      const data = await response.json()
      return {
        ip_address: data.ip || "127.0.0.1",
        geopoint: [Number.parseFloat(data.latitude) || 14.5973113, Number.parseFloat(data.longitude) || 120.9969413],
      }
    } catch (error) {
      console.log("Could not get location data, using defaults")
      return {
        ip_address: "127.0.0.1",
        geopoint: [14.5973113, 120.9969413],
      }
    }
  }

  // Function to create analytics document
  const createAnalyticsDocument = async (currentUser) => {
    try {
      const locationData = await getUserLocationData()

      const analyticsData = {
        action: "page_view",
        created: serverTimestamp(),
        geopoint: locationData.geopoint,
        ip_address: locationData.ip_address,
        isGuest: !currentUser,
        page: "Home",
        platform: "WEB",
        tags: [
          {
            action: "page_view",
            isGuest: !currentUser,
            page: "Home",
            platform: "WEB",
            section: "homepage",
          },
        ],
        uid: currentUser?.uid || "",
      }

      await addDoc(collection(db, "analytics_sellah"), analyticsData)
      console.log("Analytics document created successfully")
    } catch (error) {
      console.error("Error creating analytics document:", error)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      setLoading(false)

      // Create analytics document on page load
      await createAnalyticsDocument(currentUser)

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
