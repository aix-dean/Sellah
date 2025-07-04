"use client"

import { collection, query, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useFirestorePagination } from "./use-firestore-pagination"
import { useMemo } from "react"

interface OrderItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  seller_id: string
  specifications?: any
  product_image?: string // Changed from image_url to product_image
  sku?: string
  variation_data?: {
    color?: string
    height?: string
    id?: string
    length?: string
    media?: string
    name?: string
    price?: number
    sku?: string
    stock?: number
    weight?: string
    [key: string]: any
  }
  variation_id?: string
  variation_name?: string
}

interface Order {
  id: string
  order_number: string
  customer_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  username: string
  items: OrderItem[]
  subtotal: number
  shipping_fee: number
  tax_amount: number
  total_amount: number
  status: string
  order_type: string
  payment_method: string
  payment_status: string
  payment_reference?: string
  payment_proof?: {
    image_url?: string
    transaction_number?: string
    submitted_at?: any
    payment_method?: string
    [key: string]: any
  }
  approve_payment?: boolean
  is_pickup?: boolean
  pickup_info?: {
    business_type?: string
    company_email?: string | null
    company_id?: string
    company_name?: string
    company_phone?: string | null
    pickup_address?: string
    pickup_note?: string
  }
  out_of_delivery?: boolean
  shipping_address: any
  delivery_method: string
  tracking_number?: string
  estimated_delivery?: any
  status_history: Array<any>
  created_at: any
  updated_at: any
  special_instructions?: string
  customer_rating?: number
  customer_review?: string
  cancel_reason?: string
  cancelled_by?: string
  cancelled_at?: any
  deleted: boolean
}

export function useOrdersPaginated(userId: string | null, pageSize = 20) {
  const baseQuery = useMemo(() => {
    if (!userId) return null

    const ordersRef = collection(db, "orders")
    return query(
      ordersRef,
      where("deleted", "==", false),
      where("seller_id", "==", userId),
      orderBy("created_at", "desc"),
    )
  }, [userId])

  const transform = (docSnapshot: any): Order => {
    const data = docSnapshot.data()

    // Debug logging for approve_payment field
    console.log(`📄 Document ${docSnapshot.id} in paginated hook:`, {
      approve_payment: data.approve_payment,
      approve_payment_type: typeof data.approve_payment,
      status: data.status,
      is_pickup: data.is_pickup,
      pickup_info: data.pickup_info,
      out_of_delivery: data.out_of_delivery,
      all_fields: Object.keys(data),
    })

    // Process items with variation data
    const items: OrderItem[] = data.items
      ? data.items.map((item: any) => ({
          product_id: item.product_id || "",
          product_name: item.product_name || "Legacy Product",
          quantity: item.quantity || 1,
          unit_price: item.unit_price || item.cost || 0,
          total_price: item.total_price || item.total_cost || 0,
          seller_id: item.seller_id || data.seller_id || data.product_owner || "",
          specifications: item.specifications,
          product_image: item.product_image, // Mapped product_image
          sku: item.sku,
          variation_data: item.variation_data || null,
          variation_id: item.variation_id,
          variation_name: item.variation_name,
        }))
      : [
          {
            product_id: data.product_id || "",
            product_name: data.product_name || "Legacy Product",
            quantity: data.quantity || 1,
            unit_price: data.cost || data.unit_price || 0,
            total_price: data.total_cost || data.total_price || 0,
            seller_id: data.seller_id || data.product_owner || "",
            product_image: data.product_image, // Mapped product_image
            variation_data: data.variation_data || null,
            variation_id: data.variation_id,
            variation_name: data.variation_name,
          },
        ]

    // Normalize status to ensure consistent values
    let normalizedStatus = data.status || "pending"

    // Handle common status variations and typos
    if (normalizedStatus === "to transit" || normalizedStatus === "in_transit") {
      normalizedStatus = "in transit"
    }
    if (normalizedStatus === "ready_for_pickup") {
      normalizedStatus = "ready for pickup"
    }
    if (normalizedStatus === "payment_sent") {
      normalizedStatus = "payment sent"
    }
    if (normalizedStatus === "settle_payment") {
      normalizedStatus = "settle payment"
    }
    if (normalizedStatus === "order_received") {
      normalizedStatus = "order received"
    }

    console.log(`✅ Processed paginated order ${docSnapshot.id} with variations:`, {
      items_count: items.length,
      variations_found: items.filter((item) => item.variation_data).length,
      variation_details: items.map((item) => ({
        product_name: item.product_name,
        has_variation: !!item.variation_data,
        variation_name: item.variation_name,
        variation_id: item.variation_id,
      })),
    })

    // Calculate total_amount if not explicitly present or if it needs to be re-derived
    const calculatedTotalAmount = (data.subtotal || 0) + (data.shipping_fee || 0) + (data.tax_amount || 0)

    return {
      id: docSnapshot.id,
      order_number: data.order_number || `ORD-${docSnapshot.id.slice(0, 8)}`,
      customer_id: data.customer_id || data.user_id || "",
      customer_name: data.customer_name || data.username || "Unknown Customer",
      customer_email: data.customer_email || "",
      customer_phone: data.customer_phone || "",
      username: data.username || data.customer_name || "",
      items: items,
      subtotal: data.subtotal || data.total_cost || 0,
      shipping_fee: data.shipping_fee || 0,
      tax_amount: data.tax_amount || 0,
      total_amount: data.total_amount || calculatedTotalAmount, // Use existing total_amount or calculate
      status: normalizedStatus, // Use normalized status
      order_type: data.order_type || data.type || "MERCHANDISE",
      payment_method: data.payment_method || "",
      payment_status: data.payment_status || "pending",
      payment_reference: data.payment_reference || "",
      payment_proof: data.payment_proof || null, // Include payment_proof field
      approve_payment: data.approve_payment || false, // Add approve_payment field
      is_pickup: data.is_pickup || false, // Add is_pickup field
      pickup_info: data.pickup_info || null, // Add pickup_info field
      out_of_delivery: data.out_of_delivery || false, // Add out_of_delivery field with default false
      shipping_address: data.shipping_address || {
        recipient_name: data.customer_name || "Unknown",
        phone: data.customer_phone || "",
        street: "",
        barangay: "",
        city: "",
        province: "",
        postal_code: "",
        country: "Philippines",
        address_type: "home",
      },
      delivery_method: data.delivery_method || "standard",
      tracking_number: data.tracking_number || "",
      estimated_delivery: data.estimated_delivery,
      status_history: data.status_history || [],
      created_at: data.created_at || data.created,
      updated_at: data.updated_at || data.updated,
      special_instructions: data.special_instructions || "",
      customer_rating: data.customer_rating,
      customer_review: data.customer_review || "",
      cancel_reason: data.cancel_reason || "",
      cancelled_by: data.cancelled_by || "",
      cancelled_at: data.cancelled_at,
      deleted: data.deleted || false,
    }
  }

  const pagination = useFirestorePagination(baseQuery!, transform, { pageSize })

  // Auto-load first page when query is ready
  useMemo(() => {
    if (baseQuery && pagination.data.length === 0 && !pagination.loading) {
      pagination.loadMore()
    }
  }, [baseQuery])

  return {
    ...pagination,
    orders: pagination.data,
  }
}
