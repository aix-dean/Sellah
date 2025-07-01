import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, doc, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase"

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
    | "item_added"
    | "item_removed"
    | "address_updated"
    | "refund_processed"
    | "cancellation_requested"
  old_value?: string
  new_value: string
  description: string
  timestamp: Timestamp // Using Firestore Timestamp type
  metadata?: {
    ip_address?: string
    user_agent?: string
    location?: string
    user_name?: string
    order_number?: string
    total_amount?: number
    item_count?: number
    customer_name?: string
    tracking_number?: string
    payment_method?: string
    refund_amount?: number
    cancellation_reason?: string
    created_at?: Timestamp // Using Firestore Timestamp type
    [key: string]: any
  }
}

export interface OrderLifecycleEvent {
  status: string
  timestamp: Timestamp // Using Firestore Timestamp type
  description: string
  user_id: string
  user_name: string
  metadata?: Record<string, any>
}

class OrderActivityService {
  private collectionName = "order_activity"
  private initialized = false

  // Helper function to ensure we have a Firestore Timestamp
  private ensureTimestamp(value: any): Timestamp {
    if (value instanceof Timestamp) {
      return value
    }

    if (value && typeof value.toDate === "function") {
      // Already a Firestore Timestamp-like object
      return value as Timestamp
    }

    if (value instanceof Date) {
      return Timestamp.fromDate(value)
    }

    if (typeof value === "number") {
      // Convert Unix timestamp (seconds since epoch) to Timestamp
      return Timestamp.fromMillis(value * 1000)
    }

    if (typeof value === "string") {
      // Parse date string to Timestamp
      return Timestamp.fromDate(new Date(value))
    }

    // Default to current time
    return Timestamp.now()
  }

  // Initialize the order activity collection if it doesn't exist
  async initializeCollection(): Promise<void> {
    if (this.initialized) return

    try {
      // Check if collection exists by trying to read from it
      const testQuery = query(collection(db, this.collectionName), where("order_id", "==", "test"))
      await getDocs(testQuery)

      this.initialized = true
      console.log("Order activity collection is ready")
    } catch (error) {
      console.log("Initializing order activity collection...")

      // Create a sample document to initialize the collection
      const sampleActivity: Omit<OrderActivity, "id"> = {
        order_id: "INIT_SAMPLE",
        user_id: "system",
        activity_type: "order_created",
        new_value: "initialized",
        description: "Order activity collection initialized",
        timestamp: Timestamp.now(),
        metadata: {
          user_name: "System",
          initialization: true,
          created_at: Timestamp.now(),
        },
      }

      await addDoc(collection(db, this.collectionName), sampleActivity)
      this.initialized = true
      console.log("Order activity collection created successfully")
    }
  }

  // Create a new order activity record
  async createActivity(activity: Omit<OrderActivity, "id" | "timestamp">): Promise<OrderActivity> {
    await this.initializeCollection()

    try {
      const now = Timestamp.now()

      const activityData: Omit<OrderActivity, "id"> = {
        ...activity,
        timestamp: now,
        metadata: {
          ...activity.metadata,
          created_at: now,
          source: "order_activity_service",
        },
      }

      const docRef = await addDoc(collection(db, this.collectionName), activityData)
      const createdActivity = { id: docRef.id, ...activityData }

      console.log(`Created activity: ${activity.activity_type} for order ${activity.order_id}`)
      return createdActivity
    } catch (error) {
      console.error("Error creating order activity:", error)
      throw new Error(`Failed to create order activity: ${error}`)
    }
  }

  // Get all activities for a specific order
  async getOrderActivities(orderId: string): Promise<OrderActivity[]> {
    await this.initializeCollection()

    try {
      const activitiesRef = collection(db, this.collectionName)

      // Try to use orderBy first
      try {
        const q = query(activitiesRef, where("order_id", "==", orderId), orderBy("timestamp", "desc"))

        const querySnapshot = await getDocs(q)
        const activities: OrderActivity[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          // Filter out initialization sample
          if (data.order_id !== "INIT_SAMPLE") {
            // Ensure timestamp is a Firestore Timestamp
            const activity = {
              id: doc.id,
              ...data,
              timestamp: this.ensureTimestamp(data.timestamp),
              metadata: {
                ...data.metadata,
                created_at: data.metadata?.created_at ? this.ensureTimestamp(data.metadata.created_at) : undefined,
              },
            } as OrderActivity
            activities.push(activity)
          }
        })

        return activities
      } catch (orderByError) {
        // Fallback to client-side sorting if orderBy fails
        console.log("Using client-side sorting for activities")

        const q = query(activitiesRef, where("order_id", "==", orderId))
        const querySnapshot = await getDocs(q)
        const activities: OrderActivity[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          if (data.order_id !== "INIT_SAMPLE") {
            const activity = {
              id: doc.id,
              ...data,
              timestamp: this.ensureTimestamp(data.timestamp),
              metadata: {
                ...data.metadata,
                created_at: data.metadata?.created_at ? this.ensureTimestamp(data.metadata.created_at) : undefined,
              },
            } as OrderActivity
            activities.push(activity)
          }
        })

        // Sort by timestamp (newest first)
        activities.sort((a, b) => {
          return b.timestamp.toMillis() - a.timestamp.toMillis()
        })

        return activities
      }
    } catch (error) {
      console.error("Error fetching order activities:", error)
      return []
    }
  }

  // Get activities by type
  async getActivitiesByType(orderId: string, activityType: OrderActivity["activity_type"]): Promise<OrderActivity[]> {
    await this.initializeCollection()

    try {
      const activitiesRef = collection(db, this.collectionName)
      const q = query(activitiesRef, where("order_id", "==", orderId), where("activity_type", "==", activityType))

      const querySnapshot = await getDocs(q)
      const activities: OrderActivity[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const activity = {
          id: doc.id,
          ...data,
          timestamp: this.ensureTimestamp(data.timestamp),
          metadata: {
            ...data.metadata,
            created_at: data.metadata?.created_at ? this.ensureTimestamp(data.metadata.created_at) : undefined,
          },
        } as OrderActivity
        activities.push(activity)
      })

      return activities.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())
    } catch (error) {
      console.error("Error fetching activities by type:", error)
      return []
    }
  }

  // Create order lifecycle tracking
  async trackOrderLifecycle(orderId: string, event: OrderLifecycleEvent): Promise<void> {
    await this.createActivity({
      order_id: orderId,
      user_id: event.user_id,
      activity_type: "status_change",
      old_value: event.metadata?.old_status,
      new_value: event.status,
      description: event.description,
      metadata: {
        user_name: event.user_name,
        lifecycle_event: true,
        ...event.metadata,
      },
    })
  }

  // Batch create activities for order initialization
  async initializeOrderHistory(orderId: string, orderData: any, userId: string): Promise<void> {
    await this.initializeCollection()

    const batch = writeBatch(db)
    const activitiesRef = collection(db, this.collectionName)

    // Convert order creation timestamp to Firestore Timestamp
    const creationTimestamp = this.ensureTimestamp(orderData.created_at)

    // Create order creation activity
    const creationActivity: Omit<OrderActivity, "id"> = {
      order_id: orderId,
      user_id: userId,
      activity_type: "order_created",
      new_value: orderData.status || "pending",
      description: `Order #${orderData.order_number} created with ${orderData.items?.length || 0} item(s)`,
      timestamp: creationTimestamp,
      metadata: {
        order_number: orderData.order_number,
        total_amount: orderData.total_amount,
        item_count: orderData.items?.length || 0,
        customer_name: orderData.customer_name,
        payment_method: orderData.payment_method,
        user_name: "System",
        initialization: true,
        created_at: creationTimestamp,
      },
    }

    const creationDocRef = doc(activitiesRef)
    batch.set(creationDocRef, creationActivity)

    // Create initial status activity if different from creation
    if (orderData.status && orderData.status !== "pending") {
      const statusActivity: Omit<OrderActivity, "id"> = {
        order_id: orderId,
        user_id: userId,
        activity_type: "status_change",
        old_value: "pending",
        new_value: orderData.status,
        description: `Order status set to ${orderData.status}`,
        timestamp: creationTimestamp,
        metadata: {
          user_name: "System",
          initialization: true,
          created_at: creationTimestamp,
        },
      }

      const statusDocRef = doc(activitiesRef)
      batch.set(statusDocRef, statusActivity)
    }

    await batch.commit()
    console.log(`Initialized order history for order: ${orderId}`)
  }

  // Get order lifecycle summary
  async getOrderLifecycleSummary(orderId: string): Promise<{
    created_at: Date | null
    current_status: string | null
    status_changes: number
    total_activities: number
    last_activity: Date | null
  }> {
    const activities = await this.getOrderActivities(orderId)

    const creationActivity = activities.find((a) => a.activity_type === "order_created")
    const statusChanges = activities.filter((a) => a.activity_type === "status_change")
    const lastActivity = activities.length > 0 ? activities[0] : null

    return {
      created_at: creationActivity?.timestamp?.toDate() || null,
      current_status: statusChanges.length > 0 ? statusChanges[0].new_value : null,
      status_changes: statusChanges.length,
      total_activities: activities.length,
      last_activity: lastActivity?.timestamp?.toDate() || null,
    }
  }
}

// Export singleton instance
export const orderActivityService = new OrderActivityService()

// Helper functions for activity types
export const getActivityIcon = (activityType: OrderActivity["activity_type"]): string => {
  const icons = {
    order_created: "🆕",
    status_change: "📋",
    payment_update: "💳",
    shipping_update: "🚚",
    note_added: "📝",
    order_updated: "✏️",
    item_added: "��",
    item_removed: "➖",
    address_updated: "📍",
    refund_processed: "💰",
    cancellation_requested: "❌",
  }
  return icons[activityType] || "📌"
}

export const getActivityColor = (activityType: OrderActivity["activity_type"]): string => {
  const colors = {
    order_created: "bg-blue-100 text-blue-800",
    status_change: "bg-purple-100 text-purple-800",
    payment_update: "bg-green-100 text-green-800",
    shipping_update: "bg-orange-100 text-orange-800",
    note_added: "bg-gray-100 text-gray-800",
    order_updated: "bg-yellow-100 text-yellow-800",
    item_added: "bg-emerald-100 text-emerald-800",
    item_removed: "bg-red-100 text-red-800",
    address_updated: "bg-indigo-100 text-indigo-800",
    refund_processed: "bg-green-100 text-green-800",
    cancellation_requested: "bg-red-100 text-red-800",
  }
  return colors[activityType] || "bg-gray-100 text-gray-800"
}

export const getActivityPriority = (activityType: OrderActivity["activity_type"]): number => {
  const priorities = {
    order_created: 1,
    status_change: 2,
    payment_update: 3,
    shipping_update: 4,
    cancellation_requested: 5,
    refund_processed: 6,
    order_updated: 7,
    item_added: 8,
    item_removed: 8,
    address_updated: 9,
    note_added: 10,
  }
  return priorities[activityType] || 10
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
