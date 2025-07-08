import {
  doc,
  updateDoc,
  arrayUnion,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore"
import { db } from "./firebase"
import { orderActivityService } from "./order-activity-service"
import { notificationService } from "./notification-service"

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  userId = "system",
  oldStatus?: string,
  userName?: string,
  reason?: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const orderRef = doc(db, "orders", orderId)

    // Get current order data if oldStatus not provided
    let orderData: any = null
    if (!oldStatus) {
      const orderDoc = await getDoc(orderRef)
      if (orderDoc.exists()) {
        orderData = orderDoc.data()
        oldStatus = orderData.status
      }
    } else {
      // Get order data for notification
      const orderDoc = await getDoc(orderRef)
      if (orderDoc.exists()) {
        orderData = orderDoc.data()
      }
    }

    // Prepare update data
    const updateData: any = {
      status: newStatus,
      updated_at: new Date(),
    }

    // Add status history if oldStatus is provided
    if (oldStatus) {
      updateData.status_history = arrayUnion({
        status: newStatus,
        previous_status: oldStatus,
        timestamp: new Date(),
        changed_by: userId,
        changed_by_name: userName || "Admin User",
        reason: reason || `Status updated to ${newStatus}`,
      })
    }

    // Update order status
    await updateDoc(orderRef, updateData)

    // Log the status change activity
    if (oldStatus) {
      await orderActivityService.createActivity({
        order_id: orderId,
        user_id: userId,
        activity_type: "status_change",
        old_value: oldStatus,
        new_value: newStatus,
        description: reason || `Order status changed from ${oldStatus} to ${newStatus}`,
        metadata: {
          order_number: orderData?.order_number || orderId,
          changed_by: userId,
          changed_by_name: userName || "Admin User",
        },
      })
    }

    // Create notification for customer if order data is available
    if (orderData && (orderData.customer_id || orderData.created_by)) {
      const customerId = orderData.customer_id || orderData.created_by
      const orderNumber = orderData.order_number || orderId

      await notificationService.createOrderStatusNotification(
        orderId,
        orderNumber,
        customerId,
        oldStatus || "unknown",
        newStatus,
        userId,
      )

      console.log(`Status change notification created for customer ${customerId}: ${oldStatus} -> ${newStatus}`)
    }

    return { success: true, message: "Order status updated successfully" }
  } catch (error) {
    console.error("Error updating order status:", error)
    throw error
  }
}

export async function updateOrderOutForDelivery(
  orderId: string,
  userId = "system",
  userName?: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const orderRef = doc(db, "orders", orderId)

    // Get order data first
    const orderDoc = await getDoc(orderRef)
    if (!orderDoc.exists()) {
      throw new Error("Order not found")
    }

    const orderData = orderDoc.data()
    const previousStatus = orderData.status

    await updateDoc(orderRef, {
      status: "out_for_delivery",
      updated_at: new Date(),
      status_history: arrayUnion({
        status: "out_for_delivery",
        previous_status: previousStatus,
        timestamp: new Date(),
        changed_by: userId,
        changed_by_name: userName || "Admin User",
      }),
    })

    // Log the activity
    await orderActivityService.createActivity({
      order_id: orderId,
      user_id: userId,
      activity_type: "shipping_update",
      old_value: previousStatus,
      new_value: "out_for_delivery",
      description: "Order is out for delivery",
      metadata: {
        delivery_status: "out_for_delivery",
        updated_by: userId,
        updated_by_name: userName || "Admin User",
      },
    })

    // Create notification for customer
    if (orderData.customer_id || orderData.created_by) {
      const customerId = orderData.customer_id || orderData.created_by
      const orderNumber = orderData.order_number || orderId

      await notificationService.createOrderStatusNotification(
        orderId,
        orderNumber,
        customerId,
        previousStatus,
        "out_for_delivery",
        userId,
      )

      console.log(`Out for delivery notification created for customer ${customerId}`)
    }

    return { success: true, message: "Order marked as out for delivery" }
  } catch (error) {
    console.error("Error updating order to out for delivery:", error)
    throw error
  }
}

export async function approveOrderPayment(
  orderId: string,
  userId = "system",
): Promise<{ success: boolean; message: string }> {
  try {
    const orderRef = doc(db, "orders", orderId)

    // Get order data first
    const orderDoc = await getDoc(orderRef)
    if (!orderDoc.exists()) {
      throw new Error("Order not found")
    }

    const orderData = orderDoc.data()

    await updateDoc(orderRef, {
      payment_status: "approved",
      status: "processing",
      updated_at: new Date(),
      approved_at: new Date(),
      approved_by: userId,
      approve_payment: true,
      status_history: arrayUnion({
        status: "processing",
        previous_status: "pending",
        timestamp: new Date(),
        changed_by: userId,
        changed_by_name: "Admin User",
        note: "Payment approved",
      }),
    })

    // Log the activity
    await orderActivityService.createActivity({
      order_id: orderId,
      user_id: userId,
      activity_type: "payment_update",
      old_value: "pending",
      new_value: "approved",
      description: "Payment approved and order moved to processing",
      metadata: {
        payment_status: "approved",
        approved_by: userId,
        approved_at: new Date().toISOString(),
      },
    })

    // Create notification for the customer
    if (orderData.customer_id || orderData.created_by) {
      const customerId = orderData.customer_id || orderData.created_by
      const orderNumber = orderData.order_number || orderId

      await notificationService.createOrderApprovalNotification(orderId, orderNumber, customerId, userId, {
        total_amount: orderData.total_amount,
        items_count: orderData.items?.length || 0,
        payment_method: orderData.payment_method,
      })

      console.log(`Notification created for customer ${customerId} for order approval`)
    }

    return { success: true, message: "Payment approved successfully" }
  } catch (error) {
    console.error("Error approving payment:", error)
    throw error
  }
}

// Alias for backward compatibility
export const updateOrderApprovePayment = approveOrderPayment

export async function rejectOrderPayment(
  orderId: string,
  reason: string,
  userId = "system",
): Promise<{ success: boolean; message: string }> {
  try {
    const orderRef = doc(db, "orders", orderId)

    // Get order data first
    const orderDoc = await getDoc(orderRef)
    if (!orderDoc.exists()) {
      throw new Error("Order not found")
    }

    const orderData = orderDoc.data()

    await updateDoc(orderRef, {
      payment_status: "rejected",
      status: "cancelled",
      updated_at: new Date(),
      rejected_at: new Date(),
      rejected_by: userId,
      rejection_reason: reason,
      approve_payment: false,
      status_history: arrayUnion({
        status: "cancelled",
        previous_status: "pending",
        timestamp: new Date(),
        changed_by: userId,
        changed_by_name: "Admin User",
        note: `Payment rejected: ${reason}`,
      }),
    })

    // Log the activity
    await orderActivityService.createActivity({
      order_id: orderId,
      user_id: userId,
      activity_type: "payment_update",
      old_value: "pending",
      new_value: "rejected",
      description: `Payment rejected: ${reason}`,
      metadata: {
        payment_status: "rejected",
        rejection_reason: reason,
        rejected_by: userId,
      },
    })

    // Create notification for the customer
    if (orderData.customer_id || orderData.created_by) {
      const customerId = orderData.customer_id || orderData.created_by
      const orderNumber = orderData.order_number || orderId

      await notificationService.createPaymentNotification(
        orderId,
        orderNumber,
        customerId,
        "rejected",
        orderData.total_amount || 0,
        userId,
      )

      console.log(`Notification created for customer ${customerId} for payment rejection`)
    }

    return { success: true, message: "Payment rejected successfully" }
  } catch (error) {
    console.error("Error rejecting payment:", error)
    throw error
  }
}

export async function completeOrder(
  orderId: string,
  userId = "system",
  userName?: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const orderRef = doc(db, "orders", orderId)

    // Get order data first
    const orderDoc = await getDoc(orderRef)
    if (!orderDoc.exists()) {
      throw new Error("Order not found")
    }

    const orderData = orderDoc.data()
    const previousStatus = orderData.status

    await updateDoc(orderRef, {
      status: "completed",
      completed_at: new Date(),
      updated_at: new Date(),
      status_history: arrayUnion({
        status: "completed",
        previous_status: previousStatus,
        timestamp: new Date(),
        changed_by: userId,
        changed_by_name: userName || "Admin User",
      }),
    })

    // Log the activity
    await orderActivityService.createActivity({
      order_id: orderId,
      user_id: userId,
      activity_type: "status_change",
      old_value: previousStatus,
      new_value: "completed",
      description: "Order completed successfully",
      metadata: {
        completed_by: userId,
        completed_by_name: userName || "Admin User",
        completed_at: new Date().toISOString(),
      },
    })

    // Create notification for the customer
    if (orderData.customer_id || orderData.created_by) {
      const customerId = orderData.customer_id || orderData.created_by
      const orderNumber = orderData.order_number || orderId
      const isPickup = orderData.is_pickup || false

      await notificationService.createOrderCompletionNotification(orderId, orderNumber, customerId, userId, isPickup)

      console.log(`Completion notification created for customer ${customerId}`)
    }

    return { success: true, message: "Order completed successfully" }
  } catch (error) {
    console.error("Error completing order:", error)
    throw error
  }
}

export async function addOrderNote(
  orderId: string,
  note: string,
  userId = "system",
): Promise<{ success: boolean; message: string }> {
  try {
    const orderRef = doc(db, "orders", orderId)

    await updateDoc(orderRef, {
      notes: arrayUnion({
        note: note.trim(),
        timestamp: new Date(),
        added_by: userId,
        user_name: "Admin User",
      }),
      updated_at: new Date(),
    })

    // Log the activity
    await orderActivityService.createActivity({
      order_id: orderId,
      user_id: userId,
      activity_type: "note_added",
      new_value: note,
      description: `Note added: ${note}`,
      metadata: {
        note_content: note,
        added_by: userId,
      },
    })

    return { success: true, message: "Note added successfully" }
  } catch (error) {
    console.error("Error adding note:", error)
    throw error
  }
}

export async function updateOrderShippingInfo(
  orderId: string,
  shippingInfo: {
    carrier?: string
    tracking_number?: string
    estimated_delivery?: Date
    shipping_address?: any
  },
  userId = "system",
): Promise<{ success: boolean; message: string }> {
  try {
    const orderRef = doc(db, "orders", orderId)

    // Get order data first
    const orderDoc = await getDoc(orderRef)
    if (!orderDoc.exists()) {
      throw new Error("Order not found")
    }

    const orderData = orderDoc.data()

    await updateDoc(orderRef, {
      shipping_info: shippingInfo,
      updated_at: new Date(),
      shipping_updates: arrayUnion({
        ...shippingInfo,
        timestamp: new Date(),
        updated_by: userId,
        user_name: "Admin User",
      }),
    })

    // Log the activity
    await orderActivityService.createActivity({
      order_id: orderId,
      user_id: userId,
      activity_type: "shipping_update",
      new_value: JSON.stringify(shippingInfo),
      description: "Shipping information updated",
      metadata: {
        shipping_info: shippingInfo,
        updated_by: userId,
      },
    })

    // Create shipping notification if tracking number is provided
    if (shippingInfo.tracking_number && shippingInfo.carrier) {
      if (orderData.customer_id || orderData.created_by) {
        const customerId = orderData.customer_id || orderData.created_by
        const orderNumber = orderData.order_number || orderId

        await notificationService.createShippingNotification(
          orderId,
          orderNumber,
          customerId,
          shippingInfo.tracking_number,
          shippingInfo.carrier,
          userId,
        )

        console.log(`Shipping notification created for customer ${customerId}`)
      }
    }

    return { success: true, message: "Shipping information updated successfully" }
  } catch (error) {
    console.error("Error updating shipping info:", error)
    throw error
  }
}

export async function cancelOrder(
  orderId: string,
  reason: string,
  userId = "system",
): Promise<{ success: boolean; message: string }> {
  try {
    const orderRef = doc(db, "orders", orderId)

    // Get current order data to store previous status
    const orderDoc = await getDoc(orderRef)
    if (!orderDoc.exists()) {
      throw new Error("Order not found")
    }

    const currentOrder = orderDoc.data()
    const previousStatus = currentOrder.status

    await updateDoc(orderRef, {
      status: "cancelled",
      cancelled_at: new Date(),
      cancelled_by: userId,
      cancellation_reason: reason,
      previous_status: previousStatus, // Store for potential restoration
      updated_at: new Date(),
      status_history: arrayUnion({
        status: "cancelled",
        previous_status: previousStatus,
        timestamp: new Date(),
        changed_by: userId,
        changed_by_name: "Admin User",
        note: `Order cancelled: ${reason}`,
      }),
    })

    // Log the activity
    await orderActivityService.createActivity({
      order_id: orderId,
      user_id: userId,
      activity_type: "status_change",
      old_value: previousStatus,
      new_value: "cancelled",
      description: `Order cancelled: ${reason}`,
      metadata: {
        cancellation_reason: reason,
        cancelled_by: userId,
        previous_status: previousStatus,
      },
    })

    // Create notification for the customer
    if (currentOrder.customer_id || currentOrder.created_by) {
      const customerId = currentOrder.customer_id || currentOrder.created_by
      const orderNumber = currentOrder.order_number || orderId

      await notificationService.createOrderStatusNotification(
        orderId,
        orderNumber,
        customerId,
        previousStatus,
        "cancelled",
        userId,
      )

      console.log(`Cancellation notification created for customer ${customerId}`)
    }

    return { success: true, message: "Order cancelled successfully" }
  } catch (error) {
    console.error("Error cancelling order:", error)
    throw error
  }
}

export async function restoreOrder(orderId: string, userId = "system"): Promise<{ success: boolean; message: string }> {
  try {
    const orderRef = doc(db, "orders", orderId)

    // Get current order data to restore previous status
    const orderDoc = await getDoc(orderRef)
    if (!orderDoc.exists()) {
      throw new Error("Order not found")
    }

    const currentOrder = orderDoc.data()
    const restoreToStatus = currentOrder.previous_status || "pending"

    await updateDoc(orderRef, {
      status: restoreToStatus,
      restored_at: new Date(),
      restored_by: userId,
      updated_at: new Date(),
      // Remove cancellation fields
      cancelled_at: null,
      cancelled_by: null,
      cancellation_reason: null,
      status_history: arrayUnion({
        status: restoreToStatus,
        previous_status: "cancelled",
        timestamp: new Date(),
        changed_by: userId,
        changed_by_name: "Admin User",
        note: "Order restored from cancelled status",
      }),
    })

    // Log the activity
    await orderActivityService.createActivity({
      order_id: orderId,
      user_id: userId,
      activity_type: "status_change",
      old_value: "cancelled",
      new_value: restoreToStatus,
      description: "Order restored from cancelled status",
      metadata: {
        restored_by: userId,
        restored_to_status: restoreToStatus,
      },
    })

    return { success: true, message: "Order restored successfully" }
  } catch (error) {
    console.error("Error restoring order:", error)
    throw error
  }
}

// Get order by ID
export async function getOrderById(orderId: string) {
  try {
    const orderRef = doc(db, "orders", orderId)
    const orderDoc = await getDoc(orderRef)

    if (!orderDoc.exists()) {
      throw new Error("Order not found")
    }

    return {
      id: orderDoc.id,
      ...orderDoc.data(),
    }
  } catch (error) {
    console.error("Error getting order:", error)
    throw error
  }
}

// Get orders with pagination
export async function getOrders(
  filters: {
    status?: string
    limit?: number
    startAfterDoc?: any
  } = {},
) {
  try {
    const { status, limit: pageLimit = 10, startAfterDoc } = filters

    let q = query(collection(db, "orders"), orderBy("created_at", "desc"), limit(pageLimit))

    if (status) {
      q = query(
        collection(db, "orders"),
        where("status", "==", status),
        orderBy("created_at", "desc"),
        limit(pageLimit),
      )
    }

    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc))
    }

    const querySnapshot = await getDocs(q)
    const orders = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return {
      orders,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
      hasMore: querySnapshot.docs.length === pageLimit,
    }
  } catch (error) {
    console.error("Error getting orders:", error)
    throw error
  }
}

// Delete order (admin only)
export async function deleteOrder(orderId: string, userId = "system"): Promise<{ success: boolean; message: string }> {
  try {
    const orderRef = doc(db, "orders", orderId)

    // Log the deletion activity before deleting
    await orderActivityService.createActivity({
      order_id: orderId,
      user_id: userId,
      activity_type: "order_updated",
      new_value: "deleted",
      description: "Order permanently deleted",
      metadata: {
        deleted_by: userId,
        deleted_at: new Date().toISOString(),
      },
    })

    await deleteDoc(orderRef)

    return { success: true, message: "Order deleted successfully" }
  } catch (error) {
    console.error("Error deleting order:", error)
    throw error
  }
}

// Batch update orders
export async function batchUpdateOrders(
  orderIds: string[],
  updates: any,
  userId = "system",
): Promise<{ success: boolean; message: string }> {
  try {
    const batch = writeBatch(db)

    orderIds.forEach((orderId) => {
      const orderRef = doc(db, "orders", orderId)
      batch.update(orderRef, {
        ...updates,
        updated_at: new Date(),
        batch_updated_by: userId,
      })
    })

    await batch.commit()

    // Log batch update activity
    for (const orderId of orderIds) {
      await orderActivityService.createActivity({
        order_id: orderId,
        user_id: userId,
        activity_type: "order_updated",
        new_value: JSON.stringify(updates),
        description: "Order updated in batch operation",
        metadata: {
          batch_update: true,
          updated_by: userId,
          updates,
        },
      })
    }

    return { success: true, message: `${orderIds.length} orders updated successfully` }
  } catch (error) {
    console.error("Error batch updating orders:", error)
    throw error
  }
}
