"use client"

import { useState, useEffect, useCallback } from "react"
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

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

// Real-time products hook without caching
export function useRealTimeProductsNoCaching(userId: string | null) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    if (!userId) {
      setProducts([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const productsRef = collection(db, "products")
      const q = query(
        productsRef,
        where("seller_id", "==", userId),
        where("type", "in", ["MERCHANDISE", "Merchandise"]),
        where("active", "==", true),
        where("deleted", "==", false),
      )

      const querySnapshot = await getDocs(q)
      const fetchedProducts: Product[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()

        // Get images from media field where isVideo is false
        const mediaImages = Array.isArray(data.media)
          ? data.media.filter((item: any) => item.isVideo === false).map((item: any) => item.url)
          : []

        fetchedProducts.push({
          id: doc.id,
          name: data.name || "Untitled Product",
          sku: data.sku || "N/A",
          price: data.price || 0,
          stock: data?.specs_merchant?.stock || data?.stock || 0,
          sales: data.sales || 0,
          status: data.status || "unpublished",
          views: data.views || 0,
          likes: data.likes || 0,
          type: data.type || "MERCHANDISE",
          seller_id: data.seller_id || "",
          deleted: data.deleted || false,
          photo_urls: mediaImages,
          created_at: data.created_at,
          description: data.description || "",
          category: data.categories && data.categories.length > 0 ? data.categories[0] : "other",
          image_url: mediaImages.length > 0 ? mediaImages[0] : undefined,
          rating: 5,
          variations: data.variations || [],
        })
      })

      setProducts(fetchedProducts)
      setLoading(false)
    } catch (err: any) {
      console.error("Error fetching products:", err)
      setError(err.message || "Failed to load products")
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const refetch = useCallback(() => {
    return fetchProducts()
  }, [fetchProducts])

  return { products, loading, error, refetch }
}

// Real-time categories hook without caching
export function useRealTimeCategoriesNoCaching(type = "MERCHANDISE") {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
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

      setCategories(fetchedCategories)
      setLoading(false)
    } catch (err: any) {
      console.error("Error fetching categories:", err)
      setError(err.message || "Failed to load categories")
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

// Real-time user data hook without caching
export function useRealTimeUserDataNoCaching(userId: string | null) {
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

    try {
      const userRef = collection(db, "iboard_users")
      const q = query(userRef, where("__name__", "==", userId))

      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0]
        const data = doc.data()
        setUserData({
          id: doc.id,
          ...data,
        } as UserData)
      } else {
        setUserData(null)
      }

      setLoading(false)
    } catch (err: any) {
      console.error("Error fetching user data:", err)
      setError(err.message || "Failed to load user data")
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

// Real-time listener hook for immediate updates
export function useRealTimeListener<T>(collectionName: string, queryConstraints: any[], transform: (doc: any) => T) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    try {
      const collectionRef = collection(db, collectionName)
      const q = query(collectionRef, ...queryConstraints)

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const fetchedData: T[] = []
          querySnapshot.forEach((doc) => {
            try {
              const transformedData = transform({ id: doc.id, ...doc.data() })
              fetchedData.push(transformedData)
            } catch (transformError) {
              console.error("Error transforming document:", transformError)
            }
          })
          setData(fetchedData)
          setLoading(false)
        },
        (err) => {
          console.error(`Error listening to ${collectionName}:`, err)
          setError(err.message || `Failed to listen to ${collectionName}`)
          setLoading(false)
        },
      )

      return () => unsubscribe()
    } catch (err: any) {
      console.error(`Error setting up ${collectionName} listener:`, err)
      setError(err.message || `Failed to set up ${collectionName} listener`)
      setLoading(false)
      return () => {}
    }
  }, [collectionName, JSON.stringify(queryConstraints)])

  return { data, loading, error }
}
