import type { Timestamp } from "firebase/firestore"
import type { ServiceSchedule } from "./schedule"

export interface Service {
  id: string
  name: string
  description: string
  category: string
  price: number
  duration?: string
  imageUrls?: string[]
  seller_id: string
  type: "SERVICES" // Discriminator for services in 'products' collection
  active: boolean
  deleted: boolean
  views: number
  bookings: number
  rating: number
  availability: "available" | "unavailable"
  scope: "nationwide" | "regional"
  regions?: string[] // Array of region codes if scope is regional
  schedule?: ServiceSchedule // Added schedule property
  created_at: Timestamp
  updated_at: Timestamp
}

export interface CreateServiceData {
  name: string
  description: string
  category: string
  price: number
  duration?: string
  imageUrls?: string[]
  seller_id: string
  availability: "available" | "unavailable"
  scope: "nationwide" | "regional"
  regions?: string[]
  schedule?: ServiceSchedule // Added schedule property
}
