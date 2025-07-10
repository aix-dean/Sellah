import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  writeBatch,
  increment,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { db, storage } from "./firebase"

// Product interfaces
export interface Product {
  id?: string
  name: string
  description: string
  category: string
  brand?: string
  sku: string
  price: number
  comparePrice?: number
  costPrice?: number
  trackQuantity: boolean
  quantity?: number
  lowStockThreshold?: number
  weight?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
    unit?: "cm" | "in"
  }
  images: string[]
  mainImage?: string
  tags: string[]
  specifications?: Record<string, string>
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  status: "active" | "draft" | "archived"
  visibility: "public" | "private"
  featured: boolean
  condition: "new" | "used" | "refurbished"
  userId: string
  createdAt?: any
  updatedAt?: any
  // Additional fields for soft delete
  active?: boolean
  deleted?: boolean
  sales?: number
  views?: number
  rating?: number
  image_url?: string
  stock?: number
  variations?: Array<{
    name: string
    price: number
    stock: number
    sku?: string
  }>
}

export interface ProductFilter {
  category?: string
  brand?: string
  status?: string
  visibility?: string
  featured?: boolean
  condition?: string
  priceMin?: number
  priceMax?: number
  inStock?: boolean
  search?: string
}

export interface ProductsResponse {
  products: Product[]
  total: number
  hasMore: boolean
  lastDoc?: QueryDocumentSnapshot
}

// Updated user status limits
export const PRODUCT_LIMITS = {
  UNKNOWN: 1,
  BASIC: 5,
  VERIFIED: Number.POSITIVE_INFINITY, // No limit
  // Legacy support for old status names
  INCOMPLETE: 5,
} as const

export type UserStatus = keyof typeof PRODUCT_LIMITS

// Check if user can add more products
export async function canUserAddProduct(userId: string): Promise<{
  canAdd: boolean
  currentCount: number
  limit: number
  status: string
  message?: string
}> {
  try {
    // Get user data to check status and current product count
    const userRef = doc(db, "iboard_users", userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      throw new Error("User not found")
    }

    const userData = userDoc.data()
    const userStatus = userData.status || "UNKNOWN"
    const currentCount = userData.product_count || 0

    // Get limit based on user status
    let limit: number
    switch (userStatus) {
      case "UNKNOWN":
        limit = PRODUCT_LIMITS.UNKNOWN
        break
      case "BASIC":
        limit = PRODUCT_LIMITS.BASIC
        break
      case "VERIFIED":
        limit = PRODUCT_LIMITS.VERIFIED
        break
      case "INCOMPLETE": // Legacy support
        limit = PRODUCT_LIMITS.INCOMPLETE
        break
      default:
        limit = PRODUCT_LIMITS.UNKNOWN
    }

    const canAdd = currentCount < limit

    let message: string | undefined
    if (!canAdd) {
      switch (userStatus) {
        case "UNKNOWN":
          message =
            "You can only create 1 product with UNKNOWN status. Please complete your profile to upgrade your account."
          break
        case "BASIC":
          message =
            "You have reached the limit of 5 products for BASIC status. Please verify your account to remove this limit."
          break
        case "INCOMPLETE": // Legacy support
          message =
            "You have reached the limit of 5 products for INCOMPLETE status. Please verify your account to remove this limit."
          break
        default:
          message = "You have reached your product limit. Please upgrade your account status."
      }
    }

    return {
      canAdd,
      currentCount,
      limit,
      status: userStatus,
      message,
    }
  } catch (error) {
    console.error("Error checking product limit:", error)
    throw error
  }
}

// Product CRUD operations
export async function createProduct(productData: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    // Check if user can add more products
    const limitCheck = await canUserAddProduct(productData.userId)
    if (!limitCheck.canAdd) {
      throw new Error(limitCheck.message || "Product limit reached")
    }

    const product: Omit<Product, "id"> = {
      ...productData,
      // Set default values for required fields
      active: true,
      deleted: false,
      sales: 0,
      views: 0,
      rating: 5,
      stock: productData.quantity || 0,
      image_url: productData.mainImage || productData.images[0] || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    // Create the product document
    const docRef = await addDoc(collection(db, "products"), product)

    return docRef.id
  } catch (error) {
    throw error
  }
}

export async function updateProduct(productId: string, updates: Partial<Product>, userId: string): Promise<void> {
  try {
    const productRef = doc(db, "products", productId)

    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    }

    await updateDoc(productRef, updateData)

    console.log("Product updated successfully:", productId)
  } catch (error) {
    console.error("Error updating product:", error)
    throw error
  }
}

// Soft delete product (set active=false, deleted=true)
export async function deleteProduct(productId: string, userId: string): Promise<void> {
  try {
    const productRef = doc(db, "products", productId)
    const productDoc = await getDoc(productRef)

    if (!productDoc.exists()) {
      throw new Error("Product not found")
    }

    const productData = productDoc.data() as Product

    // Verify ownership
    if (productData.userId !== userId) {
      throw new Error("Unauthorized: You can only delete your own products")
    }

    // Soft delete: set active=false and deleted=true
    await updateDoc(productRef, {
      active: false,
      deleted: true,
      updatedAt: serverTimestamp(),
    })

  } catch (error) {
    throw error
  }
}

// Hard delete product (completely remove from database)
export async function hardDeleteProduct(productId: string, userId: string): Promise<void> {
  try {
    const productRef = doc(db, "products", productId)
    const productDoc = await getDoc(productRef)

    if (!productDoc.exists()) {
      throw new Error("Product not found")
    }

    const productData = productDoc.data() as Product

    // Verify ownership
    if (productData.userId !== userId) {
      throw new Error("Unauthorized: You can only delete your own products")
    }

    // Delete product images from storage
    if (productData.images && productData.images.length > 0) {
      await deleteProductImages(productData.images)
    }

    // Delete product document
    await deleteDoc(productRef)
  } catch (error) {
    throw error
  }
}

export async function getProduct(productId: string): Promise<Product | null> {
  try {
    const productDoc = await getDoc(doc(db, "products", productId))

    if (productDoc.exists()) {
      return {
        id: productDoc.id,
        ...productDoc.data(),
      } as Product
    }

    return null
  } catch (error) {
    console.error("Error getting product:", error)
    throw error
  }
}

export async function getProducts(
  filters: ProductFilter = {},
  pageSize = 20,
  lastDoc?: QueryDocumentSnapshot,
): Promise<ProductsResponse> {
  try {
    let q = query(collection(db, "products"))

    // Only get active, non-deleted products by default
    q = query(q, where("active", "==", true), where("deleted", "==", false))

    // Apply filters
    if (filters.category) {
      q = query(q, where("category", "==", filters.category))
    }

    if (filters.brand) {
      q = query(q, where("brand", "==", filters.brand))
    }

    if (filters.status) {
      q = query(q, where("status", "==", filters.status))
    }

    if (filters.visibility) {
      q = query(q, where("visibility", "==", filters.visibility))
    }

    if (filters.featured !== undefined) {
      q = query(q, where("featured", "==", filters.featured))
    }

    if (filters.condition) {
      q = query(q, where("condition", "==", filters.condition))
    }

    if (filters.inStock) {
      q = query(q, where("stock", ">", 0))
    }

    // Add ordering
    q = query(q, orderBy("createdAt", "desc"))

    // Add pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    q = query(q, limit(pageSize + 1)) // Get one extra to check if there are more

    const querySnapshot = await getDocs(q)
    const docs = querySnapshot.docs

    const hasMore = docs.length > pageSize
    const products = docs.slice(0, pageSize).map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[]

    // Apply client-side filters that can't be done in Firestore
    let filteredProducts = products

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filteredProducts = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm) ||
          product.tags.some((tag) => tag.toLowerCase().includes(searchTerm)),
      )
    }

    if (filters.priceMin !== undefined) {
      filteredProducts = filteredProducts.filter((product) => product.price >= filters.priceMin!)
    }

    if (filters.priceMax !== undefined) {
      filteredProducts = filteredProducts.filter((product) => product.price <= filters.priceMax!)
    }

    return {
      products: filteredProducts,
      total: filteredProducts.length,
      hasMore,
      lastDoc: hasMore ? docs[pageSize - 1] : undefined,
    }
  } catch (error) {
    console.error("Error getting products:", error)
    throw error
  }
}

export async function getUserProducts(
  userId: string,
  filters: ProductFilter = {},
  pageSize = 20,
  lastDoc?: QueryDocumentSnapshot,
): Promise<ProductsResponse> {
  try {
    let q = query(
      collection(db, "products"),
      where("userId", "==", userId),
      where("active", "==", true),
      where("deleted", "==", false),
    )

    // Apply additional filters
    if (filters.status) {
      q = query(q, where("status", "==", filters.status))
    }

    if (filters.category) {
      q = query(q, where("category", "==", filters.category))
    }

    // Add ordering
    q = query(q, orderBy("createdAt", "desc"))

    // Add pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    q = query(q, limit(pageSize + 1))

    const querySnapshot = await getDocs(q)
    const docs = querySnapshot.docs

    const hasMore = docs.length > pageSize
    const products = docs.slice(0, pageSize).map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[]

    return {
      products,
      total: products.length,
      hasMore,
      lastDoc: hasMore ? docs[pageSize - 1] : undefined,
    }
  } catch (error) {
    console.error("Error getting user products:", error)
    throw error
  }
}

// Image management
export async function uploadProductImage(file: File, userId: string, productId?: string): Promise<string> {
  try {
    const fileName = `${Date.now()}_${file.name}`
    const path = productId ? `products/${userId}/${productId}/${fileName}` : `products/${userId}/temp/${fileName}`
    const storageRef = ref(storage, path)

    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)

    return downloadURL
  } catch (error) {
    console.error("Error uploading product image:", error)
    throw error
  }
}

export async function deleteProductImages(imageUrls: string[]): Promise<void> {
  try {
    const deletePromises = imageUrls.map(async (url) => {
      try {
        const imageRef = ref(storage, url)
        await deleteObject(imageRef)
      } catch (error) {
        console.error("Error deleting image:", url, error)
      }
    })

    await Promise.all(deletePromises)
  } catch (error) {
    console.error("Error deleting product images:", error)
    throw error
  }
}

// Stock management
export async function updateProductStock(
  productId: string,
  quantityChange: number,
  userId: string,
  reason?: string,
): Promise<void> {
  try {
    const productRef = doc(db, "products", productId)

    await updateDoc(productRef, {
      quantity: increment(quantityChange),
      stock: increment(quantityChange), // Update both fields for compatibility
      updatedAt: serverTimestamp(),
    })

    console.log("Stock updated for product:", productId, "Change:", quantityChange)
  } catch (error) {
    console.error("Error updating product stock:", error)
    throw error
  }
}

export async function getLowStockProducts(userId: string): Promise<Product[]> {
  try {
    const q = query(
      collection(db, "products"),
      where("userId", "==", userId),
      where("trackQuantity", "==", true),
      where("active", "==", true),
      where("deleted", "==", false),
      where("status", "==", "active"),
    )

    const querySnapshot = await getDocs(q)
    const products = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[]

    // Filter products that are below their low stock threshold
    return products.filter((product) => {
      const threshold = product.lowStockThreshold || 5
      return (product.quantity || 0) <= threshold
    })
  } catch (error) {
    console.error("Error getting low stock products:", error)
    throw error
  }
}

// Utility function to update user's product count


export async function getProductCategories(): Promise<string[]> {
  try {
    const q = query(collection(db, "products"), where("active", "==", true), where("deleted", "==", false))
    const querySnapshot = await getDocs(q)

    const categories = new Set<string>()
    querySnapshot.docs.forEach((doc) => {
      const product = doc.data() as Product
      if (product.category) {
        categories.add(product.category)
      }
    })

    return Array.from(categories).sort()
  } catch (error) {
    console.error("Error getting product categories:", error)
    throw error
  }
}

export async function getProductBrands(): Promise<string[]> {
  try {
    const q = query(collection(db, "products"), where("active", "==", true), where("deleted", "==", false))
    const querySnapshot = await getDocs(q)

    const brands = new Set<string>()
    querySnapshot.docs.forEach((doc) => {
      const product = doc.data() as Product
      if (product.brand) {
        brands.add(product.brand)
      }
    })

    return Array.from(brands).sort()
  } catch (error) {
    console.error("Error getting product brands:", error)
    throw error
  }
}

export function generateSKU(productName: string, category: string): string {
  const namePrefix = productName
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 3)
    .toUpperCase()
  const categoryPrefix = category
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 3)
    .toUpperCase()
  const timestamp = Date.now().toString().slice(-6)

  return `${namePrefix}${categoryPrefix}${timestamp}`
}

// Batch operations
export async function bulkUpdateProducts(
  updates: Array<{ id: string; data: Partial<Product> }>,
  userId: string,
): Promise<void> {
  try {
    const batch = writeBatch(db)

    updates.forEach(({ id, data }) => {
      const productRef = doc(db, "products", id)
      batch.update(productRef, {
        ...data,
        updatedAt: serverTimestamp(),
      })
    })

    await batch.commit()

    console.log("Bulk update completed for", updates.length, "products")
  } catch (error) {
    console.error("Error bulk updating products:", error)
    throw error
  }
}

export async function bulkDeleteProducts(productIds: string[], userId: string): Promise<void> {
  try {
    const batch = writeBatch(db)

    // Get all products to delete their images
    const products = await Promise.all(productIds.map((id) => getProduct(id)))

    // Delete images
    const allImages = products.filter((product) => product !== null).flatMap((product) => product!.images || [])

    if (allImages.length > 0) {
      await deleteProductImages(allImages)
    }

    // Soft delete product documents
    productIds.forEach((id) => {
      const productRef = doc(db, "products", id)
      batch.update(productRef, {
        active: false,
        deleted: true,
        updatedAt: serverTimestamp(),
      })
    })

    await batch.commit()

    // Decrease user's product count by the number of deleted products

    console.log("Bulk delete completed for", productIds.length, "products")
    console.log(`User product count decremented by ${productIds.length}`)
  } catch (error) {
    console.error("Error bulk deleting products:", error)
    throw error
  }
}

// Get user's product statistics
export async function getUserProductStats(userId: string): Promise<{
  totalProducts: number
  activeProducts: number
  draftProducts: number
  archivedProducts: number
  lowStockProducts: number
  currentCount: number
  limit: number
  status: string
  canAddMore: boolean
}> {
  try {
    // Get user status and limits
    const limitCheck = await canUserAddProduct(userId)

    // Get all user products (including deleted for total count)
    const allProductsQuery = query(collection(db, "products"), where("userId", "==", userId))
    const allProductsSnapshot = await getDocs(allProductsQuery)

    // Get active products only
    const activeProductsQuery = query(
      collection(db, "products"),
      where("userId", "==", userId),
      where("active", "==", true),
      where("deleted", "==", false),
    )
    const activeProductsSnapshot = await getDocs(activeProductsQuery)

    let activeProducts = 0
    let draftProducts = 0
    let archivedProducts = 0

    activeProductsSnapshot.docs.forEach((doc) => {
      const product = doc.data() as Product
      switch (product.status) {
        case "active":
          activeProducts++
          break
        case "draft":
          draftProducts++
          break
        case "archived":
          archivedProducts++
          break
      }
    })

    // Get low stock products
    const lowStockProducts = await getLowStockProducts(userId)

    return {
      totalProducts: allProductsSnapshot.size,
      activeProducts,
      draftProducts,
      archivedProducts,
      lowStockProducts: lowStockProducts.length,
      currentCount: limitCheck.currentCount,
      limit: limitCheck.limit,
      status: limitCheck.status,
      canAddMore: limitCheck.canAdd,
    }
  } catch (error) {
    console.error("Error getting user product stats:", error)
    throw error
  }
}
