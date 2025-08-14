// Common types for the application

export interface Order {
  id: string
  userId: string
  companyId?: string
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  items: OrderItem[]
  totalAmount: number
  currency: string
  shippingAddress: Address
  billingAddress?: Address
  createdAt: Date
  updatedAt: Date
  paymentStatus: "pending" | "paid" | "failed" | "refunded"
  paymentMethod?: string
  trackingNumber?: string
  notes?: string
}

export interface OrderItem {
  id: string
  productId: string
  productName: string
  productSku: string
  quantity: number
  unitPrice: number
  totalPrice: number
  variationId?: string
  variationName?: string
}

export interface Address {
  street: string
  city: string
  province: string
  postalCode?: string
  country: string
}

export interface Product {
  id: string
  name: string
  description?: string
  sku: string
  price: number
  category: string
  status: "active" | "inactive" | "draft"
  stock: number
  image_url?: string
  variations?: ProductVariation[]
  type?: "MERCHANDISE" | "SERVICES"
  serviceType?: "roll_up" | "roll_down" | "delivery"
  schedule?: ServiceSchedule
  rating?: number
  views: number
  sales: number
  createdAt: Date
  updatedAt: Date
  userId: string
  companyId?: string
}

export interface ProductVariation {
  id: string
  name: string
  price: number
  stock: number
  sku?: string
}

export interface ServiceSchedule {
  [day: string]: {
    available: boolean
    startTime?: string
    endTime?: string
  }
}

export interface User {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  company_id?: string
  position?: string
  createdAt: Date
  updatedAt: Date
}

export interface Company {
  id: string
  name: string
  business_type: string
  address: Address
  website?: string
  created_by: string
  createdAt: Date
  updatedAt: Date
  theme?: {
    primaryColor?: string
    secondaryColor?: string
    accentColor?: string
    backgroundColor?: string
    textColor?: string
    buttonColor?: string
    buttonTextColor?: string // Added button text color for better contrast control
    headerColor?: string
    footerBackgroundColor?: string // Added footer color fields for better footer theming control
    footerTextColor?: string
  }
}

export interface Category {
  id: string
  name: string
  description?: string
  type: "MERCHANDISE" | "SERVICES"
  createdAt: Date
  updatedAt: Date
}

// Form data interfaces
export interface CompanyFormData {
  name: string
  address_street: string
  address_city: string
  address_province: string
  website: string
  position: string
}

export interface ProductToDelete {
  id: string
  name: string
  sku: string
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Common utility types
export type LoadingState = "idle" | "loading" | "success" | "error"

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface FilterParams {
  category?: string
  status?: string
  search?: string
  priceMin?: number
  priceMax?: number
}
