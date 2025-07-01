import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  limit,
  startAfter,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
  PackagePlus,
  ClipboardCheck,
  CreditCard,
  Truck,
  FileText,
  Edit,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  type LucideIcon,
} from "lucide-react"

export interface OrderActivityData {
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
  metadata?: Record<string, any>
}

export interface OrderActivity {
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
  timestamp?: Timestamp
  metadata?: {
    ip_address?: string
    user_agent?: string
    location?: string
    user_name?: string
    order_number?: string
    total_amount?: number
    item_count?: number
    customer_name?: string
    created_at?: Timestamp
    timestamp_iso?: string
    [key: string]: any
  }
}

export interface CreateOrderActivityParams {
  orderId: string
  type: string
  description: string
  userId: string
  userName?: string
  metadata?: Record<string, any>
}

// Helper function to clean metadata by removing undefined values
const cleanMetadata = (metadata: Record<string, any> | undefined): Record<string, any> => {
  if (!metadata) return {}

  const cleaned: Record<string, any> = {}

  for (const [key, value] of Object.entries(metadata)) {
    // Only include defined values (null is allowed, undefined is not)
    if (value !== undefined) {
      cleaned[key] = value
    }
  }

  return cleaned
}

// Create a new order activity record with optimized data structure
export const createOrderActivity = async ({
  orderId,
  type,
  description,
  userId,
  userName = "System",
  metadata = {},
}: CreateOrderActivityParams) => {
  console.log("🚀 createOrderActivity called with:", {
    orderId,
    type,
    description,
    userId,
    userName,
    metadata,
  })

  try {
    if (!orderId || !type || !description || !userId) {
      throw new Error("Missing required parameters for order activity")
    }

    // Clean metadata to remove undefined values
    const cleanedMetadata = cleanMetadata(metadata)

    console.log("🧹 Cleaned metadata:", cleanedMetadata)

    const activityData = {
      order_id: orderId,
      user_id: userId,
      activity_type: type,
      new_value: type === "status_change" ? metadata.newStatus || "unknown" : "activity_completed",
      old_value: type === "status_change" ? metadata.oldStatus : undefined,
      description,
      timestamp: Timestamp.now(),
      metadata: {
        user_name: userName,
        created_at: Timestamp.now(),
        source: "order_activity_service",
        ...cleanedMetadata, // Spread cleaned metadata
      },
    }

    // Remove undefined values from the entire activity data
    const cleanedActivityData = cleanMetadata(activityData)

    console.log("📝 Final activity data to be saved:", cleanedActivityData)

    const docRef = await addDoc(collection(db, "order_activity"), cleanedActivityData)

    console.log("✅ Order activity created successfully with ID:", docRef.id)

    return { id: docRef.id, ...cleanedActivityData }
  } catch (error) {
    console.error("❌ Error creating order activity:", error)
    throw new Error(`Failed to create order activity: ${error}`)
  }
}

// Simplified version that returns just the activities array for backward compatibility
export const getOrderActivities = async (orderId: string): Promise<OrderActivity[]> => {
  try {
    const startTime = performance.now()
    const activitiesRef = collection(db, "order_activity")

    // Build query with orderBy for better performance
    const q = query(
      activitiesRef,
      where("order_id", "==", orderId),
      orderBy("timestamp", "desc"),
      limit(100), // Reasonable limit for UI display
    )

    const querySnapshot = await getDocs(q)
    const activities: OrderActivity[] = []

    querySnapshot.forEach((doc) => {
      activities.push({
        id: doc.id,
        ...doc.data(),
      } as OrderActivity)
    })

    const endTime = performance.now()
    console.log(`Fetched ${activities.length} activities in ${Math.round(endTime - startTime)}ms`)

    return activities
  } catch (error) {
    console.error("Error fetching order activities:", error)

    // Fallback to simpler query if the orderBy causes an index error
    try {
      const activitiesRef = collection(db, "order_activity")
      const q = query(activitiesRef, where("order_id", "==", orderId))

      const querySnapshot = await getDocs(q)
      const activities: OrderActivity[] = []

      querySnapshot.forEach((doc) => {
        activities.push({
          id: doc.id,
          ...doc.data(),
        } as OrderActivity)
      })

      // Sort the activities in memory by timestamp (descending - newest first)
      activities.sort((a, b) => {
        const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp || 0)
        const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp || 0)
        return bTime.getTime() - aTime.getTime()
      })

      return activities
    } catch (secondError) {
      console.error("Error in fallback query:", secondError)
      return []
    }
  }
}

// Enhanced version with pagination for future use
export const getOrderActivitiesPaginated = async (
  orderId: string,
  pageSize = 50,
  lastDoc?: QueryDocumentSnapshot<DocumentData>,
): Promise<{
  activities: OrderActivity[]
  lastDoc?: QueryDocumentSnapshot<DocumentData>
  hasMore: boolean
}> => {
  try {
    const startTime = performance.now()
    const activitiesRef = collection(db, "order_activity")

    // Build query with orderBy for better performance
    let q = query(
      activitiesRef,
      where("order_id", "==", orderId),
      orderBy("timestamp", "desc"),
      limit(pageSize + 1), // Get one extra to check if there are more
    )

    // Add pagination if lastDoc is provided
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    const querySnapshot = await getDocs(q)
    const activities: OrderActivity[] = []
    let newLastDoc: QueryDocumentSnapshot<DocumentData> | undefined = undefined
    let hasMore = false

    // Process results
    if (querySnapshot.docs.length > pageSize) {
      // We have more results
      hasMore = true
      querySnapshot.docs.pop() // Remove the extra document
    }

    if (querySnapshot.docs.length > 0) {
      newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1]
    }

    querySnapshot.forEach((doc) => {
      activities.push({
        id: doc.id,
        ...doc.data(),
      } as OrderActivity)
    })

    const endTime = performance.now()
    console.log(`Fetched ${activities.length} activities in ${Math.round(endTime - startTime)}ms`)

    return {
      activities,
      lastDoc: newLastDoc,
      hasMore,
    }
  } catch (error) {
    console.error("Error fetching order activities:", error)
    return {
      activities: [],
      hasMore: false,
    }
  }
}

// Get a specific activity by ID
export const getOrderActivity = async (activityId: string): Promise<OrderActivity | null> => {
  try {
    const activitiesRef = collection(db, "order_activity")
    const q = query(activitiesRef, where("id", "==", activityId), limit(1))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const doc = querySnapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data(),
    } as OrderActivity
  } catch (error) {
    console.error("Error fetching order activity:", error)
    return null
  }
}

// Get activity counts by type for an order
export const getOrderActivityCounts = async (orderId: string): Promise<Record<string, number>> => {
  try {
    const activities = await getOrderActivities(orderId)
    const counts: Record<string, number> = {}

    activities.forEach((activity) => {
      counts[activity.activity_type] = (counts[activity.activity_type] || 0) + 1
    })

    return counts
  } catch (error) {
    console.error("Error getting activity counts:", error)
    return {}
  }
}

// Map of activity types to their corresponding Lucide icons
export const activityIconMap: Record<string, LucideIcon> = {
  order_created: PackagePlus,
  status_change: ClipboardCheck,
  payment_update: CreditCard,
  shipping_update: Truck,
  note_added: FileText,
  order_updated: Edit,
  item_added: PackagePlus,
  item_removed: PackagePlus,
  address_updated: PackagePlus,
  refund_processed: PackagePlus,
  cancellation_requested: PackagePlus,
  default: Package,
}

// Map of status values to their corresponding Lucide icons
export const statusIconMap: Record<string, LucideIcon> = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  completed: CheckCircle,
  cancelled: AlertCircle,
  default: Package,
}

// Helper functions for UI display
export const getActivityIcon = (activityType: OrderActivity["activity_type"]): LucideIcon => {
  return activityIconMap[activityType] || activityIconMap.default
}

export const getStatusIcon = (status: string): LucideIcon => {
  return statusIconMap[status.toLowerCase()] || statusIconMap.default
}

export const getActivityColor = (activityType: OrderActivity["activity_type"]) => {
  switch (activityType) {
    case "order_created":
      return "bg-blue-100 text-blue-800"
    case "status_change":
      return "bg-purple-100 text-purple-800"
    case "payment_update":
      return "bg-green-100 text-green-800"
    case "shipping_update":
      return "bg-orange-100 text-orange-800"
    case "note_added":
      return "bg-gray-100 text-gray-800"
    case "order_updated":
      return "bg-yellow-100 text-yellow-800"
    case "item_added":
      return "bg-green-100 text-green-800"
    case "item_removed":
      return "bg-red-100 text-red-800"
    case "address_updated":
      return "bg-blue-100 text-blue-800"
    case "refund_processed":
      return "bg-yellow-100 text-yellow-800"
    case "cancellation_requested":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

// Helper function to get status badge color
export const getStatusBadgeColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "confirmed":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "processing":
      return "bg-purple-100 text-purple-800 border-purple-200"
    case "shipped":
      return "bg-indigo-100 text-indigo-800 border-indigo-200"
    case "delivered":
      return "bg-green-100 text-green-800 border-green-200"
    case "completed":
      return "bg-green-100 text-green-800 border-green-200"
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}
