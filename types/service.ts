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
  sellerId: string
  createdAt: any
  updatedAt?: any
  status: "active" | "inactive" | "draft"
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

export interface UpdateServiceData extends Partial<CreateServiceData> {
  updatedAt?: any
}

export interface ServiceFilters {
  category?: string
  priceRange?: {
    min: number
    max: number
  }
  availability?: "available" | "unavailable"
  scope?: "nationwide" | "regional"
  regions?: string[]
  search?: string
}

export interface ServiceStats {
  total: number
  active: number
  inactive: number
  draft: number
  nationwide: number
  regional: number
}
