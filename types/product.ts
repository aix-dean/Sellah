export interface ProductVariation {
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

export interface Product {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  sales: number
  status: "published" | "unpublished"
  views: number
  likes: number
  type: string // e.g., "MERCHANDISE", "SERVICES"
  seller_id: string
  deleted: boolean
  photo_urls?: string[] // Array of image URLs for products
  created_at?: any // Firebase Timestamp
  description?: string
  category?: string
  image_url?: string // Primary image URL (deprecated, use photo_urls)
  rating?: number
  variations?: ProductVariation[]
  active?: boolean // Added active field
  // Service-specific fields (optional, for type "SERVICES")
  service_type?: string // e.g., "Online", "In-person"
  duration_minutes?: number
  schedule?: {
    [day: string]: {
      start: string
      end: string
    }[]
  }
  bookings?: number
}

export interface CreateProductData {
  name: string
  sku: string
  price: number
  stock: number
  description?: string
  category?: string
  status: "published" | "unpublished"
  type: string
  seller_id: string
  photo_urls?: string[]
  variations?: ProductVariation[]
  // Service-specific fields
  service_type?: string
  duration_minutes?: number
  schedule?: {
    [day: string]: {
      start: string
      end: string
    }[]
  }
}
