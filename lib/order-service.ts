import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"
import type { Order, OrderSummary, OrderFilters } from "@/types/order"
import { orderActivityService } from "./order-activity-service"

class OrderService {
  private collectionName = "orders"

  // Get order by ID
  async getOrderById(orderId: string): Promise<Order> {
    try {
      const orderRef = doc(db, this.collectionName, orderId)
      const orderDoc = await getDoc(orderRef)

      if (!orderDoc.exists()) {
        throw new Error("Order not found")
      }

      const data = orderDoc.data()
      return {
        id: orderDoc.id,
        ...data,
        created_at: data.created_at?.toDate() || new Date(),
        updated_at: data.updated_at?.toDate() || new Date(),
        completed_at: data.completed_at?.toDate() || null,
        cancelled_at: data.cancelled_at?.toDate() || null,
        shipped_at: data.shipped_at?.toDate() || null,
        delivered_at: data.delivered_at?.toDate() || null,
      } as Order
    } catch (error) {
      console.error("Error getting order:", error)
      throw error
    }
  }

  // Get orders with filters and pagination
  async getOrders(filters: OrderFilters = {}): Promise<{
    orders: Order[]
    total: number
    hasMore: boolean
    lastDoc?: any
  }> {
    try {
      const {
        status,
        payment_status,
        date_from,
        date_to,
        customer_email,
        search,
        limit: pageLimit = 10,
        offset = 0,
      } = filters

      let q = query(collection(db, this.collectionName), orderBy("created_at", "desc"))

      // Apply filters
      if (status) {
        q = query(q, where("status", "==", status))
      }

      if (payment_status) {
        q = query(q, where("payment_status", "==", payment_status))
      }

      if (customer_email) {
        q = query(q, where("customerEmail", "==", customer_email))
      }

      if (date_from) {
        q = query(q, where("created_at", ">=", Timestamp.fromDate(date_from)))
      }

      if (date_to) {
        q = query(q, where("created_at", "<=", Timestamp.fromDate(date_to)))
      }

      // Apply pagination
      q = query(q, limit(pageLimit + 1)) // Get one extra to check if there are more

      const querySnapshot = await getDocs(q)
      const docs = querySnapshot.docs

      // Check if there are more results
      const hasMore = docs.length > pageLimit
      const ordersToReturn = hasMore ? docs.slice(0, -1) : docs

      const orders = ordersToReturn.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          created_at: data.created_at?.toDate() || new Date(),
          updated_at: data.updated_at?.toDate() || new Date(),
          completed_at: data.completed_at?.toDate() || null,
          cancelled_at: data.cancelled_at?.toDate() || null,
          shipped_at: data.shipped_at?.toDate() || null,
          delivered_at: data.delivered_at?.toDate() || null,
        } as Order
      })

      // Filter by search term if provided (client-side filtering for complex searches)
      let filteredOrders = orders
      if (search) {
        const searchLower = search.toLowerCase()
        filteredOrders = orders.filter(
          (order) =>
            order.customerName.toLowerCase().includes(searchLower) ||
            order.customerEmail.toLowerCase().includes(searchLower) ||
            order.id.toLowerCase().includes(searchLower) ||
            order.items.some((item) => item.name.toLowerCase().includes(searchLower)),
        )
      }

      return {
        orders: filteredOrders,
        total: filteredOrders.length,
        hasMore,
        lastDoc: ordersToReturn[ordersToReturn.length - 1],
      }
    } catch (error) {
      console.error("Error getting orders:", error)
      throw error
    }
  }

  // Create new order
  async createOrder(orderData: Omit<Order, "id" | "created_at" | "updated_at">): Promise<Order> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...orderData,
        created_at: new Date(),
        updated_at: new Date(),
        status: orderData.status || "pending",
        payment_status: orderData.payment_status || "pending",
      })

      // Log order creation activity
      await orderActivityService.createActivity({
        order_id: docRef.id,
        user_id: "system",
        activity_type: "order_created",
        new_value: "pending",
        description: `Order created for ${orderData.customerName}`,
        metadata: {
          customer_email: orderData.customerEmail,
          total_amount: orderData.totalAmount,
          items_count: orderData.items.length,
        },
      })

      return await this.getOrderById(docRef.id)
    } catch (error) {
      console.error("Error creating order:", error)
      throw error
    }
  }

  // Update order
  async updateOrder(orderId: string, updates: Partial<Order>, userId = "system"): Promise<Order> {
    try {
      const orderRef = doc(db, this.collectionName, orderId)

      // Get current order for comparison
      const currentOrder = await this.getOrderById(orderId)

      await updateDoc(orderRef, {
        ...updates,
        updated_at: new Date(),
      })

      // Log significant changes
      if (updates.status && updates.status !== currentOrder.status) {
        await orderActivityService.createActivity({
          order_id: orderId,
          user_id: userId,
          activity_type: "status_change",
          old_value: currentOrder.status,
          new_value: updates.status,
          description: `Order status changed from ${currentOrder.status} to ${updates.status}`,
          metadata: {
            changed_by: userId,
            previous_status: currentOrder.status,
          },
        })
      }

      return await this.getOrderById(orderId)
    } catch (error) {
      console.error("Error updating order:", error)
      throw error
    }
  }

  // Delete order
  async deleteOrder(orderId: string, userId = "system"): Promise<void> {
    try {
      const orderRef = doc(db, this.collectionName, orderId)

      // Log deletion before removing
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
    } catch (error) {
      console.error("Error deleting order:", error)
      throw error
    }
  }

  // Get order summary/statistics
  async getOrderSummary(filters: Partial<OrderFilters> = {}): Promise<OrderSummary> {
    try {
      const { orders } = await this.getOrders({ ...filters, limit: 1000 }) // Get more for accurate stats

      const summary: OrderSummary = {
        total_orders: orders.length,
        pending_orders: orders.filter((o) => o.status === "pending").length,
        processing_orders: orders.filter((o) => o.status === "processing").length,
        shipped_orders: orders.filter((o) => o.status === "shipped").length,
        delivered_orders: orders.filter((o) => o.status === "delivered").length,
        cancelled_orders: orders.filter((o) => o.status === "cancelled").length,
        total_revenue: orders
          .filter((o) => o.status !== "cancelled")
          .reduce((sum, order) => sum + order.totalAmount, 0),
        average_order_value: 0,
      }

      summary.average_order_value = summary.total_orders > 0 ? summary.total_revenue / summary.total_orders : 0

      return summary
    } catch (error) {
      console.error("Error getting order summary:", error)
      throw error
    }
  }

  // Batch update orders
  async batchUpdateOrders(orderIds: string[], updates: Partial<Order>, userId = "system"): Promise<void> {
    try {
      const batch = writeBatch(db)

      orderIds.forEach((orderId) => {
        const orderRef = doc(db, this.collectionName, orderId)
        batch.update(orderRef, {
          ...updates,
          updated_at: new Date(),
          batch_updated_by: userId,
        })
      })

      await batch.commit()

      // Log batch update activities
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
    } catch (error) {
      console.error("Error batch updating orders:", error)
      throw error
    }
  }

  // Search orders
  async searchOrders(searchTerm: string, limit = 20): Promise<Order[]> {
    try {
      // For now, we'll get all orders and filter client-side
      // In production, you might want to use Algolia or similar for better search
      const { orders } = await this.getOrders({ limit: 1000 })

      const searchLower = searchTerm.toLowerCase()
      return orders
        .filter(
          (order) =>
            order.customerName.toLowerCase().includes(searchLower) ||
            order.customerEmail.toLowerCase().includes(searchLower) ||
            order.id.toLowerCase().includes(searchLower) ||
            order.items.some((item) => item.name.toLowerCase().includes(searchLower)),
        )
        .slice(0, limit)
    } catch (error) {
      console.error("Error searching orders:", error)
      throw error
    }
  }

  // Get orders by customer
  async getOrdersByCustomer(customerEmail: string): Promise<Order[]> {
    try {
      const { orders } = await this.getOrders({
        customer_email: customerEmail,
        limit: 100,
      })
      return orders
    } catch (error) {
      console.error("Error getting orders by customer:", error)
      throw error
    }
  }

  // Get recent orders
  async getRecentOrders(limit = 10): Promise<Order[]> {
    try {
      const { orders } = await this.getOrders({ limit })
      return orders
    } catch (error) {
      console.error("Error getting recent orders:", error)
      throw error
    }
  }
}

// Create singleton instance
const orderService = new OrderService()

// Export individual functions for backward compatibility
export const getOrderById = orderService.getOrderById.bind(orderService)
export const getOrders = orderService.getOrders.bind(orderService)
export const createOrder = orderService.createOrder.bind(orderService)
export const updateOrder = orderService.updateOrder.bind(orderService)
export const deleteOrder = orderService.deleteOrder.bind(orderService)
export const getOrderSummary = orderService.getOrderSummary.bind(orderService)
export const batchUpdateOrders = orderService.batchUpdateOrders.bind(orderService)
export const searchOrders = orderService.searchOrders.bind(orderService)
export const getOrdersByCustomer = orderService.getOrdersByCustomer.bind(orderService)
export const getRecentOrders = orderService.getRecentOrders.bind(orderService)

// Export the service instance
export default orderService
