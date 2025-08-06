export interface Service {
  id: string
  name: string
  description: string
  category: string
  price: number
  duration?: string
  availability: "available" | "unavailable"
  images: string[]
  scope: "nationwide" | "regional"
  regions: string[]
  seller_id: string
  created_at: any
  updated_at: any
}

export interface CreateServiceData {
  name: string
  description: string
  category: string
  price: number
  duration?: string
  availability: "available" | "unavailable"
  images: (string | File)[]
  scope: "nationwide" | "regional"
  regions: string[]
}
