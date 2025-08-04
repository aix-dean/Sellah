export interface Service {
  id: string
  name: string
  description: string
  price: number
  serviceType: "roll_up" | "roll_down" | "delivery"
  category: string
  schedule: {
    [key: string]: {
      available: boolean
      startTime: string
      endTime: string
    }
  }
  imageUrl?: string
  type: "SERVICE"
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface ServiceFormData {
  name: string
  description: string
  price: string
  serviceType: string
  category: string
}
