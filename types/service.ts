import type { Timestamp } from "firebase/firestore"

export type ServiceUnit = "per_hour" | "per_session" | "per_day" | "per_project" | "per_person"

export interface ServiceVariation {
  id: string
  name: string
  duration: string // e.g., "30 mins", "1 hour"
  price: string // Stored as string for form input, converted to number for Firestore
  slots: string // Stored as string for form input, converted to number for Firestore
  media: string | null // URL of variation-specific image
}

export interface ServiceFormData {
  name: string
  description: string
  categories: string[] // Array of category IDs
  unit: ServiceUnit
  duration: string // Overall service duration, if not covered by variations
  availability: {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
  }
  service_images: string[] // URLs of main service images
  service_video: string | null // URL of service video
  media: { url: string; isVideo: boolean; type: string; distance: string }[] // Combined media for display
  is_pre_order: boolean
  pre_order_days: string // Stored as string for form input, converted to number for Firestore
  payment_methods: {
    ewallet: boolean
    bank_transfer: boolean
    gcash: boolean
    maya: boolean
    manual: boolean
  }
  variations: ServiceVariation[]
}

export interface Service {
  id: string
  userId: string
  name: string
  description: string
  categories: string[]
  unit: ServiceUnit
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
  service_images: string[]
  service_video: string | null
  media: { url: string; isVideo: boolean; type: string; distance: string }[]
  is_pre_order: boolean
  pre_order_days: number
  payment_methods: {
    ewallet: boolean
    bank_transfer: boolean
    gcash: boolean
    maya: boolean
    manual: boolean
  }
  variations: {
    id: string
    name: string
    duration: string
    price: number
    slots: number
    media: string | null
  }[]
  price: number // Main price, usually from first variation
  mainImage: string // URL of the main image
  status: "draft" | "active" | "inactive" | "archived"
  createdAt: Timestamp
  updatedAt: Timestamp
}
