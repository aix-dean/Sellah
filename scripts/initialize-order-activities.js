import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs } from "firebase/firestore"
import { orderActivityService } from "../lib/order-activity-service.js"

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

async function initializeOrderActivities() {
  console.log("🚀 Starting order activity initialization...")

  try {
    // Initialize the order activity collection
    await orderActivityService.initializeCollection()
    console.log("✅ Order activity collection initialized")

    // Get all orders
    const ordersSnapshot = await getDocs(collection(db, "orders"))
    const orders = []

    ordersSnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() })
    })

    console.log(`📦 Found ${orders.length} orders to process`)

    // Get a default user ID for system activities
    const usersSnapshot = await getDocs(collection(db, "users"))
    let systemUserId = "system"

    if (!usersSnapshot.empty) {
      systemUserId = usersSnapshot.docs[0].id
    }

    console.log(`👤 Using user ID: ${systemUserId} for system activities`)

    // Process each order
    let processedCount = 0
    let skippedCount = 0

    for (const order of orders) {
      try {
        // Check if activities already exist for this order
        const existingActivities = await orderActivityService.getOrderActivities(order.id)

        if (existingActivities.length > 0) {
          console.log(`⏭️  Skipping order ${order.order_number} - activities already exist`)
          skippedCount++
          continue
        }

        // Initialize order history
        await orderActivityService.initializeOrderHistory(order.id, order, systemUserId)

        // Create additional activities based on order status
        if (order.status && order.status !== "pending") {
          await orderActivityService.createActivity({
            order_id: order.id,
            user_id: systemUserId,
            activity_type: "status_change",
            old_value: "pending",
            new_value: order.status,
            description: `Order status set to ${order.status}`,
            metadata: {
              user_name: "System",
              initialization: true,
              order_number: order.order_number,
            },
          })
        }

        // Create payment activity if payment status exists
        if (order.payment_status && order.payment_status !== "pending") {
          await orderActivityService.createActivity({
            order_id: order.id,
            user_id: systemUserId,
            activity_type: "payment_update",
            old_value: "pending",
            new_value: order.payment_status,
            description: `Payment status updated to ${order.payment_status}`,
            metadata: {
              user_name: "System",
              initialization: true,
              payment_method: order.payment_method,
              total_amount: order.total_amount,
            },
          })
        }

        // Create shipping activity if tracking number exists
        if (order.tracking_number) {
          await orderActivityService.createActivity({
            order_id: order.id,
            user_id: systemUserId,
            activity_type: "shipping_update",
            new_value: "tracking_assigned",
            description: `Tracking number assigned: ${order.tracking_number}`,
            metadata: {
              user_name: "System",
              initialization: true,
              tracking_number: order.tracking_number,
              delivery_method: order.delivery_method,
            },
          })
        }

        // Create note activities for existing notes
        if (order.notes && Array.isArray(order.notes)) {
          for (const note of order.notes) {
            await orderActivityService.createActivity({
              order_id: order.id,
              user_id: note.added_by || systemUserId,
              activity_type: "note_added",
              new_value: note.note,
              description: `Note added: ${note.note.substring(0, 50)}${note.note.length > 50 ? "..." : ""}`,
              metadata: {
                user_name: note.user_name || "System",
                initialization: true,
                full_note: note.note,
                original_timestamp: note.timestamp,
              },
            })
          }
        }

        console.log(`✅ Initialized activities for order: ${order.order_number}`)
        processedCount++
      } catch (error) {
        console.error(`❌ Error processing order ${order.order_number}:`, error)
      }
    }

    console.log(`\n🎉 Initialization complete!`)
    console.log(`📊 Summary:`)
    console.log(`   - Total orders: ${orders.length}`)
    console.log(`   - Processed: ${processedCount}`)
    console.log(`   - Skipped: ${skippedCount}`)
    console.log(`   - Errors: ${orders.length - processedCount - skippedCount}`)
  } catch (error) {
    console.error("❌ Error during initialization:", error)
  }
}

// Run the initialization
initializeOrderActivities()
  .then(() => {
    console.log("✅ Order activity initialization completed")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Initialization failed:", error)
    process.exit(1)
  })
