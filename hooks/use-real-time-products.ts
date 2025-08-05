"use client"

import { useEffect, useState } from "react"
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import type { Product } from "@/types/product" // Corrected import
import type { Service } from "@/types/service" // Corrected import

type ProductOrService = Product | Service

export function useRealTimeProducts() {
  const { user } = useAuth()
  const [products, setProducts] = useState<ProductOrService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setProducts([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const q = query(
      collection(db, "products"),
      where("seller_id", "==", user.uid),
      where("active", "==", true),
      where("deleted", "==", false),
      orderBy("created_at", "desc"), // Use created_at for ordering
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedProducts: ProductOrService[] = snapshot.docs.map((doc) => {
          const data = doc.data()
          // Determine if it's a Product or Service based on 'type' field
          if (data.type === "SERVICES") {
            return {
              id: doc.id,
              name: data.name || "Untitled Service",
              description: data.description || "",
              price: Number(data.price) || 0,
              type: data.type,
              seller_id: data.seller_id || "",
              imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
              status: data.status || "unpublished",
              views: data.views || 0,
              likes: data.likes || 0,
              bookings: data.bookings || 0,
              service_type: data.service_type || "Online",
              duration_minutes: Number(data.duration_minutes) || 60,
              schedule: data.schedule || {},
              deleted: data.deleted || false,
              active: data.active || false,
              created_at: data.created_at,
              category: data.category || "other",
              rating: data.rating || 5,
            } as Service
          } else {
            // Default to Product type if not explicitly a service
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

            return {
              id: doc.id,
              name: data.name || "Untitled Product",
              sku: data.sku || "N/A",
              price: Number(data.price) || 0,
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
              active: data.active || false,
            } as Product
          }
        })
        setProducts(fetchedProducts)
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching real-time products:", err)
        setError("Failed to load products. Please try again.")
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user])

  return { products, loading, error }
}
