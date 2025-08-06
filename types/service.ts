import { Timestamp } from 'firebase/firestore'

export interface Service {
  id: string
  name: string
  description: string
  price: number
  imageUrl?: string
  imageUrls?: string[]
  category: string
  type: "SERVICES"
  status: "active" | "inactive" | "draft"
  userId: string
  createdAt: Timestamp
  updatedAt: Timestamp
  
  // Service-specific fields
  duration?: string
  location?: string
  availability?: string
  maxParticipants?: number
  requirements?: string[]
  inclusions?: string[]
  
  // New location/scope fields
  scope?: "nationwide" | "regional"
  regions?: string[]
}

export interface CreateServiceData {
  name: string
  description: string
  price: number
  imageUrl?: string
  imageUrls?: string[]
  category: string
  type: "SERVICES"
  status: "active" | "inactive" | "draft"
  userId: string
  
  // Service-specific fields
  duration?: string
  location?: string
  availability?: string
  maxParticipants?: number
  requirements?: string[]
  inclusions?: string[]
  
  // New location/scope fields
  scope?: "nationwide" | "regional"
  regions?: string[]
}

export const PHILIPPINE_REGIONS = [
  "National Capital Region (NCR)",
  "Cordillera Administrative Region (CAR)",
  "Region I (Ilocos Region)",
  "Region II (Cagayan Valley)",
  "Region III (Central Luzon)",
  "Region IV-A (CALABARZON)",
  "Region IV-B (MIMAROPA)",
  "Region V (Bicol Region)",
  "Region VI (Western Visayas)",
  "Region VII (Central Visayas)",
  "Region VIII (Eastern Visayas)",
  "Region IX (Zamboanga Peninsula)",
  "Region X (Northern Mindanao)",
  "Region XI (Davao Region)",
  "Region XII (SOCCSKSARGEN)",
  "Region XIII (Caraga)",
  "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)"
] as const

export type PhilippineRegion = typeof PHILIPPINE_REGIONS[number]
