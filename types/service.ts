export interface Service {
  id: string
  name: string
  description: string
  price: number
  duration?: string
  location?: string
  availability?: string
  maxParticipants?: number
  requirements: string[]
  inclusions: string[]
  imageUrls: string[]
  imageUrl?: string // For backward compatibility
  scope: "nationwide" | "regional"
  regions: string[]
  type: "SERVICES"
  status: "active" | "inactive" | "draft"
  userId: string
  createdAt: any
  updatedAt: any
  category?: string
  tags?: string[]
}

export interface CreateServiceData {
  name: string
  description: string
  price: number
  duration?: string
  location?: string
  availability?: string
  maxParticipants?: number
  requirements: string[]
  inclusions: string[]
  imageUrls: string[]
  scope: "nationwide" | "regional"
  regions: string[]
}
