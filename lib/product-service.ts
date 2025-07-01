import { doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function deleteProduct(productId: string, userId: string): Promise<void> {
  try {
    // First, verify the product exists and belongs to the user
    const productRef = doc(db, "products", productId)
    const productDoc = await getDoc(productRef)

    if (!productDoc.exists()) {
      throw new Error("Product not found")
    }

    const productData = productDoc.data()

    // Check if the current user owns this product (check both seller_id and created_by)
    if (productData.seller_id !== userId && productData.created_by !== userId) {
      throw new Error("You don't have permission to delete this product")
    }

    // Soft delete: update active and deleted fields
    await updateDoc(productRef, {
      active: false, // Set active to false
      deleted: true, // Set deleted to true
      deleted_at: serverTimestamp(),
      deleted_by: userId,
      updated_at: serverTimestamp(),
    })

    console.log("Product successfully soft deleted:", productId)
  } catch (error: any) {
    console.error("Error deleting product:", error)

    // Provide user-friendly error messages
    if (error.code === "permission-denied") {
      throw new Error("You don't have permission to delete this product")
    } else if (error.code === "not-found") {
      throw new Error("Product not found")
    } else if (error.message) {
      throw new Error(error.message)
    } else {
      throw new Error("Failed to delete product. Please try again.")
    }
  }
}

export async function restoreProduct(productId: string, userId: string): Promise<void> {
  try {
    const productRef = doc(db, "products", productId)
    const productDoc = await getDoc(productRef)

    if (!productDoc.exists()) {
      throw new Error("Product not found")
    }

    const productData = productDoc.data()

    // Check if the current user owns this product
    if (productData.seller_id !== userId && productData.created_by !== userId) {
      throw new Error("You don't have permission to restore this product")
    }

    // Restore the product by setting active back to true and deleted to false
    await updateDoc(productRef, {
      active: true, // Set active back to true
      deleted: false, // Set deleted back to false
      deleted_at: null,
      deleted_by: null,
      restored_at: serverTimestamp(),
      restored_by: userId,
      updated_at: serverTimestamp(),
    })

    console.log("Product successfully restored:", productId)
  } catch (error: any) {
    console.error("Error restoring product:", error)
    throw new Error(error.message || "Failed to restore product. Please try again.")
  }
}

// Helper function to get deleted products (for admin or recovery purposes)
export async function getDeletedProducts(userId: string) {
  try {
    const { collection, query, where, getDocs } = await import("firebase/firestore")

    const productsRef = collection(db, "products")
    const q = query(
      productsRef,
      where("seller_id", "==", userId),
      where("active", "==", false),
      where("deleted", "==", true),
    )

    const querySnapshot = await getDocs(q)
    const deletedProducts: any[] = []

    querySnapshot.forEach((doc) => {
      deletedProducts.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    return deletedProducts
  } catch (error: any) {
    console.error("Error fetching deleted products:", error)
    throw new Error("Failed to fetch deleted products")
  }
}
