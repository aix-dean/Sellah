import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from "firebase/firestore"
import { db } from "./firebase"
import { notificationService } from "./notification-service"

export interface OrderActivity {
  id?: string
  order_id: string
  user_id: string
  activity_type:
    | "order_created"
    | "status_change"
    | "payment_update"
    | "shipping_update"
    | "note_added"
    | "order_updated"
  old_value?: string
  new_value: string
  description: string
  timestamp?: any
  metadata?: Record<string, any>
}

export const orderActivityService = {
  // Create a new activity record
  async createActivity(activity: Omit<OrderActivity, "id" | "timestamp">) {
    try {
      const activityRef = await addDoc(collection(db, "order_activities"), {
        ...activity,
        timestamp: serverTimestamp(),
      })

      console.log("Order activity created:", activityRef.id)
      return activityRef.id
    } catch (error) {
      console.error("Error creating order activity:", error)
      throw error
    }
  },

  // Get activities for an order
  async getOrderActivities(orderId: string) {
    try {
      const q = query(
        collection(db, "order_activities"),
        where("order_id", "==", orderId),
        orderBy("timestamp", "desc"),
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as OrderActivity[]
    } catch (error) {
      console.error("Error fetching order activities:", error)
      throw error
    }
  },

  // Get order lifecycle summary
  async getOrderLifecycleSummary(orderId: string) {
    try {
      const activities = await this.getOrderActivities(orderId)

      const statusChanges = activities.filter((a) => a.activity_type === "status_change")
      const currentStatus = statusChanges.length > 0 ? statusChanges[0].new_value : "unknown"
      const createdActivity = activities.find((a) => a.activity_type === "order_created")

      return {
        total_activities: activities.length,
        status_changes: statusChanges.length,
        current_status: currentStatus,
        created_at: createdActivity?.timestamp || null,
      }
    } catch (error) {
      console.error("Error getting order lifecycle summary:", error)
      throw error
    }
  },
}

// Helper functions for common activities
export const logOrderStatusChange = async (
  orderId: string,
  orderNumber: string,
  customerId: string,
  userId: string,
  oldStatus: string,
  newStatus: string,
  metadata?: Record<string, any>,
) => {
  // Create activity record
  await orderActivityService.createActivity({
    order_id: orderId,
    user_id: userId,
    activity_type: "status_change",
    old_value: oldStatus,
    new_value: newStatus,
    description: `Order status changed from ${oldStatus} to ${newStatus}`,
    metadata: {
      order_number: orderNumber,
      ...metadata,
    },
  })

  // Create notification for customer
  if (customerId && customerId !== userId) {
    await notificationService.createOrderStatusNotification(
      orderId,
      orderNumber,
      customerId,
      oldStatus,
      newStatus,
      userId,
    )
  }
}

export const logPaymentReceived = async (
  orderId: string,
  orderNumber: string,
  customerId: string,
  userId: string,
  amount: number,
  paymentMethod: string,
  metadata?: Record<string, any>,
) => {
  // Create activity record
  await orderActivityService.createActivity({
    order_id: orderId,
    user_id: userId,
    activity_type: "payment_update",
    old_value: "pending",
    new_value: "received",
    description: `Payment of ₱${amount.toFixed(2)} received via ${paymentMethod}`,
    metadata: {
      order_number: orderNumber,
      amount,
      payment_method: paymentMethod,
      ...metadata,
    },
  })

  // Create notification for customer
  if (customerId && customerId !== userId) {
    await notificationService.createPaymentNotification(orderId, orderNumber, customerId, "received", amount, userId)
  }
}

export const logShippingUpdate = async (
  orderId: string,
  orderNumber: string,
  customerId: string,
  userId: string,
  trackingNumber: string,
  carrier: string,
  metadata?: Record<string, any>,
) => {
  // Create activity record
  await orderActivityService.createActivity({
    order_id: orderId,
    user_id: userId,
    activity_type: "shipping_update",
    old_value: "",
    new_value: trackingNumber,
    description: `Shipping label created with tracking number ${trackingNumber} via ${carrier}`,
    metadata: {
      order_number: orderNumber,
      tracking_number: trackingNumber,
      carrier,
      ...metadata,
    },
  })
}

// Activity icons and colors
export const getActivityIcon = (activityType: string) => {
  const icons = {
    order_created: "📦",
    status_change: "🔄",
    payment_update: "💳",
    shipping_update: "🚚",
    note_added: "📝",
    order_updated: "✏️",
  }
  return icons[activityType as keyof typeof icons] || "📋"
}

export const getActivityColor = (activityType: string) => {
  const colors = {
    order_created: "bg-blue-100 text-blue-800",
    status_change: "bg-green-100 text-green-800",
    payment_update: "bg-purple-100 text-purple-800",
    shipping_update: "bg-orange-100 text-orange-800",
    note_added: "bg-gray-100 text-gray-800",
    order_updated: "bg-yellow-100 text-yellow-800",
  }
  return colors[activityType as keyof typeof colors] || "bg-gray-100 text-gray-800"
}

export const getActivityPriority = (activityType: string) => {
  const priorities = {
    order_created: 1,
    status_change: 2,
    payment_update: 3,
    shipping_update: 4,
    note_added: 5,
    order_updated: 6,
  }
  return priorities[activityType as keyof typeof priorities] || 10
}

// Backward compatibility
export const addOrderActivity = orderActivityService.createActivity
