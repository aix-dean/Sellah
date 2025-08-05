"use client"

import { useEffect, useState } from "react"
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import type { Product } from "@/types/product"
import type { Service } from "@/types/service"

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
      orderBy("createdAt", "desc"),
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedProducts: ProductOrService[] = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
          } as ProductOrService
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
