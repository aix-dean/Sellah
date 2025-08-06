import type { Timestamp } from "firebase/firestore"
import type { ServiceSchedule } from "./schedule"

export interface Service {
  id: string
  userId: string
  name: string
  description: string
  category: string
  price: number
  duration: string // e.g., "30 mins", "1 hour", "full day"
  availability: "available" | "unavailable"
  scope: "nationwide" | "regional"
  regions?: string[] // Array of region codes if scope is 'regional'
  imageUrls: string[]
  createdAt: string
  updatedAt: string
  schedule?: ServiceSchedule // Optional schedule
  seller_id: string
  type: "SERVICES" // Discriminator for services in 'products' collection
  active: boolean
  deleted: boolean
  views: number
  bookings: number
  rating: number
}

export interface CreateServiceData {
  name: string
  description: string
  category: string
  price: number
  duration: string
  availability: "available" | "unavailable"
  scope: "nationwide" | "regional"
  regions: string[]
  schedule: ServiceSchedule
}

export interface ServiceFormData {
  name: string
  description: string
  category: string
  price: number
  duration: string
  availability: "available" | "unavailable"
  scope: "nationwide" | "regional"
  regions: string[]
  schedule: ServiceSchedule
}
