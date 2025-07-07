import { doc, updateDoc, serverTimestamp, arrayUnion, getDoc } from "firebase/firestore"
import { db } from "./firebase"
import { logOrderStatusChange, logPaymentReceived, logOrderShipped, logOrderDelivered } from "./order-activity-service"

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  userId: string,
  oldStatus?: string,
  userName?: string,
  reason?: string,
): Promise<void> {
  try {
    const orderRef = doc(db, "orders", orderId)

    // Get current order data if oldStatus not provided
    if (!oldStatus) {
      const orderDoc = await getDoc(orderRef)
      if (orderDoc.exists()) {
        oldStatus = orderDoc.data().status
      }
    }

    // Update order status
    await updateDoc(orderRef, {
      status: newStatus,
      updated_at: serverTimestamp(),
      ...(reason && {
        status_change_reason: reason,
        status_history: arrayUnion({
          status: newStatus,
          timestamp: serverTimestamp(),
          changed_by: userId,
          reason,
        }),
      }),
    })

    // Log the status change and create notification
    if (oldStatus) {
      await logOrderStatusChange(orderId, oldStatus, newStatus, userId, userName, reason)
    }

    console.log(`Order ${orderId} status updated from ${oldStatus} to ${newStatus}`)
  } catch (error) {
    console.error("Error updating order status:", error)
    throw error
  }
}

export async function updateOrderOutForDelivery(orderId: string, userId: string, userName?: string): Promise<void> {
  try {
    const orderRef = doc(db, "orders", orderId)

    await updateDoc(orderRef, {
      out_for_delivery: true,
      out_for_delivery_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })

    // Log the activity
    await logOrderShipped(orderId, "Out for Delivery", "Local Delivery", userId, userName)

    console.log(`Order ${orderId} marked as out for delivery`)
  } catch (error) {
    console.error("Error updating order out for delivery:", error)
    throw error
  }
}

export async function approveOrderPayment(orderId: string, userId: string, userName?: string): Promise<void> {
  try {
    const orderRef = doc(db, "orders", orderId)

    // Get order data first
    const orderDoc = await getDoc(orderRef)
    if (!orderDoc.exists()) {
      throw new Error("Order not found")
    }

    const orderData = orderDoc.data()

    await updateDoc(orderRef, {
      approve_payment: true,
      payment_approved_at: serverTimestamp(),
      payment_approved_by: userId,
      updated_at: serverTimestamp(),
    })

    // Log payment approval
    await logPaymentReceived(
      orderId,
      orderData.total_amount || 0,
      orderData.payment_method || "Unknown",
      userId,
      userName,
    )

    console.log(`Payment approved for order ${orderId}`)
  } catch (error) {
    console.error("Error approving order payment:", error)
    throw error
  }
}

export async function completeOrder(orderId: string, userId: string, userName?: string): Promise<void> {
  try {
    const orderRef = doc(db, "orders", orderId)

    await updateDoc(orderRef, {
      status: "completed",
      completed_at: serverTimestamp(),
      completed_by: userId,
      updated_at: serverTimestamp(),
    })

    // Log order completion
    await logOrderDelivered(orderId, userId, userName)

    console.log(`Order ${orderId} completed`)
  } catch (error) {
    console.error("Error completing order:", error)
    throw error
  }
}

export async function addOrderNote(orderId: string, note: string, userId: string, userName?: string): Promise<void> {
  try {
    const orderRef = doc(db, "orders", orderId)

    await updateDoc(orderRef, {
      notes: arrayUnion({
        note: note.trim(),
        timestamp: serverTimestamp(),
        added_by: userId,
        user_name: userName || "Unknown User",
      }),
      updated_at: serverTimestamp(),
    })

    // Log the note addition
    const { addOrderNote: logNote } = await import("./order-activity-service")
    await logNote(orderId, note, userId, userName)

    console.log(`Note added to order ${orderId}`)
  } catch (error) {
    console.error("Error adding order note:", error)
    throw error
  }
}
