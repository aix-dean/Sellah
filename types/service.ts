// Service interface (similar to Product, but adapted for services)
export interface Service {
  id?: string
  name: string
  description: string
  category: string
  price: number
  unit: string
  duration?: string // e.g., "30 minutes", "1 hour"
  availability: {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
  }
  service_images: string[]
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
  active?: boolean
  deleted?: boolean
  sales?: number
  views?: number
  rating?: number
  image_url?: string
  stock?: number // Services might have a "capacity" or "slots" concept
  variations?: Array<{
    id: string
    name: string
    price: number
    duration?: string
    slots?: number // For services with limited slots per variation
    images: File[]
    media: string | null
  }>
}

// Service form data interface (similar to ProductFormData)
export interface ServiceFormData {
  name: string
  description: string
  categories: string[]
  unit: string
  duration: string
  availability: {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
  }
  service_images: File[]
  service_video: File | null
  media: Array<{
    distance: string
    isVideo: boolean
    type: string
    url: string
  }>
  is_pre_order: boolean // Can services be pre-ordered?
  pre_order_days: string
  payment_methods: {
    ewallet: boolean
    bank_transfer: boolean
    gcash: boolean
    maya: boolean
    manual: boolean
  }
  variations: Array<{
    id: string
    name: string
    duration: string
    price: string
    slots: string // Number of slots available for this variation
    images: File[]
    media: string | null
  }>
}
