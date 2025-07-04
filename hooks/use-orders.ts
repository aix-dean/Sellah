import { collection, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { loggedGetDocs } from "@/lib/firestore-logger"
import { useFirestoreQuery, firestoreCache } from "./use-firestore-cache"

interface OrderItem {
  product_id: string
  product_name: string
  product_image: string
  quantity: number
  unit_price: number
  total_price: number
  seller_id: string
  specifications?: any
  image_url?: string
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

export function useOrders(userId: string | null) {
  const {
    data: orders,
    loading,
    error,
    refetch,
  } = useFirestoreQuery<Order[]>(
    `orders_${userId}`,
    async () => {
      if (!userId) return []

      console.log("🔍 Fetching orders for userId:", userId)

      const ordersRef = collection(db, "orders")
      const q = query(ordersRef, where("deleted", "==", false), where("seller_id", "==", userId))
      const querySnapshot = await loggedGetDocs(q)
      const fetchedOrders: Order[] = []

      console.log("📊 Total documents found:", querySnapshot.docs.length)

      querySnapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data()

        // Check all possible field name variations
        const possibleApprovePaymentFields = [
          "approve_payment",
          "approvePayment",
          "approve-payment",
          "payment_approved",
          "paymentApproved",
          "payment_approve",
          "paymentApprove",
        ]

        let approvePaymentValue = undefined
        let foundFieldName = null

        // Check each possible field name
        for (const fieldName of possibleApprovePaymentFields) {
          if (data.hasOwnProperty(fieldName)) {
            approvePaymentValue = data[fieldName]
            foundFieldName = fieldName
            break
          }
        }

        console.log(`📄 Document ${docSnapshot.id} field analysis:`, {
          all_fields: Object.keys(data),
          found_approve_payment_field: foundFieldName,
          approve_payment_value: approvePaymentValue,
          approve_payment_type: typeof approvePaymentValue,
          is_pickup: data.is_pickup,
          pickup_info: data.pickup_info,
          out_of_delivery: data.out_of_delivery,
          // Check specific field directly
          direct_approve_payment: data.approve_payment,
          direct_approvePayment: data.approvePayment,
        })

        // Process items with variation data
        const items: OrderItem[] = data.items
          ? data.items.map((item: any) => ({
              product_id: item.product_id || "",
              product_name: item.product_name || "Legacy Product",
              product_image: item.product_image || "",
              quantity: item.quantity || 1,
              unit_price: item.unit_price || item.cost || 0,
              total_price: item.total_price || item.total_cost || 0,
              seller_id: item.seller_id || data.seller_id || data.product_owner || "",
              specifications: item.specifications,
              image_url: item.product_image,
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

        // Handle approve_payment field with multiple possible values and field names
        let approvePayment = false
        if (approvePaymentValue === true || approvePaymentValue === "true" || approvePaymentValue === 1) {
          approvePayment = true
        } else if (approvePaymentValue === false || approvePaymentValue === "false" || approvePaymentValue === 0) {
          approvePayment = false
        }

        console.log(`✅ Processed order ${docSnapshot.id}:`, {
          found_field: foundFieldName,
          original_value: approvePaymentValue,
          processed_approve_payment: approvePayment,
          status: normalizedStatus,
          is_pickup: data.is_pickup,
          out_of_delivery: data.out_of_delivery || false,
          items_with_variations: items.map((item) => ({
            product_name: item.product_name,
            variation_data: item.variation_data,
            variation_id: item.variation_id,
            variation_name: item.variation_name,
          })),
        })

        const processedOrder = {
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
          total_amount: data.total_amount || data.total_cost || 0,
          status: normalizedStatus,
          order_type: data.order_type || data.type || "MERCHANDISE",
          payment_method: data.payment_method || "",
          payment_status: data.payment_status || "pending",
          payment_reference: data.payment_reference || "",
          payment_proof: data.payment_proof || null,
          approve_payment: approvePayment,
          is_pickup: data.is_pickup || false,
          pickup_info: data.pickup_info || null,
          out_of_delivery: data.out_of_delivery || false,
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

        fetchedOrders.push(processedOrder)
      })

      // Sort by creation date (newest first)
      fetchedOrders.sort((a, b) => {
        if (a.created_at && b.created_at) {
          const dateA = a.created_at.toDate ? a.created_at.toDate() : new Date(a.created_at)
          const dateB = b.created_at.toDate ? b.created_at.toDate() : new Date(b.created_at)
          return dateB.getTime() - dateA.getTime()
        }
        return 0
      })

      console.log(
        "🎯 Final processed orders with variations:",
        fetchedOrders.map((order) => ({
          id: order.id,
          approve_payment: order.approve_payment,
          status: order.status,
          is_pickup: order.is_pickup,
          out_of_delivery: order.out_of_delivery,
          items_count: order.items.length,
          variations_found: order.items.filter((item) => item.variation_data).length,
        })),
      )

      return fetchedOrders
    },
    { ttl: 10 * 1000 }, // Very short cache for debugging
  )

  const invalidateOrders = () => {
    firestoreCache.invalidate(`orders_${userId}`)
    console.log("🔄 Orders cache invalidated")
  }

  return {
    orders: orders || [],
    loading,
    error,
    refetch,
    invalidateOrders,
  }
}
