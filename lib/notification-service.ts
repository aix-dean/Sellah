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
      confirmed: "Your order has been confirmed and is being processed.",
      preparing: "Your order is being prepared for shipment.",
      shipped: "Your order has been shipped and is on its way.",
      in_transit: "Your order is in transit and will arrive soon.",
      delivered: "Your order has been delivered successfully.",
      completed: "Your order has been completed. Thank you for your business!",
      cancelled: "Your order has been cancelled. If you have questions, please contact support.",
      out_for_delivery: "Your order is out for delivery and will arrive today.",
    }

    const content =
      statusMessages[newStatus as keyof typeof statusMessages] || `Your order status has been updated to ${newStatus}.`

    return await this.createNotification({
      title: `Order ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} - ${orderNumber}`,
      content,
      type: "Order",
      order_id: orderId,
      receiver_id: customerId,
      sender_id: adminId,
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
      metadata: {
        order_number: orderNumber,
        payment_status: paymentStatus,
        amount,
        currency: "PHP",
      },
    })
  },
}
