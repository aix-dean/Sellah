export interface OrderItem {
  id: string
  name: string
  description?: string
  price: number
  quantity: number
  image_url?: string
  product_id?: string
  variant?: string
  sku?: string
}

export interface Order {
  id: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  items: OrderItem[]
  totalAmount: number
  subtotal?: number
  tax?: number
  shipping?: number
  discount?: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
  payment_status?: "pending" | "paid" | "failed" | "refunded" | "approved" | "rejected"
  payment_method?: string
  shipping_address?: {
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
  billing_address?: {
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
  tracking_number?: string
  carrier?: string
  estimated_delivery?: Date
  created_at: Date
  updated_at: Date
  completed_at?: Date
  cancelled_at?: Date
  shipped_at?: Date
  delivered_at?: Date
  notes?: Array<{
    note: string
    timestamp: Date
    added_by: string
    user_name?: string
  }>
  status_history?: Array<{
    status: string
    previous_status?: string
    timestamp: Date
    changed_by: string
    changed_by_name?: string
    note?: string
  }>
  shipping_info?: {
    carrier?: string
    tracking_number?: string
    estimated_delivery?: Date
    shipping_address?: any
  }
  shipping_updates?: Array<{
    carrier?: string
    tracking_number?: string
    estimated_delivery?: Date
    timestamp: Date
    updated_by: string
    user_name?: string
  }>
  metadata?: Record<string, any>
}

export interface OrderSummary {
  total_orders: number
  pending_orders: number
  processing_orders: number
  shipped_orders: number
  delivered_orders: number
  cancelled_orders: number
  total_revenue: number
  average_order_value: number
}

export interface OrderFilters {
  status?: string
  payment_status?: string
  date_from?: Date
  date_to?: Date
  customer_email?: string
  search?: string
  limit?: number
  offset?: number
}

// Backward compatibility - alias for existing code
export type OrderType = Order
