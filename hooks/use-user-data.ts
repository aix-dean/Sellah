"use client"

import { useState, useEffect, useCallback } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { doc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { loggedGetDoc } from "@/lib/firestore-logger"
import { useFirestoreQuery, firestoreCache } from "./use-firestore-cache"

interface UserData {
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
  emailVerified?: boolean
  company_id?: string
}

interface CompanyData {
  id?: string
  name?: string
  business_type?: string
  address?: {
    street?: string
    city?: string
    province?: string
    postal_code?: string
  }
  website?: string
  created_by?: string
  created_at?: any
  updated_at?: any
}

export function useUserData() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setAuthLoading(false)

      // Clear cache when user changes
      if (!user) {
        firestoreCache.invalidatePattern("user_.*")
        firestoreCache.invalidatePattern("company_.*")
      }
    })

    return () => unsubscribe()
  }, [])

  // Fetch user data with caching
  const {
    data: userData,
    loading: userLoading,
    error: userError,
    refetch: refetchUser,
  } = useFirestoreQuery<UserData | null>(
    `user_${currentUser?.uid}`,
    async () => {
      if (!currentUser) return null

      const userRef = doc(db, "iboard_users", currentUser.uid)
      const userSnap = await loggedGetDoc(userRef)

      if (!userSnap.exists()) {
        throw new Error("User profile not found")
      }

      return { uid: currentUser.uid, ...userSnap.data() } as UserData
    },
    { ttl: 10 * 60 * 1000 }, // 10 minutes cache
  )

  // Fetch company data with caching
  const {
    data: companyData,
    loading: companyLoading,
    error: companyError,
    refetch: refetchCompany,
  } = useFirestoreQuery<CompanyData | null>(
    `company_${userData?.company_id}`,
    async () => {
      if (!userData?.company_id) return null

      const companyRef = doc(db, "companies", userData.company_id)
      const companySnap = await loggedGetDoc(companyRef)

      if (!companySnap.exists()) {
        throw new Error("Company not found")
      }

      return { id: companySnap.id, ...companySnap.data() } as CompanyData
    },
    { ttl: 15 * 60 * 1000 }, // 15 minutes cache
  )

  const invalidateUserCache = useCallback(() => {
    firestoreCache.invalidate(`user_${currentUser?.uid}`)
    if (userData?.company_id) {
      firestoreCache.invalidate(`company_${userData.company_id}`)
    }
  }, [currentUser?.uid, userData?.company_id])

  return {
    currentUser,
    userData,
    companyData,
    loading: authLoading || userLoading || companyLoading,
    userLoading,
    companyLoading,
    authLoading,
    error: userError || companyError,
    refetchUser,
    refetchCompany,
    invalidateUserCache,
  }
}
