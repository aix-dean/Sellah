export interface Service {
  id: string
  name: string
  description: string
  serviceType: "roll_up" | "roll_down" | "delivery"
  price: number
  schedule: {
    [key: string]: {
      available: boolean
      startTime: string
      endTime: string
    }
  }
  userId: string
  type: "SERVICE"
  status: "active" | "inactive" | "draft"
  views: number
  bookings: number
  rating: number
  imageUrl: string
  createdAt?: any
  updatedAt?: any
}

export interface CreateServiceData {
  name: string
  description: string
  serviceType: "roll_up" | "roll_down" | "delivery"
  price: number
  schedule: {
    [key: string]: {
      available: boolean
      startTime: string
      endTime: string
    }
  }
  userId: string
  type: "SERVICE"
  status: "active" | "inactive" | "draft"
  views: number
  bookings: number
  rating: number
  imageUrl: string
}
