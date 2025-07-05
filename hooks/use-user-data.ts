"use client"

import { useState, useEffect, useCallback } from "react"
import { doc, onSnapshot, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase"

// User data interface matching the application structure
export interface UserData {
  uid: string
  email?: string
  phone_number?: string
  display_name?: string
  photo_url?: string
  first_name?: string
  middle_name?: string
  last_name?: string
  gender?: string
  about_me?: string
  license_key?: string
  active?: boolean
  onboarding?: boolean
  type?: string
  status?: "UNKNOWN" | "INCOMPLETE" | "VERIFIED"
  account_status?: "active" | "inactive"
  emailVerified?: boolean
  company_id?: string
  product_count?: number
  created_at?: any
  updated_at?: any
  last_login?: any
}

// Product limit information
export interface ProductLimitInfo {
  canAdd: boolean
  currentCount: number
  limit: number
  status: string
  message?: string
}

// Status information
export interface StatusInfo {
  label: string
  color: string
  description: string
}

export function useUserData() {
  const [user] = useAuthState(auth)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Refresh user data function
  const refreshUser = useCallback(async () => {
    if (!user) {
      setUserData(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const userDocRef = doc(db, "iboard_users", user.uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        const firestoreData = userDoc.data()
        const combinedData: UserData = {
          uid: user.uid,
          email: user.email || firestoreData.email,
          phone_number: user.phoneNumber || firestoreData.phone_number,
          display_name: user.displayName || firestoreData.display_name,
          photo_url: user.photoURL || firestoreData.photo_url,
          emailVerified: user.emailVerified,
          first_name: firestoreData.first_name || "",
          middle_name: firestoreData.middle_name || "",
          last_name: firestoreData.last_name || "",
          gender: firestoreData.gender || "",
          about_me: firestoreData.about_me || "",
          license_key: firestoreData.license_key || "",
          active: firestoreData.active !== false,
          onboarding: firestoreData.onboarding || false,
          type: firestoreData.type || "SELLAH",
          status: firestoreData.status || "UNKNOWN",
          account_status: firestoreData.account_status || "active",
          company_id: firestoreData.company_id || "",
          product_count: firestoreData.product_count || 0,
          created_at: firestoreData.created_at,
          updated_at: firestoreData.updated_at,
          last_login: firestoreData.last_login,
        }
        setUserData(combinedData)
      } else {
        // If no Firestore document exists, create basic user data from auth
        const basicUserData: UserData = {
          uid: user.uid,
          email: user.email || "",
          phone_number: user.phoneNumber || "",
          display_name: user.displayName || "",
          photo_url: user.photoURL || "",
          emailVerified: user.emailVerified,
          first_name: "",
          middle_name: "",
          last_name: "",
          status: "UNKNOWN",
          type: "SELLAH",
          active: true,
          onboarding: false,
          account_status: "active",
          product_count: 0,
        }
        setUserData(basicUserData)
      }
    } catch (err) {
      console.error("Error fetching user data:", err)
      setError("Failed to load user data")

      // Fallback to basic auth data
      if (user) {
        const fallbackData: UserData = {
          uid: user.uid,
          email: user.email || "",
          phone_number: user.phoneNumber || "",
          display_name: user.displayName || "",
          photo_url: user.photoURL || "",
          emailVerified: user.emailVerified,
          status: "UNKNOWN",
          type: "SELLAH",
          active: true,
          product_count: 0,
        }
        setUserData(fallbackData)
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  // Set up real-time listener for user data
  useEffect(() => {
    if (!user) {
      setUserData(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const userDocRef = doc(db, "iboard_users", user.uid)

    const unsubscribe = onSnapshot(
      userDocRef,
      (doc) => {
        try {
          if (doc.exists()) {
            const firestoreData = doc.data()
            const combinedData: UserData = {
              uid: user.uid,
              email: user.email || firestoreData.email,
              phone_number: user.phoneNumber || firestoreData.phone_number,
              display_name: user.displayName || firestoreData.display_name,
              photo_url: user.photoURL || firestoreData.photo_url,
              emailVerified: user.emailVerified,
              first_name: firestoreData.first_name || "",
              middle_name: firestoreData.middle_name || "",
              last_name: firestoreData.last_name || "",
              gender: firestoreData.gender || "",
              about_me: firestoreData.about_me || "",
              license_key: firestoreData.license_key || "",
              active: firestoreData.active !== false,
              onboarding: firestoreData.onboarding || false,
              type: firestoreData.type || "SELLAH",
              status: firestoreData.status || "UNKNOWN",
              account_status: firestoreData.account_status || "active",
              company_id: firestoreData.company_id || "",
              product_count: firestoreData.product_count || 0,
              created_at: firestoreData.created_at,
              updated_at: firestoreData.updated_at,
              last_login: firestoreData.last_login,
            }
            setUserData(combinedData)
          } else {
            // Create basic user data if document doesn't exist
            const basicUserData: UserData = {
              uid: user.uid,
              email: user.email || "",
              phone_number: user.phoneNumber || "",
              display_name: user.displayName || "",
              photo_url: user.photoURL || "",
              emailVerified: user.emailVerified,
              first_name: "",
              middle_name: "",
              last_name: "",
              status: "UNKNOWN",
              type: "SELLAH",
              active: true,
              onboarding: false,
              account_status: "active",
              product_count: 0,
            }
            setUserData(basicUserData)
          }
          setError(null)
        } catch (err) {
          console.error("Error processing user data:", err)
          setError("Failed to process user data")
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        console.error("Error listening to user data:", err)
        setError("Failed to load user data")
        setLoading(false)

        // Fallback to basic auth data
        if (user) {
          const fallbackData: UserData = {
            uid: user.uid,
            email: user.email || "",
            phone_number: user.phoneNumber || "",
            display_name: user.displayName || "",
            photo_url: user.photoURL || "",
            emailVerified: user.emailVerified,
            status: "UNKNOWN",
            type: "SELLAH",
            active: true,
            product_count: 0,
          }
          setUserData(fallbackData)
        }
      },
    )

    return () => unsubscribe()
  }, [user])

  return {
    currentUser: userData,
    userData,
    loading,
    error,
    refreshUser,
  }
}

// Helper function to get product limit based on user status
export function getUserProductLimit(status?: string): number {
  switch (status) {
    case "VERIFIED":
      return Number.POSITIVE_INFINITY // Unlimited
    case "INCOMPLETE":
      return 5
    case "UNKNOWN":
    default:
      return 1
  }
}

// Helper function to check if user can add more products
export function canUserAddProduct(userData: UserData | null): boolean {
  if (!userData) return false

  const limit = getUserProductLimit(userData.status)
  const currentCount = userData.product_count || 0

  return currentCount < limit
}

// Helper function to get status information
export function getUserStatusInfo(status?: string): StatusInfo {
  switch (status) {
    case "VERIFIED":
      return {
        label: "Verified",
        color: "green",
        description: "Account is fully verified with unlimited access",
      }
    case "INCOMPLETE":
      return {
        label: "Incomplete",
        color: "yellow",
        description: "Account setup is incomplete, limited access",
      }
    case "UNKNOWN":
    default:
      return {
        label: "Unknown",
        color: "red",
        description: "Account status unknown, very limited access",
      }
  }
}
