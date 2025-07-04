import { doc, getDoc, runTransaction } from "firebase/firestore"
import { db } from "./firebase"

export interface OrderItem {
  product_id: string
  variation_id?: string
  quantity: number
  product_name: string
  variation_name?: string
}

export interface StockDeductionResult {
  success: boolean
  message: string
  deductions: Array<{
    productId: string
    variationId?: string
    quantityDeducted: number
    newStock: number
  }>
  errors: Array<{
    productId: string
    variationId?: string
    reason: string
    availableStock?: number
    requestedQuantity?: number
  }>
}

export interface StockAvailabilityCheck {
  available: boolean
  insufficientItems: Array<{
    productId: string
    variationId?: string
    available: number
    required: number
  }>
}

class StockManagementService {
  /**
   * Deduct stock for an order
   */
  async deductStockForOrder(orderId: string, orderItems: OrderItem[]): Promise<StockDeductionResult> {
    console.log(`📦 Starting stock deduction for order ${orderId} with ${orderItems.length} items`)

    const deductions: StockDeductionResult["deductions"] = []
    const errors: StockDeductionResult["errors"] = []

    for (const item of orderItems) {
      try {
        const result = await this.deductStockForItem(item)
        if (result.success) {
          deductions.push({
            productId: item.product_id,
            variationId: item.variation_id,
            quantityDeducted: item.quantity,
            newStock: result.newStock,
          })
        } else {
          errors.push({
            productId: item.product_id,
            variationId: item.variation_id,
            reason: result.error || "Unknown error",
            availableStock: result.availableStock,
            requestedQuantity: item.quantity,
          })
        }
      } catch (error) {
        console.error(`Error deducting stock for item ${item.product_id}:`, error)
        errors.push({
          productId: item.product_id,
          variationId: item.variation_id,
          reason: error instanceof Error ? error.message : "Unknown error",
          requestedQuantity: item.quantity,
        })
      }
    }

    const success = errors.length === 0
    const message = success
      ? `Successfully deducted stock for all ${deductions.length} items`
      : `Stock deduction completed with ${errors.length} errors out of ${orderItems.length} items`

    console.log(`📊 Stock deduction result for order ${orderId}: ${message}`)

    return {
      success,
      message,
      deductions,
      errors,
    }
  }

  /**
   * Restore stock for a cancelled order
   */
  async restoreStockForOrder(orderId: string, orderItems: OrderItem[]): Promise<StockDeductionResult> {
    console.log(`🔄 Starting stock restoration for order ${orderId} with ${orderItems.length} items`)

    const deductions: StockDeductionResult["deductions"] = []
    const errors: StockDeductionResult["errors"] = []

    for (const item of orderItems) {
      try {
        const result = await this.restoreStockForItem(item)
        if (result.success) {
          deductions.push({
            productId: item.product_id,
            variationId: item.variation_id,
            quantityDeducted: item.quantity,
            newStock: result.newStock,
          })
        } else {
          errors.push({
            productId: item.product_id,
            variationId: item.variation_id,
            reason: result.error || "Unknown error",
            requestedQuantity: item.quantity,
          })
        }
      } catch (error) {
        console.error(`Error restoring stock for item ${item.product_id}:`, error)
        errors.push({
          productId: item.product_id,
          variationId: item.variation_id,
          reason: error instanceof Error ? error.message : "Unknown error",
          requestedQuantity: item.quantity,
        })
      }
    }

    const success = errors.length === 0
    const message = success
      ? `Successfully restored stock for all ${deductions.length} items`
      : `Stock restoration completed with ${errors.length} errors out of ${orderItems.length} items`

    console.log(`📊 Stock restoration result for order ${orderId}: ${message}`)

    return {
      success,
      message,
      deductions,
      errors,
    }
  }

  /**
   * Check if sufficient stock is available for order items
   */
  async checkStockAvailability(orderItems: OrderItem[]): Promise<StockAvailabilityCheck> {
    const insufficientItems: StockAvailabilityCheck["insufficientItems"] = []

    for (const item of orderItems) {
      try {
        const currentStock = await this.getCurrentStock(item.product_id, item.variation_id)
        if (currentStock < item.quantity) {
          insufficientItems.push({
            productId: item.product_id,
            variationId: item.variation_id,
            available: currentStock,
            required: item.quantity,
          })
        }
      } catch (error) {
        console.error(`Error checking stock for item ${item.product_id}:`, error)
        insufficientItems.push({
          productId: item.product_id,
          variationId: item.variation_id,
          available: 0,
          required: item.quantity,
        })
      }
    }

    return {
      available: insufficientItems.length === 0,
      insufficientItems,
    }
  }

  /**
   * Deduct stock for a single item using transaction
   */
  private async deductStockForItem(item: OrderItem): Promise<{
    success: boolean
    newStock: number
    error?: string
    availableStock?: number
  }> {
    return await runTransaction(db, async (transaction) => {
      const productRef = doc(db, "products", item.product_id)
      const productDoc = await transaction.get(productRef)

      if (!productDoc.exists()) {
        throw new Error(`Product ${item.product_id} not found`)
      }

      const productData = productDoc.data()

      if (item.variation_id) {
        // Handle variation stock
        const variations = productData.variations || []
        const variationIndex = variations.findIndex((v: any) => v.id === item.variation_id)

        if (variationIndex === -1) {
          throw new Error(`Variation ${item.variation_id} not found`)
        }

        const variation = variations[variationIndex]
        const currentStock = variation.stock || 0

        if (currentStock < item.quantity) {
          return {
            success: false,
            newStock: currentStock,
            error: `Insufficient stock: ${currentStock} available, ${item.quantity} requested`,
            availableStock: currentStock,
          }
        }

        const newStock = currentStock - item.quantity
        variations[variationIndex] = { ...variation, stock: newStock }

        transaction.update(productRef, { variations })

        return {
          success: true,
          newStock,
        }
      } else {
        // Handle simple product stock
        const currentStock = productData.stock || 0

        if (currentStock < item.quantity) {
          return {
            success: false,
            newStock: currentStock,
            error: `Insufficient stock: ${currentStock} available, ${item.quantity} requested`,
            availableStock: currentStock,
          }
        }

        const newStock = currentStock - item.quantity
        transaction.update(productRef, { stock: newStock })

        return {
          success: true,
          newStock,
        }
      }
    })
  }

  /**
   * Restore stock for a single item using transaction
   */
  private async restoreStockForItem(item: OrderItem): Promise<{
    success: boolean
    newStock: number
    error?: string
  }> {
    return await runTransaction(db, async (transaction) => {
      const productRef = doc(db, "products", item.product_id)
      const productDoc = await transaction.get(productRef)

      if (!productDoc.exists()) {
        throw new Error(`Product ${item.product_id} not found`)
      }

      const productData = productDoc.data()

      if (item.variation_id) {
        // Handle variation stock restoration
        const variations = productData.variations || []
        const variationIndex = variations.findIndex((v: any) => v.id === item.variation_id)

        if (variationIndex === -1) {
          throw new Error(`Variation ${item.variation_id} not found`)
        }

        const variation = variations[variationIndex]
        const currentStock = variation.stock || 0
        const newStock = currentStock + item.quantity

        variations[variationIndex] = { ...variation, stock: newStock }
        transaction.update(productRef, { variations })

        return {
          success: true,
          newStock,
        }
      } else {
        // Handle simple product stock restoration
        const currentStock = productData.stock || 0
        const newStock = currentStock + item.quantity

        transaction.update(productRef, { stock: newStock })

        return {
          success: true,
          newStock,
        }
      }
    })
  }

  /**
   * Get current stock for a product or variation
   */
  private async getCurrentStock(productId: string, variationId?: string): Promise<number> {
    const productRef = doc(db, "products", productId)
    const productDoc = await getDoc(productRef)

    if (!productDoc.exists()) {
      throw new Error(`Product ${productId} not found`)
    }

    const productData = productDoc.data()

    if (variationId) {
      const variations = productData.variations || []
      const variation = variations.find((v: any) => v.id === variationId)
      return variation?.stock || 0
    } else {
      return productData.stock || 0
    }
  }
}

export const stockManagementService = new StockManagementService()

/**
 * Format order items for stock management
 */
export function formatOrderItemsForStock(orderItems: any[]): OrderItem[] {
  return orderItems.map((item) => ({
    product_id: item.product_id || item.productId,
    variation_id: item.variation_id || item.variationId,
    quantity: item.quantity,
    product_name: item.product_name || item.productName,
    variation_name: item.variation_name || item.variationName,
  }))
}
