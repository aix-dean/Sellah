export interface Service {
  id: string
  name: string
  description: string
  category: string
  price: number
  duration?: string
  availability: "available" | "unavailable"
  images: string[]
  seller_id: string
  type: "SERVICES"
  status: "published" | "draft" | "archived"
  scope: "nationwide" | "regional"
  regions: string[]
  created_at: Date
  updated_at: Date
}

export interface CreateServiceData {
  name: string
  description: string
  category: string
  price: number
  duration?: string
  availability: "available" | "unavailable"
  images: string[]
  scope: "nationwide" | "regional"
  regions: string[]
}

export interface UpdateServiceData extends Partial<CreateServiceData> {
  id: string
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
  available: number
  unavailable: number
  byCategory: Record<string, number>
  byRegion: Record<string, number>
}
