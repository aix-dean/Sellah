"use client"

import { collection, query, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useFirestorePagination } from "./use-firestore-pagination"
import { useMemo } from "react"

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
  company_id: string
  deleted: boolean
  photo_urls?: string[]
  created_at?: any
}

export function useProductsPaginated(companyId: string | null, pageSize = 12) {
  const baseQuery = useMemo(() => {
    if (!companyId) return null

    const productsRef = collection(db, "products")
    return query(
      productsRef,
      where("company_id", "==", companyId),
      where("type", "in", ["MERCHANDISE", "Merchandise"]),
      where("active", "==", true),
      where("deleted", "==", false),
      orderBy("created_at", "desc"),
    )
  }, [companyId])

  const transform = (doc: any): Product => {
    const data = doc.data()

    // Get images from media field where isVideo is false
    const mediaImages = Array.isArray(data.media)
      ? data.media.filter((item: any) => item.isVideo === false).map((item: any) => item.url)
      : []

    return {
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
      company_id: data.company_id || "",
      deleted: data.deleted || false,
      photo_urls: mediaImages,
      created_at: data.created_at,
    }
  }

  const pagination = useFirestorePagination(baseQuery!, transform, { pageSize })

  // Auto-load first page when query is ready
  useMemo(() => {
    if (baseQuery && pagination.data.length === 0 && !pagination.loading) {
      pagination.loadMore()
    }
  }, [baseQuery])

  return {
    ...pagination,
    products: pagination.data,
  }
}
