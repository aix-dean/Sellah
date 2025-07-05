import { doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore"
import { db } from "./firebase"
import { logOrderStatusChange } from "./order-activity-service"
import { updateProductStock } from "./product-service"

export interface OrderStatusUpdate {
  orderId: string
  newStatus: string
  userId: string
  userName?: string
  reason?: string
  notes?: string
}

export interface OrderItem {
  productId: string
  quantity: number
  price: number
  name: string
}

export interface Order {
  id: string
  status: string
  items: OrderItem[]
  userId: string
  totalAmount: number
  createdAt: any
  updatedAt: any
}

// Valid status transitions
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["approved", "rejected", "cancelled"],
  approved: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["completed", "returned"],
  completed: [],
  cancelled: [],
  rejected: [],
  returned: ["refunded"],
  refunded: [],
}

// Update order status with stock management
export async function updateOrderStatusWithStockManagement(statusUpdate: OrderStatusUpdate): Promise<void> {
  try {
    const { orderId, newStatus, userId, userName, reason, notes } = statusUpdate

    // Get current order data
    const orderRef = doc(db, "orders", orderId)
    const orderDoc = await getDoc(orderRef)

    if (!orderDoc.exists()) {
      throw new Error("Order not found")
    }

    const orderData = orderDoc.data() as Order
    const currentStatus = orderData.status

    // Validate status transition
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`)
    }

    // Handle stock management based on status change
    await handleStockManagement(orderData, currentStatus, newStatus)

    // Update order status
    await updateDoc(orderRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
      ...(notes && { notes }),
    })

    // Log the status change activity
    await logOrderStatusChange(
      orderId,
      currentStatus,
      newStatus,
      userId,
      userName,
      reason || `Status updated to ${newStatus}`,
    )

    console.log(`Order ${orderId} status updated from ${currentStatus} to ${newStatus}`)
  } catch (error) {
    console.error("Error updating order status:", error)
    throw error
  }
}

// Check if status transition is valid
export function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || []
  return validTransitions.includes(newStatus)
}

// Handle stock management based on status changes
async function handleStockManagement(order: Order, currentStatus: string, newStatus: string): Promise<void> {
  try {
    // Deduct stock when order is approved (reserved for customer)
    if (currentStatus === "pending" && newStatus === "approved") {
      for (const item of order.items) {
        await updateProductStock(item.productId, -item.quantity, order.userId, `Stock reserved for order ${order.id}`)
      }
    }

    // Restore stock when order is cancelled or rejected
    if (
      (currentStatus === "approved" || currentStatus === "processing") &&
      (newStatus === "cancelled" || newStatus === "rejected")
    ) {
      for (const item of order.items) {
        await updateProductStock(
          item.productId,
          item.quantity,
          order.userId,
          `Stock restored from ${newStatus} order ${order.id}`,
        )
      }
    }

    // Handle returns - restore stock
    if (newStatus === "returned") {
      for (const item of order.items) {
        await updateProductStock(
          item.productId,
          item.quantity,
          order.userId,
          `Stock restored from returned order ${order.id}`,
        )
      }
    }

    console.log(`Stock management completed for order ${order.id}: ${currentStatus} -> ${newStatus}`)
  } catch (error) {
    console.error("Error in stock management:", error)
    throw error
  }
}

// Get available status transitions for current status
export function getAvailableStatusTransitions(currentStatus: string): string[] {
  return VALID_STATUS_TRANSITIONS[currentStatus] || []
}

// Get status display information
export function getStatusDisplayInfo(status: string): {
  label: string
  color: string
  description: string
} {
  const statusInfo: Record<string, { label: string; color: string; description: string }> = {
    pending: {
      label: "Pending",
      color: "yellow",
      description: "Order is waiting for approval",
    },
    approved: {
      label: "Approved",
      color: "blue",
      description: "Order has been approved and is being prepared",
    },
    processing: {
      label: "Processing",
      color: "purple",
      description: "Order is being processed and prepared for shipment",
    },
    shipped: {
      label: "Shipped",
      color: "indigo",
      description: "Order has been shipped and is on the way",
    },
    delivered: {
      label: "Delivered",
      color: "green",
      description: "Order has been delivered to the customer",
    },
    completed: {
      label: "Completed",
      color: "green",
      description: "Order has been completed successfully",
    },
    cancelled: {
      label: "Cancelled",
      color: "red",
      description: "Order has been cancelled",
    },
    rejected: {
      label: "Rejected",
      color: "red",
      description: "Order has been rejected",
    },
    returned: {
      label: "Returned",
      color: "orange",
      description: "Order has been returned by the customer",
    },
    refunded: {
      label: "Refunded",
      color: "gray",
      description: "Order has been refunded",
    },
  }

  return (
    statusInfo[status] || {
      label: status,
      color: "gray",
      description: "Unknown status",
    }
  )
}

// Bulk update order statuses
export async function bulkUpdateOrderStatuses(
  updates: OrderStatusUpdate[],
): Promise<{ success: string[]; failed: { orderId: string; error: string }[] }> {
  const results = {
    success: [] as string[],
    failed: [] as { orderId: string; error: string }[],
  }

  for (const update of updates) {
    try {
      await updateOrderStatusWithStockManagement(update)
      results.success.push(update.orderId)
    } catch (error) {
      results.failed.push({
        orderId: update.orderId,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  return results
}

// Get order status history
export async function getOrderStatusHistory(orderId: string): Promise<any[]> {
  try {
    // This would typically fetch from order_activities collection
    // For now, return empty array as placeholder
    return []
  } catch (error) {
    console.error("Error getting order status history:", error)
    throw error
  }
}

// Validate order before status change
export async function validateOrderForStatusChange(
  orderId: string,
  newStatus: string,
): Promise<{ valid: boolean; reason?: string }> {
  try {
    const orderRef = doc(db, "orders", orderId)
    const orderDoc = await getDoc(orderRef)

    if (!orderDoc.exists()) {
      return { valid: false, reason: "Order not found" }
    }

    const orderData = orderDoc.data() as Order
    const currentStatus = orderData.status

    if (!isValidStatusTransition(currentStatus, newStatus)) {
      return {
        valid: false,
        reason: `Cannot change status from ${currentStatus} to ${newStatus}`,
      }
    }

    // Additional validation logic can be added here
    // For example, checking if payment is received before shipping

    return { valid: true }
  } catch (error) {
    console.error("Error validating order for status change:", error)
    return { valid: false, reason: "Validation error" }
  }
}
