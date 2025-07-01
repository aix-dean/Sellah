import { doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { createOrderActivity } from "@/lib/order-activity"

export const updateOrderStatus = async (
  orderId: string,
  newStatus: string,
  userId: string,
  oldStatus?: string,
  userName?: string,
) => {
  console.log("🚀 updateOrderStatus called with:", {
    orderId,
    newStatus,
    userId,
    oldStatus,
    userName,
  })

  try {
    if (!orderId || !newStatus || !userId) {
      throw new Error("Missing required parameters: orderId, newStatus, or userId")
    }

    // Get current order data first
    const orderRef = doc(db, "orders", orderId)
    const orderDoc = await getDoc(orderRef)

    if (!orderDoc.exists()) {
      throw new Error(`Order with ID ${orderId} not found`)
    }

    const currentOrderData = orderDoc.data()
    const currentStatus = currentOrderData.status || oldStatus || "unknown"

    console.log("📄 Current order data:", {
      currentStatus,
      currentApprovePayment: currentOrderData.approve_payment,
      newStatus,
    })

    // Prepare update data
    const updateData: any = {
      status: newStatus,
      updated_at: serverTimestamp(),
    }

    // Set approve_payment to false when status changes to "settle payment" (payment rejected)
    if (newStatus === "settle payment") {
      updateData.approve_payment = false
      console.log("❌ Setting approve_payment to false for settle payment status")
    }

    // Set approve_payment to false when approving unpaid orders (status changes to "preparing")
    if (newStatus === "preparing") {
      updateData.approve_payment = false
      console.log(
        "📝 Setting approve_payment to false for preparing status (order approved but payment not yet approved)",
      )
    }

    // Prepare metadata for order activity - filter out undefined values
    const metadata: Record<string, any> = {
      oldStatus: currentStatus,
      newStatus,
    }

    // Only add approve_payment to metadata if it's defined
    if (updateData.approve_payment !== undefined) {
      metadata.approve_payment = updateData.approve_payment
    }

    console.log("📝 Creating order activity with metadata:", metadata)
    // Create order activity
    await createOrderActivity({
      orderId,
      type: "status_change",
      description: `Order status changed from "${currentStatus}" to "${newStatus}"`,
      userId,
      userName: userName || "System",
      metadata,
    })

    console.log("📄 Updating order document with:", updateData)
    // Update the order document
    await updateDoc(orderRef, updateData)

    console.log("✅ Order document updated successfully")
    return { success: true }
  } catch (error) {
    console.error("❌ Error updating order status:", error)
    throw error
  }
}

export const updateOrderApprovePayment = async (orderId: string, userId: string, userName?: string) => {
  try {
    if (!orderId || !userId) {
      throw new Error("Missing required parameters: orderId or userId")
    }

    // Get current order data first
    const orderRef = doc(db, "orders", orderId)
    const orderDoc = await getDoc(orderRef)

    if (!orderDoc.exists()) {
      throw new Error(`Order with ID ${orderId} not found`)
    }

    const currentOrderData = orderDoc.data()

    // Prepare update data - ONLY update approve_payment, DO NOT change status
    const updateData: any = {
      approve_payment: true,
      updated_at: serverTimestamp(),
    }

    // Create order activity with clean metadata
    await createOrderActivity({
      orderId,
      type: "payment_approved",
      description: "Payment approved - order ready for shipping",
      userId,
      userName: userName || "System",
      metadata: {
        approve_payment: true,
        action: "approve_payment",
        note: "Payment approved without status change",
      },
    })

    // Update the order document - ONLY approve_payment field, status remains unchanged
    await updateDoc(orderRef, updateData)

    // Verify the update
    const updatedDoc = await getDoc(orderRef)
    const updatedData = updatedDoc.data()
    console.log("✅ Order document updated successfully. New data:", {
      status: updatedData?.status, // Should remain unchanged
      approve_payment: updatedData?.approve_payment, // Should be true
      updated_at: updatedData?.updated_at,
    })

    return { success: true }
  } catch (error) {
    console.error("❌ Error updating order approve_payment:", error)
    throw error
  }
}

export const updateOrderOutForDelivery = async (orderId: string, userId: string, userName?: string) => {
  console.log("🚚 updateOrderOutForDelivery called with:", {
    orderId,
    userId,
    userName,
  })

  try {
    if (!orderId || !userId) {
      throw new Error("Missing required parameters: orderId or userId")
    }

    // Get current order data first
    const orderRef = doc(db, "orders", orderId)
    const orderDoc = await getDoc(orderRef)

    if (!orderDoc.exists()) {
      throw new Error(`Order with ID ${orderId} not found`)
    }

    const currentOrderData = orderDoc.data()

    // Prepare update data - ONLY update out_of_delivery, DO NOT change status
    const updateData: any = {
      out_of_delivery: true,
      updated_at: serverTimestamp(),
    }

    // Create order activity with clean metadata
    await createOrderActivity({
      orderId,
      type: "out_for_delivery",
      description: "Order is now out for delivery",
      userId,
      userName: userName || "System",
      metadata: {
        out_of_delivery: true,
        action: "out_for_delivery",
        note: "Order marked as out for delivery without status change",
        is_pickup: currentOrderData.is_pickup || false,
      },
    })

    console.log("📄 Updating order document with:", updateData)
    // Update the order document - ONLY out_of_delivery field, status remains unchanged
    await updateDoc(orderRef, updateData)

    // Verify the update
    const updatedDoc = await getDoc(orderRef)
    const updatedData = updatedDoc.data()
    console.log("✅ Order document updated successfully. New data:", {
      status: updatedData?.status, // Should remain unchanged
      out_of_delivery: updatedData?.out_of_delivery, // Should be true
      updated_at: updatedData?.updated_at,
    })

    return { success: true }
  } catch (error) {
    console.error("❌ Error updating order out_of_delivery:", error)
    throw error
  }
}
