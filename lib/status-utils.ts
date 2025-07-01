// Create a utility file for consistent status handling across the application

export interface StatusMapping {
  dbStatus: string
  displayStatus: string
  displayLabel: string
  color: string
  icon?: any
}

// Define all possible database statuses and their display mappings
export const STATUS_MAPPINGS: StatusMapping[] = [
  {
    dbStatus: "settle payment",
    displayStatus: "unpaid",
    displayLabel: "Unpaid",
    color: "text-red-600 bg-red-50",
  },
  {
    dbStatus: "payment sent",
    displayStatus: "unpaid",
    displayLabel: "Unpaid",
    color: "text-red-600 bg-red-50",
  },
  {
    dbStatus: "preparing",
    displayStatus: "to_ship",
    displayLabel: "To Ship",
    color: "text-blue-600 bg-blue-50",
  },
  {
    dbStatus: "in transit",
    displayStatus: "shipping",
    displayLabel: "Shipping",
    color: "text-purple-600 bg-purple-50",
  },
  {
    dbStatus: "ready for pickup",
    displayStatus: "completed",
    displayLabel: "Completed",
    color: "text-green-600 bg-green-50",
  },
  {
    dbStatus: "order received",
    displayStatus: "completed",
    displayLabel: "Completed",
    color: "text-green-600 bg-green-50",
  },
  {
    dbStatus: "completed",
    displayStatus: "completed",
    displayLabel: "Completed",
    color: "text-green-600 bg-green-50",
  },
  {
    dbStatus: "CANCELLED",
    displayStatus: "cancelled",
    displayLabel: "Cancelled",
    color: "text-gray-600 bg-gray-50",
  },
]

export interface StatusCounts {
  all: number
  unpaid: number
  to_ship: number
  shipping: number
  completed: number
  cancelled: number
}

// Normalize database status values to handle variations and typos
export const normalizeDbStatus = (status: string): string => {
  if (!status) return "pending"

  const normalized = status.toLowerCase().trim()

  // Handle common variations
  const statusMap: Record<string, string> = {
    to_transit: "in transit",
    in_transit: "in transit",
    ready_for_pickup: "ready for pickup",
    payment_sent: "payment sent",
    settle_payment: "settle payment",
    order_received: "order received",
    cancelled: "CANCELLED",
  }

  return statusMap[normalized] || status
}

// Get display status information from database status
export const getStatusDisplay = (dbStatus: string) => {
  const normalizedStatus = normalizeDbStatus(dbStatus)

  const mapping = STATUS_MAPPINGS.find((m) => m.dbStatus.toLowerCase() === normalizedStatus.toLowerCase())

  if (mapping) {
    return {
      label: mapping.displayLabel,
      color: mapping.color,
      displayStatus: mapping.displayStatus,
    }
  }

  // Fallback for unknown statuses
  return {
    label: dbStatus || "Unknown",
    color: "text-gray-600 bg-gray-50",
    displayStatus: "unknown",
  }
}

// Get display status for an order based on its actual status and other fields
export function getOrderDisplayStatus(order: any): string {
  const status = order.status?.toLowerCase() || ""

  // Handle completed orders
  if (status === "completed" || status === "order received") {
    return "completed"
  }

  // Handle cancelled orders
  if (status === "cancelled") {
    return "cancelled"
  }

  // Handle unpaid orders
  if (status === "settle payment" || status === "payment sent") {
    return "unpaid"
  }

  // Handle to ship orders
  if (status === "preparing") {
    return "to_ship"
  }

  // Handle shipping orders
  if (status === "in transit") {
    // Check if it's out for delivery (for display purposes only)
    if (order.is_pickup === false && order.out_of_delivery === true) {
      return "shipping" // Still in shipping tab but shows "out for delivery" status
    }
    return "shipping"
  }

  // Default fallback
  return "unpaid"
}

// Get orders by display status category with simplified logic
export const getOrdersByDisplayStatus = (orders: any[], displayStatus: string) => {
  return orders.filter((order) => {
    const status = order.status?.toLowerCase() || ""

    console.log(`🔍 Filtering order ${order.id}: status="${status}"`)

    switch (displayStatus) {
      case "unpaid":
        // Show orders with "settle payment" and "payment sent" statuses
        return status === "settle payment" || status === "payment sent"
      case "to_ship":
        // Only show orders with "preparing" status
        return status === "preparing"
      case "shipping":
        // Only show orders with "in transit" status
        return status === "in transit"
      case "completed":
        return status === "order received" || status === "completed" || status === "ready for pickup"
      case "cancelled":
        return status === "cancelled"
      default:
        return false
    }
  })
}

// Get status counts for tabs with simplified logic
export const getStatusCounts = (orders: any[]) => {
  const counts = {
    all: orders.length,
    unpaid: 0,
    to_ship: 0,
    shipping: 0,
    completed: 0,
    cancelled: 0,
  }

  orders.forEach((order) => {
    const status = order.status?.toLowerCase() || ""

    // Count unpaid orders (settle payment + payment sent)
    if (status === "settle payment" || status === "payment sent") {
      counts.unpaid++
    }
    // Count to ship orders (preparing only)
    else if (status === "preparing") {
      counts.to_ship++
    }
    // Count shipping orders (in transit only)
    else if (status === "in transit") {
      counts.shipping++
    }
    // Count completed orders
    else if (status === "order received" || status === "completed" || status === "ready for pickup") {
      counts.completed++
    }
    // Count cancelled orders
    else if (status === "cancelled") {
      counts.cancelled++
    }
  })

  return counts
}

// Debug function to log status mappings
export const debugStatusMapping = (orders: any[]) => {
  console.group("🔍 Order Status Debug Information")

  const statusBreakdown: Record<string, number> = {}
  const displayStatusBreakdown: Record<string, number> = {}

  orders.forEach((order) => {
    // Count database statuses
    const dbStatus = order.status || "undefined"
    statusBreakdown[dbStatus] = (statusBreakdown[dbStatus] || 0) + 1

    // Count display statuses
    const statusInfo = getStatusDisplay(order.status)
    displayStatusBreakdown[statusInfo.displayStatus] = (displayStatusBreakdown[statusInfo.displayStatus] || 0) + 1
  })

  console.log("📊 Database Status Breakdown:", statusBreakdown)
  console.log("🎨 Display Status Breakdown:", displayStatusBreakdown)

  // Show mapping examples
  console.log("🔄 Status Mapping Examples:")
  orders.slice(0, 5).forEach((order) => {
    const statusInfo = getStatusDisplay(order.status)
    console.log(`  Order ${order.id}: "${order.status}" → "${statusInfo.label}" (${statusInfo.displayStatus})`)
  })

  console.groupEnd()
}

// Get visual status display for shipping tab
export function getShippingStatusDisplay(order: any): { label: string; color: string } {
  // If it's a delivery order and out_of_delivery is true, show "Out for Delivery"
  if (order.is_pickup === false && order.out_of_delivery === true) {
    return {
      label: "out for delivery",
      color: "bg-purple-100 text-purple-800",
    }
  }

  // If it's a pickup order
  if (order.is_pickup === true) {
    return {
      label: "waiting for pick-up",
      color: "bg-blue-100 text-blue-800",
    }
  }

  // Default delivery status
  return {
    label: "preparing for delivery",
    color: "bg-orange-100 text-orange-800",
  }
}
