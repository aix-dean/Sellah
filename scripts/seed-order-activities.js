import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore"

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
}

// Add error checking
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("Missing required Firebase configuration environment variables")
  process.exit(1)
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Status progression for orders
const statusProgression = [
  { status: "pending", description: "Order received and pending processing" },
  { status: "confirmed", description: "Order confirmed and payment verified" },
  { status: "processing", description: "Order is being processed and prepared for shipping" },
  { status: "shipped", description: "Order has been shipped" },
  { status: "delivered", description: "Order has been delivered to the customer" },
  { status: "completed", description: "Order completed successfully" },
]

// Alternative paths
const alternativePaths = [
  [
    { status: "pending", description: "Order received and pending processing" },
    { status: "cancelled", description: "Order cancelled by customer" },
  ],
  [
    { status: "pending", description: "Order received and pending processing" },
    { status: "confirmed", description: "Order confirmed and payment verified" },
    { status: "cancelled", description: "Order cancelled due to payment issues" },
  ],
]

// Generate a random Unix timestamp within the past 30 days
function getRandomUnixTimestamp(daysAgo = 30) {
  const now = Math.floor(Date.now() / 1000) // Current Unix timestamp
  const pastTimestamp = now - Math.floor(Math.random() * daysAgo * 24 * 60 * 60)
  return pastTimestamp
}

// Add hours to a Unix timestamp
function addHours(unixTimestamp, hours) {
  return unixTimestamp + hours * 60 * 60
}

// Convert Firestore timestamp to Unix timestamp
function toUnixTimestamp(firestoreTimestamp) {
  if (firestoreTimestamp && typeof firestoreTimestamp.toDate === "function") {
    return Math.floor(firestoreTimestamp.toDate().getTime() / 1000)
  }
  if (firestoreTimestamp instanceof Date) {
    return Math.floor(firestoreTimestamp.getTime() / 1000)
  }
  if (typeof firestoreTimestamp === "string") {
    return Math.floor(new Date(firestoreTimestamp).getTime() / 1000)
  }
  // Default to current time
  return Math.floor(Date.now() / 1000)
}

// Create activity records for an order
async function createActivitiesForOrder(order, userId) {
  try {
    console.log(`Creating activities for order: ${order.id} (${order.order_number})`)

    // Determine if this order follows the normal path or an alternative path
    const usePath =
      Math.random() > 0.7 ? alternativePaths[Math.floor(Math.random() * alternativePaths.length)] : statusProgression

    // Convert order creation timestamp to Unix timestamp
    const orderCreatedTimestamp = toUnixTimestamp(order.created_at)

    // Create order_created activity
    const createdActivity = {
      order_id: order.id,
      user_id: userId,
      activity_type: "order_created",
      new_value: "pending",
      description: `Order #${order.order_number} created with ${order.items.length} item(s)`,
      timestamp: orderCreatedTimestamp, // Unix timestamp
      metadata: {
        order_number: order.order_number,
        total_amount: order.total_amount,
        item_count: order.items.length,
        customer_name: order.customer_name,
        user_name: "System",
      },
    }

    await addDoc(collection(db, "order_activity"), createdActivity)
    console.log("Created order_created activity")

    // Create status change activities
    let lastTimestamp = orderCreatedTimestamp
    let previousStatus = "pending"

    for (let i = 1; i < usePath.length; i++) {
      const status = usePath[i]
      // Add random hours (1-24) to the previous timestamp
      lastTimestamp = addHours(lastTimestamp, Math.floor(Math.random() * 24) + 1)

      const statusActivity = {
        order_id: order.id,
        user_id: userId,
        activity_type: "status_change",
        old_value: previousStatus,
        new_value: status.status,
        description: `Order status changed from ${previousStatus} to ${status.status}`,
        timestamp: lastTimestamp, // Unix timestamp
        metadata: {
          order_number: order.order_number,
          user_name: "Admin User",
          note: status.description,
        },
      }

      await addDoc(collection(db, "order_activity"), statusActivity)
      console.log(`Created status_change activity: ${previousStatus} -> ${status.status}`)

      previousStatus = status.status
    }

    // Add some notes for certain orders
    if (Math.random() > 0.5) {
      const noteActivity = {
        order_id: order.id,
        user_id: userId,
        activity_type: "note_added",
        new_value: "Customer requested special packaging",
        description: "Note added: Customer requested special packaging",
        timestamp: addHours(lastTimestamp, Math.floor(Math.random() * 12) + 1), // Unix timestamp
        metadata: {
          user_name: "Admin User",
          full_note: "Customer requested special packaging for this order. Please use extra bubble wrap.",
        },
      }

      await addDoc(collection(db, "order_activity"), noteActivity)
      console.log("Created note_added activity")
    }

    // Add shipping update for shipped orders
    if (usePath.some((p) => p.status === "shipped")) {
      const shippingActivity = {
        order_id: order.id,
        user_id: userId,
        activity_type: "shipping_update",
        new_value: "in_transit",
        description: "Package is in transit with carrier",
        timestamp: addHours(lastTimestamp, Math.floor(Math.random() * 12) + 1), // Unix timestamp
        metadata: {
          user_name: "System",
          tracking_number: `TRK${Math.floor(Math.random() * 1000000)}`,
          carrier: "Express Delivery",
        },
      }

      await addDoc(collection(db, "order_activity"), shippingActivity)
      console.log("Created shipping_update activity")
    }

    console.log(`Completed activities for order: ${order.id}`)
    return true
  } catch (error) {
    console.error(`Error creating activities for order ${order.id}:`, error)
    return false
  }
}

// Main function to seed activities
async function seedOrderActivities() {
  try {
    console.log("Starting to seed order activities with Unix timestamps...")

    // Get all orders
    const ordersSnapshot = await getDocs(collection(db, "orders"))
    const orders = []
    ordersSnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() })
    })

    console.log(`Found ${orders.length} orders to process`)

    // Get a user ID to use for activities
    const usersSnapshot = await getDocs(collection(db, "users"))
    let userId = null
    usersSnapshot.forEach((doc) => {
      if (!userId) userId = doc.id
    })

    if (!userId) {
      console.error("No users found in the database")
      return
    }

    console.log(`Using user ID: ${userId} for activities`)

    // Process each order
    let successCount = 0
    for (const order of orders) {
      const success = await createActivitiesForOrder(order, userId)
      if (success) successCount++
    }

    console.log(`Successfully created activities for ${successCount} out of ${orders.length} orders`)
    console.log("All timestamps are now stored as Unix timestamps (seconds since epoch)")
  } catch (error) {
    console.error("Error seeding order activities:", error)
  }
}

// Run the seed function
seedOrderActivities()
  .then(() => console.log("Order activities seeding with Unix timestamps completed"))
  .catch((error) => console.error("Error in seeding process:", error))
