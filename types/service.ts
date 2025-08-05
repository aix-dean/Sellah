export interface Service {
  id: string
  name: string
  description: string
  price: number
  type: "SERVICES" // Explicitly "SERVICES" for services
  seller_id: string
  imageUrls: string[] // Array of image URLs for services
  status: "published" | "unpublished"
  views: number
  likes: number
  bookings: number // Specific to services
  service_type: string // e.g., "Online", "In-person"
  duration_minutes: number // Duration of the service
  schedule: {
    [day: string]: {
      start: string
      end: string
    }[]
  }
  deleted: boolean
  active: boolean
  created_at?: any // Firebase Timestamp
  category?: string
  rating?: number
}

export interface CreateServiceData {
  name: string
  description: string
  price: number
  type: "SERVICES"
  seller_id: string
  imageUrls: string[]
  status: "published" | "unpublished"
  service_type: string
  duration_minutes: number
  schedule: {
    [day: string]: {
      start: string
      end: string
    }[]
  }
  category?: string
}
