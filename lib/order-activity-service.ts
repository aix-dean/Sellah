import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore"
import { db } from "./firebase"

// Order Activity Interface
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
    | "order_delivered"
  old_value?: string
  new_value: string
  description: string
  timestamp?: any
  metadata?: Record<string, any>
}

// Order Activity Service Class
class OrderActivityService {
  private collectionName = "order_activities"

  // Create a new activity
  async createActivity(activity: Omit<OrderActivity, "id" | "timestamp">) {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...activity,
        timestamp: new Date(),
      })

      return {
        id: docRef.id,
        ...activity,
        timestamp: new Date(),
      }
    } catch (error) {
      console.error("Error creating order activity:", error)
      throw error
    }
  }

  // Get activities for a specific order
  async getOrderActivities(
    orderId: string,
    options: {
      limit?: number
      startAfterDoc?: any
      activityType?: string
    } = {},
  ) {
    try {
      const { limit: pageLimit = 20, startAfterDoc, activityType } = options

      let q = query(
        collection(db, this.collectionName),
        where("order_id", "==", orderId),
        orderBy("timestamp", "desc"),
        limit(pageLimit),
      )

      if (activityType) {
        q = query(
          collection(db, this.collectionName),
          where("order_id", "==", orderId),
          where("activity_type", "==", activityType),
          orderBy("timestamp", "desc"),
          limit(pageLimit),
        )
      }

      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc))
      }

      const querySnapshot = await getDocs(q)
      const activities = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as OrderActivity[]

      return {
        activities,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: querySnapshot.docs.length === pageLimit,
      }
    } catch (error) {
      console.error("Error getting order activities:", error)
      throw error
    }
  }

  // Get activity by ID
  async getActivityById(activityId: string) {
    try {
      const docRef = doc(db, this.collectionName, activityId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        throw new Error("Activity not found")
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as OrderActivity
    } catch (error) {
      console.error("Error getting activity:", error)
      throw error
    }
  }

  // Update activity
  async updateActivity(activityId: string, updates: Partial<OrderActivity>) {
    try {
      const docRef = doc(db, this.collectionName, activityId)
      await updateDoc(docRef, {
        ...updates,
        updated_at: new Date(),
      })

      return { success: true, message: "Activity updated successfully" }
    } catch (error) {
      console.error("Error updating activity:", error)
      throw error
    }
  }

  // Delete activity
  async deleteActivity(activityId: string) {
    try {
      const docRef = doc(db, this.collectionName, activityId)
      await deleteDoc(docRef)

      return { success: true, message: "Activity deleted successfully" }
    } catch (error) {
      console.error("Error deleting activity:", error)
      throw error
    }
  }

  // Get order lifecycle summary
  async getOrderLifecycleSummary(orderId: string) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where("order_id", "==", orderId),
        where("activity_type", "==", "status_change"),
        orderBy("timestamp", "asc"),
      )

      const querySnapshot = await getDocs(q)
      const statusChanges = querySnapshot.docs.map((doc) => doc.data())

      return {
        total_status_changes: statusChanges.length,
        status_timeline: statusChanges,
        current_status: statusChanges[statusChanges.length - 1]?.new_value || "unknown",
        created_at: statusChanges[0]?.timestamp || null,
        last_updated: statusChanges[statusChanges.length - 1]?.timestamp || null,
      }
    } catch (error) {
      console.error("Error getting order lifecycle summary:", error)
      throw error
    }
  }

  // Get activities by user
  async getActivitiesByUser(
    userId: string,
    options: {
      limit?: number
      startAfterDoc?: any
    } = {},
  ) {
    try {
      const { limit: pageLimit = 20, startAfterDoc } = options

      let q = query(
        collection(db, this.collectionName),
        where("user_id", "==", userId),
        orderBy("timestamp", "desc"),
        limit(pageLimit),
      )

      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc))
      }

      const querySnapshot = await getDocs(q)
      const activities = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as OrderActivity[]

      return {
        activities,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: querySnapshot.docs.length === pageLimit,
      }
    } catch (error) {
      console.error("Error getting activities by user:", error)
      throw error
    }
  }
}

// Create singleton instance
export const orderActivityService = new OrderActivityService()

// Helper function to log order status changes
export async function logOrderStatusChange(
  orderId: string,
  oldStatus: string,
  newStatus: string,
  userId = "system",
  metadata?: Record<string, any>,
) {
  return await orderActivityService.createActivity({
    order_id: orderId,
    user_id: userId,
    activity_type: "status_change",
    old_value: oldStatus,
    new_value: newStatus,
    description: `Order status changed from ${oldStatus} to ${newStatus}`,
    metadata,
  })
}

// Helper function to log payment updates
export async function logPaymentReceived(
  orderId: string,
  amount: number,
  paymentMethod: string,
  userId = "system",
  metadata?: Record<string, any>,
) {
  return await orderActivityService.createActivity({
    order_id: orderId,
    user_id: userId,
    activity_type: "payment_update",
    new_value: `Payment received: $${amount} via ${paymentMethod}`,
    description: `Payment of $${amount} received via ${paymentMethod}`,
    metadata: {
      amount,
      payment_method: paymentMethod,
      ...metadata,
    },
  })
}

// Helper function to log shipping updates
export async function logShippingUpdate(
  orderId: string,
  trackingNumber: string,
  carrier: string,
  userId = "system",
  metadata?: Record<string, any>,
) {
  return await orderActivityService.createActivity({
    order_id: orderId,
    user_id: userId,
    activity_type: "shipping_update",
    new_value: `Shipped via ${carrier} - Tracking: ${trackingNumber}`,
    description: `Order shipped via ${carrier} with tracking number ${trackingNumber}`,
    metadata: {
      tracking_number: trackingNumber,
      carrier,
      ...metadata,
    },
  })
}

// Helper function to log order delivery
export async function logOrderDelivered(
  orderId: string,
  deliveryMethod = "standard",
  userId = "system",
  metadata?: Record<string, any>,
) {
  return await orderActivityService.createActivity({
    order_id: orderId,
    user_id: userId,
    activity_type: "order_delivered",
    new_value: `Order delivered via ${deliveryMethod}`,
    description: `Order successfully delivered via ${deliveryMethod}`,
    metadata: {
      delivery_method: deliveryMethod,
      delivered_at: new Date().toISOString(),
      ...metadata,
    },
  })
}

// Helper functions for UI display
export function getActivityIcon(activityType: string): string {
  switch (activityType) {
    case "order_created":
      return "📦"
    case "status_change":
      return "🔄"
    case "payment_update":
      return "💳"
    case "shipping_update":
      return "🚚"
    case "note_added":
      return "📝"
    case "order_updated":
      return "✏️"
    case "order_delivered":
      return "✅"
    default:
      return "📋"
  }
}

export function getActivityColor(activityType: string): string {
  switch (activityType) {
    case "order_created":
      return "blue"
    case "status_change":
      return "purple"
    case "payment_update":
      return "green"
    case "shipping_update":
      return "orange"
    case "note_added":
      return "gray"
    case "order_updated":
      return "yellow"
    case "order_delivered":
      return "green"
    default:
      return "gray"
  }
}

export function getActivityPriority(activityType: string): number {
  switch (activityType) {
    case "order_created":
      return 1
    case "payment_update":
      return 2
    case "status_change":
      return 3
    case "shipping_update":
      return 4
    case "order_delivered":
      return 5
    case "order_updated":
      return 6
    case "note_added":
      return 7
    default:
      return 8
  }
}

// Backward compatibility
export const addOrderActivity = orderActivityService.createActivity.bind(orderActivityService)
