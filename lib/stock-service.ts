import { doc, getDoc, runTransaction, collection, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface OrderItem {
  product_id: string
  product_name: string
  quantity: number
  variation_id?: string
  variation_data?: {
    id?: string
    stock?: number
    [key: string]: any
  }
}

interface StockDeductionResult {
  success: boolean
  message: string
  insufficientItems?: Array<{
    product_name: string
    variation_name?: string
    requested: number
    available: number
  }>
}

export const deductStockFromOrder = async (
  orderId: string,
  orderItems: OrderItem[],
  userId: string,
  userName?: string,
): Promise<StockDeductionResult> => {
  try {
    console.log("🔄 Starting stock deduction for order:", orderId)

    // First, check if all items have sufficient stock
    const insufficientItems: Array<{
      product_name: string
      variation_name?: string
      requested: number
      available: number
    }> = []

    // Check stock availability for each item
    for (const item of orderItems) {
      const productRef = doc(db, "products", item.product_id)
      const productDoc = await getDoc(productRef)

      if (!productDoc.exists()) {
        console.warn(`Product ${item.product_id} not found`)
        continue
      }

      const productData = productDoc.data()

      if (item.variation_id && productData.variations) {
        // Handle variation stock
        const variation = productData.variations.find((v: any) => v.id === item.variation_id)
        if (variation) {
          const availableStock = variation.stock || 0
          if (availableStock < item.quantity) {
            insufficientItems.push({
              product_name: item.product_name,
              variation_name: variation.name || item.variation_data?.name || "Unknown Variation",
              requested: item.quantity,
              available: availableStock,
            })
          }
        }
      } else {
        // Handle main product stock
        const availableStock = productData.stock || 0
        if (availableStock < item.quantity) {
          insufficientItems.push({
            product_name: item.product_name,
            requested: item.quantity,
            available: availableStock,
          })
        }
      }
    }

    // If there are insufficient items, return error
    if (insufficientItems.length > 0) {
      return {
        success: false,
        message: "Insufficient stock for some items",
        insufficientItems,
      }
    }

    // Proceed with stock deduction using transaction
    await runTransaction(db, async (transaction) => {
      const stockUpdates: Array<{
        productRef: any
        productData: any
        item: OrderItem
      }> = []

      // Get all product data within transaction
      for (const item of orderItems) {
        const productRef = doc(db, "products", item.product_id)
        const productDoc = await transaction.get(productRef)

        if (productDoc.exists()) {
          stockUpdates.push({
            productRef,
            productData: productDoc.data(),
            item,
          })
        }
      }

      // Update stock for each item
      for (const { productRef, productData, item } of stockUpdates) {
        if (item.variation_id && productData.variations) {
          // Update variation stock
          const updatedVariations = productData.variations.map((variation: any) => {
            if (variation.id === item.variation_id) {
              const newStock = Math.max(0, (variation.stock || 0) - item.quantity)
              console.log(
                `📦 Deducting ${item.quantity} from variation ${variation.name}: ${variation.stock} → ${newStock}`,
              )
              return {
                ...variation,
                stock: newStock,
              }
            }
            return variation
          })

          transaction.update(productRef, {
            variations: updatedVariations,
            updated_at: new Date(),
          })
        } else {
          // Update main product stock
          const newStock = Math.max(0, (productData.stock || 0) - item.quantity)
          console.log(
            `📦 Deducting ${item.quantity} from product ${item.product_name}: ${productData.stock} → ${newStock}`,
          )

          transaction.update(productRef, {
            stock: newStock,
            updated_at: new Date(),
          })
        }
      }
    })

    // Log stock activity
    await logStockActivity(orderId, orderItems, userId, userName)

    console.log("✅ Stock deduction completed successfully")
    return {
      success: true,
      message: "Stock deducted successfully",
    }
  } catch (error) {
    console.error("❌ Error deducting stock:", error)
    return {
      success: false,
      message: `Failed to deduct stock: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

export const restoreStockFromOrder = async (
  orderId: string,
  orderItems: OrderItem[],
  userId: string,
  userName?: string,
): Promise<StockDeductionResult> => {
  try {
    console.log("🔄 Starting stock restoration for order:", orderId)

    // Restore stock using transaction
    await runTransaction(db, async (transaction) => {
      const stockUpdates: Array<{
        productRef: any
        productData: any
        item: OrderItem
      }> = []

      // Get all product data within transaction
      for (const item of orderItems) {
        const productRef = doc(db, "products", item.product_id)
        const productDoc = await transaction.get(productRef)

        if (productDoc.exists()) {
          stockUpdates.push({
            productRef,
            productData: productDoc.data(),
            item,
          })
        }
      }

      // Restore stock for each item
      for (const { productRef, productData, item } of stockUpdates) {
        if (item.variation_id && productData.variations) {
          // Restore variation stock
          const updatedVariations = productData.variations.map((variation: any) => {
            if (variation.id === item.variation_id) {
              const newStock = (variation.stock || 0) + item.quantity
              console.log(
                `📦 Restoring ${item.quantity} to variation ${variation.name}: ${variation.stock} → ${newStock}`,
              )
              return {
                ...variation,
                stock: newStock,
              }
            }
            return variation
          })

          transaction.update(productRef, {
            variations: updatedVariations,
            updated_at: new Date(),
          })
        } else {
          // Restore main product stock
          const newStock = (productData.stock || 0) + item.quantity
          console.log(
            `📦 Restoring ${item.quantity} to product ${item.product_name}: ${productData.stock} → ${newStock}`,
          )

          transaction.update(productRef, {
            stock: newStock,
            updated_at: new Date(),
          })
        }
      }
    })

    // Log stock activity
    await logStockActivity(orderId, orderItems, userId, userName, "restore")

    console.log("✅ Stock restoration completed successfully")
    return {
      success: true,
      message: "Stock restored successfully",
    }
  } catch (error) {
    console.error("❌ Error restoring stock:", error)
    return {
      success: false,
      message: `Failed to restore stock: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

const logStockActivity = async (
  orderId: string,
  orderItems: OrderItem[],
  userId: string,
  userName?: string,
  action: "deduct" | "restore" = "deduct",
) => {
  try {
    const stockActivitiesRef = collection(db, "stock_activities")

    for (const item of orderItems) {
      const activityData = {
        order_id: orderId,
        product_id: item.product_id,
        product_name: item.product_name,
        variation_id: item.variation_id || null,
        variation_name: item.variation_data?.name || null,
        quantity: item.quantity,
        action: action,
        user_id: userId,
        user_name: userName || "System",
        timestamp: new Date(),
        metadata: {
          order_id: orderId,
          action_type: `stock_${action}`,
          reason: `Order ${action === "deduct" ? "approval" : "rejection"}`,
        },
      }

      await addDoc(stockActivitiesRef, activityData)
    }
  } catch (error) {
    console.error("Error logging stock activity:", error)
  }
}
