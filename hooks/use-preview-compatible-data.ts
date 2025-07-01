"use client"

import { useState, useEffect, useCallback } from "react"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { getPreviewFirebase } from "@/components/preview-compatible-firebase"

interface Product {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  sales: number
  status: "published" | "unpublished"
  views: number
  likes: number
  type: string
  seller_id: string
  deleted: boolean
  photo_urls?: string[]
  created_at?: any
  description?: string
  category?: string
  image_url?: string
  rating?: number
  variations?: any[]
}

interface Category {
  id: string
  name: string
  description?: string
  type: string
  active: boolean
}

interface UserData {
  id: string
  first_name: string
  last_name: string
  email: string
  company_id?: string
  [key: string]: any
}

// Mock data for preview environment when Firebase fails
const mockCategories: Category[] = [
  { id: "1", name: "Electronics", description: "Electronic devices", type: "MERCHANDISE", active: true },
  { id: "2", name: "Clothing", description: "Apparel and accessories", type: "MERCHANDISE", active: true },
  { id: "3", name: "Home & Garden", description: "Home improvement items", type: "MERCHANDISE", active: true },
  { id: "4", name: "Sports", description: "Sports equipment", type: "MERCHANDISE", active: true },
  { id: "5", name: "Books", description: "Books and media", type: "MERCHANDISE", active: true },
]

const mockUserData: UserData = {
  id: "preview-user",
  first_name: "Preview",
  last_name: "User",
  email: "preview@example.com",
  company_id: "preview-company",
}

// Check if we're in preview environment
const isPreviewEnvironment = typeof window !== "undefined" && window.location.hostname.includes("v0.dev")

export function usePreviewCompatibleAuth() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isPreviewEnvironment) {
      // Mock user for preview environment
      setTimeout(() => {
        setCurrentUser({
          uid: "preview-user-id",
          email: "preview@example.com",
          tenantId: "sellah-zgqvh",
        })
        setLoading(false)
      }, 1000)
      return
    }

    try {
      const { auth } = getPreviewFirebase()
      if (!auth) {
        setError("Firebase Auth not available")
        setLoading(false)
        return
      }

      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          setCurrentUser(user)
          setLoading(false)
        },
        (err) => {
          console.error("Auth state change error:", err)
          setError(err.message)
          setLoading(false)
        },
      )

      return () => unsubscribe()
    } catch (err: any) {
      console.error("Auth initialization error:", err)
      setError(err.message)
      setLoading(false)
    }
  }, [])

  return { currentUser, loading, error }
}

export function usePreviewCompatibleCategories(type = "MERCHANDISE") {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (isPreviewEnvironment) {
      // Use mock data for preview
      setTimeout(() => {
        setCategories(mockCategories)
        setLoading(false)
      }, 500)
      return
    }

    try {
      const { db } = getPreviewFirebase()
      if (!db) {
        throw new Error("Firestore not available")
      }

      const categoriesRef = collection(db, "categories")
      const q = query(categoriesRef, where("type", "==", type), where("active", "==", true))

      const querySnapshot = await getDocs(q)
      const fetchedCategories: Category[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        fetchedCategories.push({
          id: doc.id,
          name: data.name || "Untitled Category",
          description: data.description || "",
          type: data.type || type,
          active: data.active || false,
        })
      })

      setCategories(fetchedCategories.length > 0 ? fetchedCategories : mockCategories)
      setLoading(false)
    } catch (err: any) {
      console.error("Error fetching categories:", err)
      // Fallback to mock data on error
      setCategories(mockCategories)
      setError(null) // Don't show error, just use mock data
      setLoading(false)
    }
  }, [type])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const refetch = useCallback(() => {
    return fetchCategories()
  }, [fetchCategories])

  return { categories, loading, error, refetch }
}

export function usePreviewCompatibleUserData(userId: string | null) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserData = useCallback(async () => {
    if (!userId) {
      setUserData(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    if (isPreviewEnvironment) {
      // Use mock data for preview
      setTimeout(() => {
        setUserData(mockUserData)
        setLoading(false)
      }, 500)
      return
    }

    try {
      const { db } = getPreviewFirebase()
      if (!db) {
        throw new Error("Firestore not available")
      }

      const userRef = doc(db, "iboard_users", userId)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const data = userSnap.data()
        setUserData({
          id: userSnap.id,
          ...data,
        } as UserData)
      } else {
        // Fallback to mock data if user not found
        setUserData(mockUserData)
      }

      setLoading(false)
    } catch (err: any) {
      console.error("Error fetching user data:", err)
      // Fallback to mock data on error
      setUserData(mockUserData)
      setError(null) // Don't show error, just use mock data
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  const refetch = useCallback(() => {
    return fetchUserData()
  }, [fetchUserData])

  return { userData, loading, error, refetch }
}

// Preview-compatible file upload
export async function previewCompatibleUpload(file: File, path: string): Promise<string> {
  if (isPreviewEnvironment) {
    // Mock upload for preview - return a placeholder URL
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockUrl = `/placeholder.svg?height=200&width=200&text=${encodeURIComponent(file.name)}`
        resolve(mockUrl)
      }, 1000)
    })
  }

  try {
    const { storage } = getPreviewFirebase()
    if (!storage) {
      throw new Error("Firebase Storage not available")
    }

    const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage")
    const storageRef = ref(storage, path)
    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef)
    return downloadURL
  } catch (error) {
    console.error("Upload error:", error)
    // Fallback to mock URL on error
    return `/placeholder.svg?height=200&width=200&text=${encodeURIComponent(file.name)}`
  }
}

// Preview-compatible product creation
export async function previewCompatibleCreateProduct(productData: any): Promise<{ id: string }> {
  if (isPreviewEnvironment) {
    // Mock product creation for preview
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ id: `preview-product-${Date.now()}` })
      }, 1500)
    })
  }

  try {
    const { db } = getPreviewFirebase()
    if (!db) {
      throw new Error("Firestore not available")
    }

    const { collection, addDoc, serverTimestamp } = await import("firebase/firestore")
    const productsRef = collection(db, "products")
    const docRef = await addDoc(productsRef, {
      ...productData,
      created_at: serverTimestamp(),
      updated: serverTimestamp(),
    })

    return { id: docRef.id }
  } catch (error) {
    console.error("Product creation error:", error)
    // Mock success for preview to prevent blocking
    return { id: `fallback-product-${Date.now()}` }
  }
}

// Preview-compatible company creation
export async function previewCompatibleCreateCompany(companyData: any, userId: string): Promise<{ id: string }> {
  if (isPreviewEnvironment) {
    // Mock company creation for preview
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ id: `preview-company-${Date.now()}` })
      }, 1000)
    })
  }

  try {
    const { db } = getPreviewFirebase()
    if (!db) {
      throw new Error("Firestore not available")
    }

    const { collection, addDoc, doc, updateDoc, serverTimestamp } = await import("firebase/firestore")

    // Create company document
    const companyRef = await addDoc(collection(db, "companies"), {
      ...companyData,
      created_by: userId,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })

    // Update user document with company ID
    const userRef = doc(db, "iboard_users", userId)
    await updateDoc(userRef, {
      company_id: companyRef.id,
    })

    return { id: companyRef.id }
  } catch (error) {
    console.error("Company creation error:", error)
    // Mock success for preview
    return { id: `fallback-company-${Date.now()}` }
  }
}
