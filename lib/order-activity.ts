import { addOrderActivity, logOrderStatusChange, logOrderNote, logPaymentReceived } from "./order-activity-service"

// Helper functions for common order activities

export async function createOrderCreatedActivity(orderId: string, userId: string, userName?: string): Promise<string> {
  return addOrderActivity(
    orderId,
    "status_change",
    "Order created and is pending approval",
    userId,
    { newStatus: "pending", previousStatus: "none" },
    userName,
  )
}

export async function createOrderApprovedActivity(orderId: string, userId: string, userName?: string): Promise<string> {
  return logOrderStatusChange(orderId, "pending", "approved", userId, userName, "Order approved for processing")
}

export async function createOrderRejectedActivity(
  orderId: string,
  userId: string,
  reason: string,
  userName?: string,
): Promise<string> {
  return logOrderStatusChange(orderId, "pending", "rejected", userId, userName, reason)
}

export async function createOrderShippedActivity(
  orderId: string,
  userId: string,
  trackingNumber?: string,
  userName?: string,
): Promise<string> {
  const description = trackingNumber
    ? `Order shipped with tracking number: ${trackingNumber}`
    : "Order has been shipped"

  return addOrderActivity(orderId, "shipping", description, userId, { trackingNumber: trackingNumber || "" }, userName)
}

export async function createOrderDeliveredActivity(
  orderId: string,
  userId: string,
  userName?: string,
): Promise<string> {
  return addOrderActivity(
    orderId,
    "shipping",
    "Order delivered successfully",
    userId,
    { deliveredAt: new Date().toISOString() },
    userName,
  )
}

export async function createOrderCancelledActivity(
  orderId: string,
  userId: string,
  reason: string,
  userName?: string,
): Promise<string> {
  return addOrderActivity(
    orderId,
    "cancellation",
    `Order cancelled: ${reason}`,
    userId,
    { reason, cancelledAt: new Date().toISOString() },
    userName,
  )
}

export async function createPaymentReceivedActivity(
  orderId: string,
  amount: number,
  paymentMethod: string,
  userId: string,
  userName?: string,
): Promise<string> {
  return logPaymentReceived(orderId, amount, paymentMethod, userId, userName)
}

export async function createOrderNoteActivity(
  orderId: string,
  note: string,
  userId: string,
  userName?: string,
  isInternal = false,
): Promise<string> {
  return logOrderNote(orderId, note, userId, userName, isInternal)
}

// Activity type helpers
export function getActivityIcon(type: string): string {
  switch (type) {
    case "status_change":
      return "🔄"
    case "payment":
      return "💳"
    case "shipping":
      return "📦"
    case "note":
      return "📝"
    case "refund":
      return "💰"
    case "cancellation":
      return "❌"
    default:
      return "ℹ️"
  }
}

export function getActivityColor(type: string): string {
  switch (type) {
    case "status_change":
      return "blue"
    case "payment":
      return "green"
    case "shipping":
      return "purple"
    case "note":
      return "gray"
    case "refund":
      return "orange"
    case "cancellation":
      return "red"
    default:
      return "gray"
  }
}

export function formatActivityDescription(activity: any): string {
  if (activity.type === "status_change" && activity.details) {
    const { previousStatus, newStatus } = activity.details
    return `Status changed from ${previousStatus} to ${newStatus}`
  }

  if (activity.type === "payment" && activity.details) {
    const { amount, paymentMethod } = activity.details
    return `Payment of $${amount?.toFixed(2)} received via ${paymentMethod}`
  }

  return activity.description || "Activity recorded"
}
