import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore"
import { db } from "./firebase"

export interface NotificationData {
  content: string
  title: string
  type: "Order" | "Payment" | "System" | "Shipping"
  order_id?: string
  receiver_id: string
  sender_id: string
  isRead?: boolean
  metadata?: Record<string, any>
}

export const notificationService = {
  // Create a new notification
  async createNotification(data: NotificationData) {
    try {
      const notificationRef = await addDoc(collection(db, "notifications"), {
        ...data,
        created: serverTimestamp(),
        isRead: data.isRead || false,
      })

      console.log("Notification created:", notificationRef.id)
      return notificationRef.id
    } catch (error) {
      console.error("Error creating notification:", error)
      throw error
    }
  },

  // Get notifications for a user
  async getUserNotifications(userId: string, limitCount = 50) {
    try {
      const q = query(
        collection(db, "notifications"),
        where("receiver_id", "==", userId),
        orderBy("created", "desc"),
        limit(limitCount),
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error("Error fetching notifications:", error)
      throw error
    }
  },

  // Mark notification as read
  async markAsRead(notificationId: string) {
    try {
      const notificationRef = doc(db, "notifications", notificationId)
      await updateDoc(notificationRef, {
        isRead: true,
      })
    } catch (error) {
      console.error("Error marking notification as read:", error)
      throw error
    }
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string) {
    try {
      const q = query(collection(db, "notifications"), where("receiver_id", "==", userId), where("isRead", "==", false))

      const querySnapshot = await getDocs(q)
      const batch = writeBatch(db)

      querySnapshot.docs.forEach((docSnapshot) => {
        batch.update(docSnapshot.ref, { isRead: true })
      })

      await batch.commit()
      console.log(`Marked ${querySnapshot.docs.length} notifications as read`)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      throw error
    }
  },

  // Create order status notification
  async createOrderStatusNotification(
    orderId: string,
    orderNumber: string,
    customerId: string,
    oldStatus: string,
    newStatus: string,
    adminId: string,
  ) {
    const statusMessages = {
      pending: "Your order is pending approval and will be processed soon.",
      confirmed: "Your order has been confirmed and is being processed.",
      preparing: "Your order is being prepared for shipment.",
      processing: "Your order payment has been approved and is now being processed.",
      shipped: "Your order has been shipped and is on its way to you.",
      in_transit: "Your order is in transit and will arrive soon.",
      out_for_delivery: "Your order is out for delivery and will arrive today.",
      delivered: "Your order has been delivered successfully.",
      completed: "Your order has been completed. Thank you for your business!",
      cancelled: "Your order has been cancelled. If you have questions, please contact support.",
      rejected: "Your order has been rejected. Please contact support for more information.",
      returned: "Your order has been returned. Please contact support for assistance.",
      refunded: "Your order has been refunded and will appear in your account within 3-5 business days.",
      "settle payment": "Please settle your payment to proceed with your order.",
      "payment sent": "We have received your payment and it's being verified.",
    }

    const content =
      statusMessages[newStatus as keyof typeof statusMessages] ||
      `Your order status has been updated to ${newStatus.replace(/_/g, " ")}.`

    const title = `Order ${newStatus
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")} - ${orderNumber}`

    return await this.createNotification({
      title,
      content,
      type: "Order",
      order_id: orderId,
      receiver_id: customerId,
      sender_id: adminId,
      isRead: false,
      metadata: {
        order_number: orderNumber,
        old_status: oldStatus,
        new_status: newStatus,
        status_change_time: new Date().toISOString(),
      },
    })
  },

  // Create payment notification
  async createPaymentNotification(
    orderId: string,
    orderNumber: string,
    customerId: string,
    paymentStatus: string,
    amount: number,
    adminId: string,
  ) {
    const paymentMessages = {
      approved: "Your payment has been approved and your order is being processed.",
      rejected: "Your payment was rejected. Please contact support or try a different payment method.",
      received: "We have received your payment and it's being verified.",
      refunded: "Your payment has been refunded and will appear in your account within 3-5 business days.",
    }

    const content =
      paymentMessages[paymentStatus as keyof typeof paymentMessages] ||
      `Your payment status has been updated to ${paymentStatus}.`

    return await this.createNotification({
      title: `Payment ${paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)} - ${orderNumber}`,
      content,
      type: "Payment",
      order_id: orderId,
      receiver_id: customerId,
      sender_id: adminId,
      isRead: false,
      metadata: {
        order_number: orderNumber,
        payment_status: paymentStatus,
        amount,
        currency: "PHP",
      },
    })
  },

  // Create order approval notification
  async createOrderApprovalNotification(
    orderId: string,
    orderNumber: string,
    customerId: string,
    adminId: string,
    orderDetails?: any,
  ) {
    const content = `Your order #${orderNumber} has been approved and is now being processed. You will receive updates as your order progresses.`

    return await this.createNotification({
      title: `Order Approved - ${orderNumber}`,
      content,
      type: "Order",
      order_id: orderId,
      receiver_id: customerId,
      sender_id: adminId,
      isRead: false,
      metadata: {
        order_number: orderNumber,
        approval_time: new Date().toISOString(),
        approved_by: adminId,
        order_details: orderDetails,
      },
    })
  },

  // Create order completion notification
  async createOrderCompletionNotification(
    orderId: string,
    orderNumber: string,
    customerId: string,
    adminId: string,
    isPickup = false,
  ) {
    const content = `Your order #${orderNumber} has been completed and is ready for ${
      isPickup ? "pickup" : "delivery"
    }.`

    return await this.createNotification({
      title: `Order Completed - ${orderNumber}`,
      content,
      type: "Order",
      order_id: orderId,
      receiver_id: customerId,
      sender_id: adminId,
      isRead: false,
      metadata: {
        order_number: orderNumber,
        completion_time: new Date().toISOString(),
        is_pickup: isPickup,
        completed_by: adminId,
      },
    })
  },

  // Create shipping notification
  async createShippingNotification(
    orderId: string,
    orderNumber: string,
    customerId: string,
    trackingNumber: string,
    carrier: string,
    adminId: string,
  ) {
    const content = `Your order #${orderNumber} has been shipped via ${carrier}. Tracking number: ${trackingNumber}`

    return await this.createNotification({
      title: `Order Shipped - ${orderNumber}`,
      content,
      type: "Shipping",
      order_id: orderId,
      receiver_id: customerId,
      sender_id: adminId,
      isRead: false,
      metadata: {
        order_number: orderNumber,
        tracking_number: trackingNumber,
        carrier,
        shipped_time: new Date().toISOString(),
      },
    })
  },
}
