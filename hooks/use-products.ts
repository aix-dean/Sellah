import { collection, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { loggedGetDocs } from "@/lib/firestore-logger"
import { useFirestoreQuery, firestoreCache } from "./use-firestore-cache"

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
  status: "published" | "unpublished"
  views: number
  likes: number
  type: string
  company_id: string
  deleted: boolean
  photo_urls?: string[]
  variations?: ProductVariation[] // Add variations array
  created_at?: any
}

export function useProducts(companyId: string | null) {
  const {
    data: products,
    loading,
    error,
    refetch,
  } = useFirestoreQuery<Product[]>(
    `products_${companyId}`,
    async () => {
      if (!companyId) return []

      const productsRef = collection(db, "products")
      const q = query(
        productsRef,
        where("company_id", "==", companyId),
        where("type", "in", ["MERCHANDISE", "Merchandise"]),
        where("active", "==", true),
      )

      const querySnapshot = await loggedGetDocs(q)
      const filtered = querySnapshot.docs.filter((doc) => !doc.data().deleted)
      const fetchedProducts: Product[] = []

      filtered.forEach((doc) => {
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
          company_id: data.company_id || "",
          deleted: data.deleted || false,
          photo_urls: mediaImages,
          variations: data.variations || [], // Map variations array
          created_at: data.created_at,
        })
      })

      return fetchedProducts
    },
    {
      ttl: 30 * 1000, // Reduce cache time to 30 seconds for more frequent updates
      forceRefresh: false,
    },
  )

  const invalidateProducts = () => {
    firestoreCache.invalidate(`products_${companyId}`)
  }

  const forceRefetch = () => {
    firestoreCache.invalidate(`products_${companyId}`)
    return refetch()
  }

  return {
    products: products || [],
    loading,
    error,
    refetch,
    forceRefetch,
    invalidateProducts,
  }
}
