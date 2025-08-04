export interface Service {
  id?: string
  name: string
  description: string
  category: string
  price: number
  duration: number // in minutes
  durationUnit: "minutes" | "hours" | "days"
  images: string[]
  mainImage?: string
  tags: string[]
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  status: "active" | "draft" | "archived"
  visibility: "public" | "private"
  featured: boolean
  userId: string
  createdAt?: any
  updatedAt?: any
  // Additional fields for soft delete
  active?: boolean
  deleted?: boolean
  bookings?: number
  views?: number
  rating?: number
  image_url?: string
  variations?: Array<{
    name: string
    price: number
    duration: number
    durationUnit: "minutes" | "hours" | "days"
  }>
}

export interface ServiceFormData {
  name: string
  description: string
  category: string
  price: string
  duration: string
  durationUnit: "minutes" | "hours" | "days"
  images: string[]
  mainImage?: string
  tags: string
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  status: "active" | "draft" | "archived"
  visibility: "public" | "private"
  featured: boolean
  variations: Array<{
    name: string
    price: string
    duration: string
    durationUnit: "minutes" | "hours" | "days"
  }>
}
