import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
  Timestamp,
  writeBatch,
  limit,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface OrderActivity {
  id?: string
  orderId: string
  type: "status_change" | "note" | "payment" | "shipping" | "refund" | "cancellation" | "other"
  description: string
  details?: Record<string, any>
  userId: string
  userName?: string
  timestamp: any
  metadata?: {
    previousStatus?: string
    newStatus?: string
    amount?: number
    paymentMethod?: string
    trackingNumber?: string
    reason?: string
  }
}

export interface OrderLifecycleEvent {
  status: string
  timestamp: Timestamp
  description: string
  userId: string
  user_name: string
  metadata?: Record<string, any>
}

class OrderActivityService {
  private collectionName = "order_activities"
  private initialized = false

  // Helper function to ensure we have a Firestore Timestamp
  private ensureTimestamp(value: any): Timestamp {
    if (value instanceof Timestamp) {
      return value
    }

    if (value && typeof value.toDate === "function") {
      return value as Timestamp
    }

    if (value instanceof Date) {
      return Timestamp.fromDate(value)
    }

    if (typeof value === "number") {
      return Timestamp.fromMillis(value * 1000)
    }

    if (typeof value === "string") {
      return Timestamp.fromDate(new Date(value))
    }

    return Timestamp.now()
  }

  // Initialize the order activity collection if it doesn't exist
  async initializeCollection(): Promise<void> {
    if (this.initialized) return

    try {
      const testQuery = query(collection(db, this.collectionName), where("orderId", "==", "test"))
      await getDocs(testQuery)

      this.initialized = true
      console.log("Order activity collection is ready")
    } catch (error) {
      console.log("Initializing order activity collection...")

      const sampleActivity: Omit<OrderActivity, "id" | "timestamp"> = {
        orderId: "INIT_SAMPLE",
        type: "other",
        description: "Order activity collection initialized",
        details: {},
        userId: "system",
        metadata: {
          user_name: "System",
          initialization: true,
        },
      }

      await addDoc(collection(db, this.collectionName), {
        ...sampleActivity,
        timestamp: serverTimestamp(),
      })
      this.initialized = true
      console.log("Order activity collection created successfully")
    }
  }

  // Create a new order activity record
  async createActivity(activity: Omit<OrderActivity, "id" | "timestamp">): Promise<string> {
    await this.initializeCollection()

    try {
      const activitiesRef = collection(db, this.collectionName)
      const docRef = await addDoc(activitiesRef, {
        ...activity,
        timestamp: serverTimestamp(),
      })
      console.log(`Created activity: ${activity.type} for order ${activity.orderId}`)
      return docRef.id
    } catch (error) {
      console.error("Error creating order activity:", error)
      throw error
    }
  }

  // Get all activities for a specific order
  async getOrderActivities(orderId: string, limitCount = 50): Promise<OrderActivity[]> {
    await this.initializeCollection()

    try {
      const activitiesRef = collection(db, this.collectionName)
      const q = query(activitiesRef, where("orderId", "==", orderId), orderBy("timestamp", "desc"), limit(limitCount))

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as OrderActivity[]
    } catch (error) {
      console.error("Error fetching order activities:", error)
      return []
    }
  }

  // Get activities by type
  async getActivitiesByType(orderId: string, activityType: string, limitCount = 50): Promise<OrderActivity[]> {
    await this.initializeCollection()

    try {
      const activitiesRef = collection(db, this.collectionName)
      const q = query(
        activitiesRef,
        where("orderId", "==", orderId),
        where("type", "==", activityType),
        orderBy("timestamp", "desc"),
        limit(limitCount),
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as OrderActivity[]
    } catch (error) {
      console.error("Error fetching activities by type:", error)
      return []
    }
  }

  // Create order lifecycle tracking
  async trackOrderLifecycle(orderId: string, event: OrderLifecycleEvent): Promise<string> {
    await this.initializeCollection()

    try {
      const activitiesRef = collection(db, this.collectionName)
      const docRef = await addDoc(activitiesRef, {
        orderId: orderId,
        type: "status_change",
        description: event.description,
        details: {
          old_status: event.metadata?.old_status,
          new_status: event.status,
        },
        userId: event.userId,
        userName: event.user_name,
        timestamp: serverTimestamp(),
        metadata: {
          user_name: event.user_name,
          lifecycle_event: true,
          ...event.metadata,
        },
      })

      // Update the order's last activity timestamp
      const orderRef = doc(db, "orders", orderId)
      await updateDoc(orderRef, {
        lastActivityAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      console.log(`Tracked lifecycle event: ${event.status} for order ${orderId}`)
      return docRef.id
    } catch (error) {
      console.error("Error tracking order lifecycle:", error)
      throw error
    }
  }

  // Batch create activities for order initialization
  async initializeOrderHistory(orderId: string, orderData: any, userId: string): Promise<void> {
    await this.initializeCollection()

    const batch = writeBatch(db)
    const activitiesRef = collection(db, this.collectionName)

    const creationTimestamp = this.ensureTimestamp(orderData.created_at)

    const creationActivity: Omit<OrderActivity, "id" | "timestamp"> = {
      orderId: orderId,
      type: "other",
      description: `Order #${orderData.order_number} created with ${orderData.items?.length || 0} item(s)`,
      details: {
        status: orderData.status || "pending",
        order_number: orderData.order_number,
        total_amount: orderData.total_amount,
        item_count: orderData.items?.length || 0,
        customer_name: orderData.customer_name,
        payment_method: orderData.payment_method,
      },
      userId: userId,
      userName: "System",
      metadata: {
        initialization: true,
      },
    }

    const creationDocRef = doc(activitiesRef)
    batch.set(creationDocRef, {
      ...creationActivity,
      timestamp: creationTimestamp,
    })

    if (orderData.status && orderData.status !== "pending") {
      const statusActivity: Omit<OrderActivity, "id" | "timestamp"> = {
        orderId: orderId,
        type: "status_change",
        description: `Order status set to ${orderData.status}`,
        details: {
          old_status: "pending",
          new_status: orderData.status,
        },
        userId: userId,
        userName: "System",
        metadata: {
          initialization: true,
        },
      }

      const statusDocRef = doc(activitiesRef)
      batch.set(statusDocRef, {
        ...statusActivity,
        timestamp: creationTimestamp,
      })
    }

    await batch.commit()
    console.log(`Initialized order history for order: ${orderId}`)
  }

  // Get order lifecycle summary
  async getOrderLifecycleSummary(orderId: string): Promise<{
    createdAt: Date | null
    currentStatus: string | null
    statusChanges: number
    totalActivities: number
    lastActivity: Date | null
  }> {
    const activities = await this.getOrderActivities(orderId)

    const creationActivity = activities.find((a) => a.type === "other")
    const statusChanges = activities.filter((a) => a.type === "status_change")
    const lastActivity = activities.length > 0 ? activities[0] : null

    return {
      createdAt: creationActivity?.timestamp?.toDate() || null,
      currentStatus: statusChanges.length > 0 ? statusChanges[0].details?.new_status : null,
      statusChanges: statusChanges.length,
      totalActivities: activities.length,
      lastActivity: lastActivity?.timestamp?.toDate() || null,
    }
  }

  // Get all activities for a specific user
  async getUserActivities(userId: string, limitCount = 50): Promise<OrderActivity[]> {
    await this.initializeCollection()

    try {
      const activitiesRef = collection(db, this.collectionName)
      const q = query(activitiesRef, where("userId", "==", userId), orderBy("timestamp", "desc"), limit(limitCount))

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as OrderActivity[]
    } catch (error) {
      console.error("Error fetching user activities:", error)
      return []
    }
  }

  // Get activities for multiple orders
  async getOrdersActivities(orderIds: string[], limitCount = 100): Promise<Record<string, OrderActivity[]>> {
    try {
      if (orderIds.length === 0) return {}

      const q = query(
        collection(db, this.collectionName),
        where("orderId", "in", orderIds),
        orderBy("timestamp", "desc"),
        limit(limitCount),
      )

      const querySnapshot = await getDocs(q)
      const activitiesByOrder: Record<string, OrderActivity[]> = {}

      // Initialize empty arrays for each order
      orderIds.forEach((orderId) => {
        activitiesByOrder[orderId] = []
      })

      querySnapshot.forEach((doc) => {
        const activity = {
          id: doc.id,
          ...doc.data(),
        } as OrderActivity

        if (activitiesByOrder[activity.orderId]) {
          activitiesByOrder[activity.orderId].push(activity)
        }
      })

      return activitiesByOrder
    } catch (error) {
      console.error("Error getting orders activities:", error)
      throw error
    }
  }

  // Update activity (for corrections or additional details)
  async updateOrderActivity(activityId: string, updates: Partial<OrderActivity>): Promise<void> {
    try {
      const activityRef = doc(db, this.collectionName, activityId)
      await updateDoc(activityRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      })

      console.log("Order activity updated:", activityId)
    } catch (error) {
      console.error("Error updating order activity:", error)
      throw error
    }
  }

  // Get activity statistics for an order
  async getOrderActivityStats(orderId: string): Promise<{
    totalActivities: number
    statusChanges: number
    payments: number
    notes: number
    lastActivity?: OrderActivity
  }> {
    try {
      const activities = await this.getOrderActivities(orderId, 100)

      const stats = {
        totalActivities: activities.length,
        statusChanges: activities.filter((a) => a.type === "status_change").length,
        payments: activities.filter((a) => a.type === "payment").length,
        notes: activities.filter((a) => a.type === "note").length,
        lastActivity: activities[0], // Most recent activity
      }

      return stats
    } catch (error) {
      console.error("Error getting order activity stats:", error)
      throw error
    }
  }
}

// Export singleton instance
export const orderActivityService = new OrderActivityService()

// Helper functions for activity types
export const getActivityIcon = (activityType: string): string => {
  const icons = {
    other: "🆕",
    status_change: "📋",
    payment: "💳",
    shipping: "🚚",
    refund: "💰",
    cancellation: "🚫",
    note: "📝",
  }
  return icons[activityType] || "📌"
}

export const getActivityColor = (activityType: string): string => {
  const colors = {
    other: "bg-gray-100 text-gray-800",
    status_change: "bg-purple-100 text-purple-800",
    payment: "bg-green-100 text-green-800",
    shipping: "bg-orange-100 text-orange-800",
    refund: "bg-green-100 text-green-800",
    cancellation: "bg-red-100 text-red-800",
    note: "bg-gray-100 text-gray-800",
  }
  return colors[activityType] || "bg-gray-100 text-gray-800"
}

export const getActivityPriority = (activityType: string): number => {
  const priorities = {
    other: 1,
    status_change: 2,
    payment: 3,
    shipping: 4,
    refund: 5,
    cancellation: 6,
    note: 7,
  }
  return priorities[activityType] || 7
}

// Utility functions for timestamp conversion
export const formatTimestamp = (timestamp: Timestamp | null | undefined): string => {
  if (!timestamp) return "N/A"

  const date = timestamp.toDate()
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export const formatRelativeTime = (timestamp: Timestamp | null | undefined): string => {
  if (!timestamp) return "N/A"

  const date = timestamp.toDate()
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatTimestamp(timestamp)
}

// Helper function to get status badge colors (used by components)
export const getStatusBadgeColor = (status: string): string => {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    confirmed: "bg-blue-100 text-blue-800 border-blue-200",
    processing: "bg-purple-100 text-purple-800 border-purple-200",
    shipped: "bg-indigo-100 text-indigo-800 border-indigo-200",
    delivered: "bg-green-100 text-green-800 border-green-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    paid: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800",
  }

  const normalizedStatus = status?.toLowerCase() || ""
  return statusColors[normalizedStatus as keyof typeof statusColors] || "bg-gray-100 text-gray-800 border-gray-200"
}

// Log status change activity
export async function logOrderStatusChange(
  orderId: string,
  previousStatus: string,
  newStatus: string,
  userId: string,
  userName?: string,
  reason?: string,
): Promise<string> {
  const description = `Order status changed from ${previousStatus} to ${newStatus}`
  const details = {
    previousStatus,
    newStatus,
    reason: reason || "Status updated",
  }

  return orderActivityService.createActivity({
    orderId,
    type: "status_change",
    description,
    details,
    userId,
    userName,
    metadata: {
      previousStatus,
      newStatus,
      reason,
    },
  })
}

// Log payment activity
export async function logPaymentReceived(
  orderId: string,
  amount: number,
  paymentMethod: string,
  userId: string,
  userName?: string,
  transactionId?: string,
): Promise<string> {
  const description = `Payment of $${amount.toFixed(2)} received via ${paymentMethod}`
  const details = {
    amount,
    paymentMethod,
    transactionId: transactionId || "",
  }

  return orderActivityService.createActivity({
    orderId,
    type: "payment",
    description,
    details,
    userId,
    userName,
    metadata: {
      amount,
      paymentMethod,
      transactionId,
    },
  })
}

// Log shipping activity
export async function logItemShipped(
  orderId: string,
  trackingNumber: string,
  carrier: string,
  userId: string,
  userName?: string,
): Promise<string> {
  const description = `Order shipped via ${carrier} (Tracking: ${trackingNumber})`
  const details = {
    trackingNumber,
    carrier,
    shippedAt: new Date().toISOString(),
  }

  return orderActivityService.createActivity({
    orderId,
    type: "shipping",
    description,
    details,
    userId,
    userName,
    metadata: {
      trackingNumber,
      carrier,
    },
  })
}

// Log delivery activity
export async function logItemDelivered(
  orderId: string,
  userId: string,
  userName?: string,
  deliveryNotes?: string,
): Promise<string> {
  const description = "Order delivered successfully"
  const details = {
    deliveredAt: new Date().toISOString(),
    deliveryNotes: deliveryNotes || "",
  }

  return orderActivityService.createActivity({
    orderId,
    type: "shipping",
    description,
    details,
    userId,
    userName,
    metadata: {
      deliveryNotes,
    },
  })
}

// Log refund activity
export async function logRefundIssued(
  orderId: string,
  amount: number,
  reason: string,
  userId: string,
  userName?: string,
  refundMethod?: string,
): Promise<string> {
  const description = `Refund of $${amount.toFixed(2)} issued - ${reason}`
  const details = {
    amount,
    reason,
    refundMethod: refundMethod || "Original payment method",
    refundedAt: new Date().toISOString(),
  }

  return orderActivityService.createActivity({
    orderId,
    type: "refund",
    description,
    details,
    userId,
    userName,
    metadata: {
      amount,
      reason,
      refundMethod,
    },
  })
}

// Log cancellation activity
export async function logOrderCancellation(
  orderId: string,
  reason: string,
  userId: string,
  userName?: string,
  refundAmount?: number,
): Promise<string> {
  const description = `Order cancelled - ${reason}`
  const details = {
    reason,
    cancelledAt: new Date().toISOString(),
    refundAmount: refundAmount || 0,
  }

  return orderActivityService.createActivity({
    orderId,
    type: "cancellation",
    description,
    details,
    userId,
    userName,
    metadata: {
      reason,
      refundAmount,
    },
  })
}

// Log note activity
export async function logOrderNote(
  orderId: string,
  note: string,
  userId: string,
  userName?: string,
  isInternal = false,
): Promise<string> {
  const description = isInternal ? `Internal note: ${note}` : `Note: ${note}`
  const details = {
    note,
    isInternal,
  }

  return orderActivityService.createActivity({
    orderId,
    type: "note",
    description,
    details,
    userId,
    userName,
    metadata: {
      note,
      isInternal,
    },
  })
}

// Get recent activities across all orders for a user
export async function getRecentOrderActivities(userId: string, limitCount = 20): Promise<OrderActivity[]> {
  try {
    const q = query(
      collection(db, "order_activities"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(limitCount),
    )

    const querySnapshot = await getDocs(q)
    const activities: OrderActivity[] = []

    querySnapshot.forEach((doc) => {
      activities.push({
        id: doc.id,
        ...doc.data(),
      } as OrderActivity)
    })

    return activities
  } catch (error) {
    console.error("Error getting recent order activities:", error)
    throw error
  }
}

// Bulk add activities (for migrations or batch operations)
export async function bulkAddOrderActivities(activities: Omit<OrderActivity, "id" | "timestamp">[]): Promise<string[]> {
  try {
    const addedIds: string[] = []

    for (const activity of activities) {
      const activityWithTimestamp = {
        ...activity,
        timestamp: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, "order_activities"), activityWithTimestamp)
      addedIds.push(docRef.id)
    }

    console.log(`Bulk added ${addedIds.length} order activities`)
    return addedIds
  } catch (error) {
    console.error("Error bulk adding order activities:", error)
    throw error
  }
}
