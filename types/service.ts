import type { Timestamp } from "firebase/firestore"

export interface Schedule {
  [key: string]: {
    available: boolean
    startTime: string
    endTime: string
  }
}

export interface Service {
  id: string
  name: string
  description: string
  serviceType: "roll_up" | "roll_down" | "delivery"
  price: number
  schedule: Schedule
  imageUrl?: string
  userId: string
  type: "SERVICE" | "SERVICES" // Explicitly define service types
  status: "active" | "inactive" | "draft"
  views: number
  bookings: number
  rating: number
  createdAt: Timestamp
  updatedAt: Timestamp
}
