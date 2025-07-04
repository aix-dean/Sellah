import { doc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore"
import { db } from "./firebase"
import { stockManagementService, formatOrderItemsForStock } from "./stock-management"
import { createOrderActivity } from "./order-activity"

export interface OrderStatusUpdateResult {
  success: boolean
  message: string
  stockDeductionResult?: any
  error?: string
}

/**
 * Handle order status updates with automatic stock management
 */
export async function updateOrderStatusWithStockManagement(
  orderId: string,
  newStatus: string,
  userId: string,
  oldStatus: string,
  userName: string,
  orderData?: any,
): Promise<OrderStatusUpdateResult> {
  try {
    console.log(`🔄 Updating order ${orderId} status: ${oldStatus} → ${newStatus}`)

    // First, update the order status
    const orderRef = doc(db, "orders", orderId)
    const now = Timestamp.now()

    await updateDoc(orderRef, {
      status: newStatus,
      updated_at: now,
      status_history: arrayUnion({
        status: newStatus,
        timestamp: now,
        note: `Status changed from ${oldStatus} to ${newStatus}`,
        updated_by: userId,
        user_name: userName,
      }),
    })

    // Handle stock deduction when status changes to 'preparing'
    let stockDeductionResult = null
    if (newStatus.toLowerCase() === "preparing" && orderData?.items) {
      console.log(`📦 Order status changed to 'preparing', initiating stock deduction...`)

      try {
        const orderItems = formatOrderItemsForStock(orderData.items)
        stockDeductionResult = await stockManagementService.deductStockForOrder(orderId, orderItems)

        // Log stock deduction activity with correct parameters
        await createOrderActivity({
          orderId,
          type: "order_updated",
          description: stockDeductionResult.success
            ? `Stock deducted successfully for ${orderItems.length} items`
            : `Stock deduction completed with ${stockDeductionResult.errors.length} errors`,
          userId,
          userName,
          metadata: {
            stock_deduction: stockDeductionResult,
            items_processed: orderItems.length,
            successful_deductions: stockDeductionResult.deductions.length,
            failed_deductions: stockDeductionResult.errors.length,
            timestamp_iso: new Date().toISOString(),
          },
        })

        if (stockDeductionResult.success) {
          console.log(`✅ Stock deduction completed successfully for order ${orderId}`)
        } else {
          console.warn(`⚠️ Stock deduction completed with errors for order ${orderId}:`, stockDeductionResult.errors)
        }
      } catch (stockError) {
        console.error(`❌ Stock deduction failed for order ${orderId}:`, stockError)

        // Log the stock deduction failure with correct parameters
        await createOrderActivity({
          orderId,
          type: "order_updated",
          description: `Stock deduction failed: ${stockError instanceof Error ? stockError.message : "Unknown error"}`,
          userId,
          userName,
          metadata: {
            stock_deduction_error: stockError instanceof Error ? stockError.message : "Unknown error",
            timestamp_iso: new Date().toISOString(),
          },
        })
      }
    }

    // Handle stock restoration when status changes to 'cancelled'
    if (newStatus.toLowerCase() === "cancelled" && orderData?.items) {
      console.log(`🔄 Order cancelled, initiating stock restoration...`)

      try {
        const orderItems = formatOrderItemsForStock(orderData.items)
        const stockRestorationResult = await stockManagementService.restoreStockForOrder(orderId, orderItems)

        // Log stock restoration activity with correct parameters
        await createOrderActivity({
          orderId,
          type: "order_updated",
          description: stockRestorationResult.success
            ? `Stock restored successfully for ${orderItems.length} items`
            : `Stock restoration completed with ${stockRestorationResult.errors.length} errors`,
          userId,
          userName,
          metadata: {
            stock_restoration: stockRestorationResult,
            items_processed: orderItems.length,
            successful_restorations: stockRestorationResult.deductions.length,
            failed_restorations: stockRestorationResult.errors.length,
            timestamp_iso: new Date().toISOString(),
          },
        })

        console.log(`✅ Stock restoration completed for cancelled order ${orderId}`)
      } catch (stockError) {
        console.error(`❌ Stock restoration failed for order ${orderId}:`, stockError)
      }
    }

    // Log the status change activity with correct parameters
    await createOrderActivity({
      orderId,
      type: "status_change",
      description: `Order status changed from ${oldStatus} to ${newStatus}`,
      userId,
      userName,
      metadata: {
        oldStatus,
        newStatus,
        status_change_reason: "Manual update by user",
        timestamp_iso: new Date().toISOString(),
      },
    })

    return {
      success: true,
      message: `Order status updated to ${newStatus}`,
      stockDeductionResult,
    }
  } catch (error) {
    console.error(`❌ Error updating order status for ${orderId}:`, error)
    return {
      success: false,
      message: "Failed to update order status",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
