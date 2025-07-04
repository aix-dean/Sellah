import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { db, storage } from "@/lib/firebase"

export enum ProductStatus {
  Draft = "draft",
  Published = "published",
  Archived = "archived",
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  stock: number
  sku: string
  weight: number
  dimensions: string
  location: string // Changed from object to string
  status: ProductStatus
  isFeatured: boolean
  imageUrls: string[]
  courier: string
  shippingFee: number
  companyId: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateProductData {
  name: string
  description: string
  price: number
  category: string
  stock: number
  sku: string
  weight: number
  dimensions: string
  location:
    | {
        street: string
        city: string
        province: string
        postal_code: string
      }
    | string // Accept both object and string
  status: ProductStatus
  isFeatured: boolean
  imageUrls: string[]
  courier: string
  shippingFee: number
  companyId: string
  userId: string
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string
}

export interface ProductFilters {
  category?: string
  status?: ProductStatus
  companyId?: string
  userId?: string
  isFeatured?: boolean
  searchTerm?: string
}

export interface PaginationOptions {
  limit?: number
  lastDoc?: QueryDocumentSnapshot<DocumentData>
}

export interface ProductsResponse {
  products: Product[]
  lastDoc?: QueryDocumentSnapshot<DocumentData>
  hasMore: boolean
  total: number
}

// Helper function to convert location object to string
function formatLocationString(location: any): string {
  if (typeof location === "string") {
    return location
  }

  if (typeof location === "object" && location !== null) {
    const { street = "", city = "", province = "", postal_code = "" } = location
    return [street, city, province, postal_code].filter(Boolean).join(", ")
  }

  return ""
}

export async function createProduct(productData: CreateProductData): Promise<string> {
  try {
    // Convert location object to string if it's an object
    const locationString = formatLocationString(productData.location)

    const docData = {
      ...productData,
      location: locationString, // Store as string in Firestore
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "products"), docData)
    return docRef.id
  } catch (error) {
    console.error("Error creating product:", error)
    throw new Error("Failed to create product")
  }
}

export async function updateProduct(productData: UpdateProductData): Promise<void> {
  try {
    const { id, ...updateData } = productData

    // Convert location object to string if it's an object
    if (updateData.location) {
      updateData.location = formatLocationString(updateData.location)
    }

    const docRef = doc(db, "products", id)
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating product:", error)
    throw new Error("Failed to update product")
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  try {
    const docRef = doc(db, "products", productId)
    await deleteDoc(docRef)
  } catch (error) {
    console.error("Error deleting product:", error)
    throw new Error("Failed to delete product")
  }
}

export async function getProduct(productId: string): Promise<Product | null> {
  try {
    const docRef = doc(db, "products", productId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Product
    }

    return null
  } catch (error) {
    console.error("Error getting product:", error)
    throw new Error("Failed to get product")
  }
}

export async function getProducts(
  filters: ProductFilters = {},
  pagination: PaginationOptions = {},
): Promise<ProductsResponse> {
  try {
    const { limit: pageLimit = 10, lastDoc } = pagination
    const { category, status, companyId, userId, isFeatured, searchTerm } = filters

    let q = query(collection(db, "products"))

    // Apply filters
    if (category) {
      q = query(q, where("category", "==", category))
    }
    if (status) {
      q = query(q, where("status", "==", status))
    }
    if (companyId) {
      q = query(q, where("companyId", "==", companyId))
    }
    if (userId) {
      q = query(q, where("userId", "==", userId))
    }
    if (isFeatured !== undefined) {
      q = query(q, where("isFeatured", "==", isFeatured))
    }

    // Add ordering and pagination
    q = query(q, orderBy("createdAt", "desc"))

    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    q = query(q, limit(pageLimit + 1)) // Get one extra to check if there are more

    const querySnapshot = await getDocs(q)
    const products: Product[] = []
    const docs = querySnapshot.docs

    // Process documents
    for (let i = 0; i < Math.min(docs.length, pageLimit); i++) {
      const doc = docs[i]
      const data = doc.data()

      // Filter by search term if provided (client-side filtering)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const nameMatch = data.name?.toLowerCase().includes(searchLower)
        const descMatch = data.description?.toLowerCase().includes(searchLower)
        const skuMatch = data.sku?.toLowerCase().includes(searchLower)

        if (!nameMatch && !descMatch && !skuMatch) {
          continue
        }
      }

      products.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Product)
    }

    const hasMore = docs.length > pageLimit
    const newLastDoc = docs.length > 0 ? docs[Math.min(docs.length - 1, pageLimit - 1)] : undefined

    return {
      products,
      lastDoc: newLastDoc,
      hasMore,
      total: products.length, // This is just the current page count
    }
  } catch (error) {
    console.error("Error getting products:", error)
    throw new Error("Failed to get products")
  }
}

export async function uploadProductImage(file: File): Promise<string> {
  try {
    const timestamp = Date.now()
    const fileName = `${timestamp}-${file.name}`
    const storageRef = ref(storage, `products/${fileName}`)

    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef)

    return downloadURL
  } catch (error) {
    console.error("Error uploading product image:", error)
    throw new Error("Failed to upload image")
  }
}

export async function deleteProductImage(imageUrl: string): Promise<void> {
  try {
    const imageRef = ref(storage, imageUrl)
    await deleteObject(imageRef)
  } catch (error) {
    console.error("Error deleting product image:", error)
    throw new Error("Failed to delete image")
  }
}

export async function getFeaturedProducts(limit = 10): Promise<Product[]> {
  try {
    const q = query(
      collection(db, "products"),
      where("isFeatured", "==", true),
      where("status", "==", ProductStatus.Published),
      orderBy("createdAt", "desc"),
      limit(limit),
    )

    const querySnapshot = await getDocs(q)
    const products: Product[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      products.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Product)
    })

    return products
  } catch (error) {
    console.error("Error getting featured products:", error)
    throw new Error("Failed to get featured products")
  }
}

export async function getProductsByCategory(category: string, limit = 10): Promise<Product[]> {
  try {
    const q = query(
      collection(db, "products"),
      where("category", "==", category),
      where("status", "==", ProductStatus.Published),
      orderBy("createdAt", "desc"),
      limit(limit),
    )

    const querySnapshot = await getDocs(q)
    const products: Product[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      products.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Product)
    })

    return products
  } catch (error) {
    console.error("Error getting products by category:", error)
    throw new Error("Failed to get products by category")
  }
}
