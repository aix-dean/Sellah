"use client"

import { useEffect, useState } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface ProductVariation {
  id: string
  name: string
  price: number
  stock: number
  media?: string
  color?: string | null
  height?: string | null
  length?: string | null
  weight?: string | null
}

interface Product {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  sales: number
  status: "published" | "unpublished" | "active" | "inactive" | "draft"
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
  variations?: ProductVariation[]
  // Service-specific fields
  serviceType?: "roll_up" | "roll_down" | "delivery"
  schedule?: {
    [key: string]: {
      available: boolean
      startTime: string
      endTime: string
    }
  }
  bookings?: number
  imageUrls?: string[]
}

export function useRealTimeProducts(companyId: string | null) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const forceRefetch = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 100)
  }

  useEffect(() => {
    if (!companyId) {
      setProducts([])
      setLoading(false)
      return () => {}
    }

    setLoading(true)
    setError(null)

    try {
      const productsRef = collection(db, "products")
      const q = query(
        productsRef,
        where("company_id", "==", companyId),
        where("active", "==", true),
        where("deleted", "==", false),
      )

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const fetchedProducts: Product[] = []

          querySnapshot.forEach((doc) => {
            const data = doc.data()

            if (data.deleted === true || data.active === false) return

            // Handle both products and services
            if (data.type === "SERVICES") {
              // Service data structure
              const serviceImages = Array.isArray(data.imageUrls) ? data.imageUrls : []

              fetchedProducts.push({
                id: doc.id,
                name: data.name || "Untitled Service",
                sku: data.sku || "N/A",
                price: data.price || 0,
                stock: 0, // Services don't have stock
                sales: data.bookings || 0, // Use bookings for services
                status: data.status || "unpublished",
                views: data.views || 0,
                likes: data.likes || 0,
                type: data.type,
                seller_id: data.seller_id || "",
                deleted: data.deleted || false,
                photo_urls: serviceImages,
                created_at: data.created_at,
                description: data.description || "",
                category: data.category || "service",
                image_url: serviceImages.length > 0 ? serviceImages[0] : undefined,
                rating: data.rating || 5,
                serviceType: data.serviceType,
                schedule: data.schedule,
                bookings: data.bookings || 0,
                imageUrls: serviceImages,
              })
            } else {
              // Product data structure
              const mediaImages = Array.isArray(data.media)
                ? data.media.filter((item: any) => item.isVideo === false).map((item: any) => item.url)
                : []

              const variations = Array.isArray(data.variations)
                ? data.variations.map((variation: any) => ({
                    id: variation.id || "",
                    name: variation.name || "",
                    price: Number(variation.price) || 0,
                    stock: Number(variation.stock) || 0,
                    media: variation.media || "",
                    color: variation.color,
                    height: variation.height,
                    length: variation.length,
                    weight: variation.weight,
                  }))
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
                rating: data.rating || 5,
                variations: variations,
              })
            }
          })

          console.log("Fetched products:", fetchedProducts) // Debug log
          setProducts(fetchedProducts)
          setLoading(false)
        },
        (err) => {
          console.error("Error listening to products:", err)
          setError(err.message || "Failed to load products")
          setLoading(false)
        },
      )

      return () => unsubscribe()
    } catch (err: any) {
      console.error("Error setting up products listener:", err)
      setError(err.message || "Failed to set up products listener")
      setLoading(false)
      return () => {}
    }
  }, [companyId])

  return { products, loading, error, forceRefetch }
}
