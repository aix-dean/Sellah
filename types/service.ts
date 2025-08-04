import type { Timestamp } from "firebase/firestore"

export interface ServiceVariation {
  id: string
  name: string
  duration: string // e.g., "30 mins", "1 hour"
  price: string // Stored as string to handle decimal input easily
  slots: string // Number of available slots for this variation
  images: File[] // For new uploads
  media: string | null // URL for existing image
}

export interface ServiceFormData {
  name: string
  description: string
  categories: string[]
  unit: string // e.g., "per_hour", "per_session"
  service_images: File[] // For new uploads
  service_video: File | null // For new uploads
  media: Array<{
    distance: string // For ordering media
    isVideo: boolean
    type: string // "image" or "video"
    url: string
  }>
  availability: {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
  }
  is_pre_order: boolean
  pre_order_days: string // Number of days for pre-order
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
  name: string
  description: string
  categories: string[]
  unit: string
  media: Array<{
    distance: string
    isVideo: boolean
    type: string
    url: string
  }>
  availability: {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
  }
  is_pre_order: boolean
  pre_order_days: number
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
    price: number
    slots: number
    media: string | null
  }>
  created_at: Timestamp
  updated_at: Timestamp
  user_id: string
  status: "active" | "draft" | "archived"
}
