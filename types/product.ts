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
  active?: boolean
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
}
