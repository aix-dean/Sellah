import { orderActivityService } from "./order-activity-service"

// Test function to create sample activity data
export async function createTestActivityData(orderId: string, userId = "test-user") {
  try {
    console.log("🧪 Creating test activity data for order:", orderId)

    // Create order created activity
    await orderActivityService.createActivity({
      order_id: orderId,
      user_id: userId,
      activity_type: "order_created",
      new_value: "Order created",
      description: "Order was successfully created",
      metadata: {
        user_name: "Test User",
        source: "system",
        order_total: 1500,
      },
    })

    // Create status change activity
    await orderActivityService.createActivity({
      order_id: orderId,
      user_id: userId,
      activity_type: "status_change",
      old_value: "pending",
      new_value: "confirmed",
      description: "Order status changed from pending to confirmed",
      metadata: {
        user_name: "Admin User",
        source: "admin_panel",
        changed_at: new Date().toISOString(),
      },
    })

    // Create payment update activity
    await orderActivityService.createActivity({
      order_id: orderId,
      user_id: userId,
      activity_type: "payment_update",
      new_value: "Payment received: ₱1500 via GCash",
      description: "Payment of ₱1500 received via GCash",
      metadata: {
        user_name: "System",
        source: "payment_gateway",
        amount: 1500,
        payment_method: "GCash",
        reference_number: "GC123456789",
      },
    })

    // Create shipping update activity
    await orderActivityService.createActivity({
      order_id: orderId,
      user_id: userId,
      activity_type: "shipping_update",
      new_value: "Shipped via LBC - Tracking: LBC123456789",
      description: "Order shipped via LBC with tracking number LBC123456789",
      metadata: {
        user_name: "Shipping Manager",
        source: "shipping_system",
        tracking_number: "LBC123456789",
        carrier: "LBC",
        estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    })

    console.log("✅ Test activity data created successfully")
    return { success: true, message: "Test activity data created" }
  } catch (error) {
    console.error("❌ Error creating test activity data:", error)
    throw error
  }
}

// Function to clear test data
export async function clearTestActivityData(orderId: string) {
  try {
    console.log("🧹 Clearing test activity data for order:", orderId)

    const result = await orderActivityService.getOrderActivities(orderId, { limit: 100 })

    for (const activity of result.activities) {
      if (activity.id) {
        await orderActivityService.deleteActivity(activity.id)
      }
    }

    console.log("✅ Test activity data cleared successfully")
    return { success: true, message: "Test activity data cleared" }
  } catch (error) {
    console.error("❌ Error clearing test activity data:", error)
    throw error
  }
}
