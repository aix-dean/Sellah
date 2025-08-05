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
  seller_id: string
  type: "SERVICES"
  status: "active" | "inactive" | "draft"
  views: number
  likes: number
  bookings: number
  rating: number
  imageUrls: string[]
  active: boolean
  deleted: boolean
  created_at?: any
  updated_at?: any
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
  seller_id: string
  type: "SERVICES"
  status: "active" | "inactive" | "draft"
  views: number
  bookings: number
  rating: number
  imageUrls: string[]
}
