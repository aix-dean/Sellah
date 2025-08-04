import type { Timestamp } from "firebase/firestore"

export interface Service {
  id?: string
  name: string
  description: string
  category: string
  price: number
  duration: number // Duration in minutes
  durationUnit: "minutes" | "hours" | "days"
  images: string[]
  mainImage?: string
  tags: string[]
  status: "active" | "draft" | "archived"
  visibility: "public" | "private"
  featured: boolean
  userId: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
  // Additional fields for soft delete
  active?: boolean
  deleted?: boolean
  bookings?: number // Number of times service has been booked
  views?: number
  rating?: number
  image_url?: string
}

export interface ServiceFilter {
  category?: string
  status?: string
  visibility?: string
  featured?: boolean
  priceMin?: number
  priceMax?: number
  search?: string
}

export interface ServicesResponse {
  services: Service[]
  total: number
  hasMore: boolean
  lastDoc?: any // QueryDocumentSnapshot from Firestore
}
