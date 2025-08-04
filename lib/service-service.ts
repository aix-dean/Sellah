import { db, storage } from "@/lib/firebase"
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  query,
  serverTimestamp,
  where,
  orderBy,
  limit,
  startAfter,
  type QueryDocumentSnapshot,
  updateDoc, // Import updateDoc
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import type { Service } from "@/types/service"
import { PRODUCT_LIMITS, type UserStatus } from "./product-service" // Reusing product limits for services

const SERVICES_COLLECTION = "services"
const SERVICE_IMAGES_FOLDER = "service_images"
const servicesCollection = collection(db, "services")

export interface ServicesResponse {
  services: Service[]
  total: number
  hasMore: boolean
  lastDoc?: QueryDocumentSnapshot
}

// Check if user can add more services (reusing product limits for now)
export async function canUserAddService(userId: string): Promise<{
  canAdd: boolean
  currentCount: number
  limit: number
  status: string
  message?: string
}> {
  try {
    // Get user data to check status and current service count
    const userRef = doc(db, "iboard_users", userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      throw new Error("User not found")
    }

    const userData = userDoc.data()
    const userStatus: UserStatus = userData.status || "UNKNOWN"
    const currentCount = userData.service_count || 0 // Assuming a 'service_count' field

    // Get limit based on user status
    const limit = PRODUCT_LIMITS[userStatus] || PRODUCT_LIMITS.UNKNOWN

    const canAdd = currentCount < limit

    let message: string | undefined
    if (!canAdd) {
      switch (userStatus) {
        case "UNKNOWN":
          message =
            "You can only create 1 service with UNKNOWN status. Please complete your profile to upgrade your account."
          break
        case "BASIC":
          message =
            "You have reached the limit of 5 services for BASIC status. Please verify your account to remove this limit."
          break
        case "INCOMPLETE": // Legacy support
          message =
            "You have reached the limit of 5 services for INCOMPLETE status. Please verify your account to remove this limit."
          break
        default:
          message = "You have reached your service limit. Please upgrade your account status."
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
    console.error("Error checking service limit:", error)
    throw error
  }
}

// Service CRUD operations
export async function createService(serviceData: Omit<Service, "id" | "created_at" | "updated_at">): Promise<string> {
  try {
    // Check if user can add more services
    const limitCheck = await canUserAddService(serviceData.userId)
    if (!limitCheck.canAdd) {
      throw new Error(limitCheck.message || "Service limit reached")
    }

    const service: Omit<Service, "id"> = {
      ...serviceData,
      // Set default values for required fields
      active: true,
      deleted: false,
      bookings: 0,
      views: 0,
      rating: 5,
      image_url: serviceData.mainImage || serviceData.images[0] || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    // Create the service document
    const docRef = await addDoc(collection(db, "services"), service)

    // Increment user's service count
    const userRef = doc(db, "iboard_users", serviceData.userId)
    await updateDoc(userRef, {
      service_count: (limitCheck.currentCount || 0) + 1,
      updated_at: serverTimestamp(),
    })

    return docRef.id
  } catch (error) {
    throw error
  }
}

export async function updateService(serviceId: string, updates: Partial<Service>, userId: string): Promise<void> {
  try {
    const serviceRef = doc(db, "services", serviceId)

    const updateData = {
      ...updates,
      updated_at: serverTimestamp(),
    }

    await updateDoc(serviceRef, updateData)
    console.log("Service updated successfully:", serviceId)
  } catch (error) {
    console.error("Error updating service:", error)
    throw error
  }
}

export async function deleteService(serviceId: string, userId: string): Promise<void> {
  try {
    const serviceRef = doc(db, "services", serviceId)
    const serviceDoc = await getDoc(serviceRef)

    if (!serviceDoc.exists()) {
      throw new Error("Service not found")
    }

    const serviceData = serviceDoc.data() as Service

    // Verify ownership
    if (serviceData.user_id !== userId) {
      throw new Error("Unauthorized: You can only delete your own services")
    }

    await deleteDoc(serviceRef)
  } catch (error) {
    console.error("Error deleting service:", error)
    throw error
  }
}

export async function getService(serviceId: string): Promise<Service | null> {
  try {
    const serviceDoc = await getDoc(doc(db, "services", serviceId))

    if (serviceDoc.exists()) {
      return {
        id: serviceDoc.id,
        ...serviceDoc.data(),
      } as Service
    }

    return null
  } catch (error) {
    console.error("Error getting service:", error)
    throw error
  }
}

export async function getServices(
  filters: any = {}, // Renamed ServiceFilter to any to avoid redeclaration
  pageSize = 20,
  lastDoc?: QueryDocumentSnapshot,
): Promise<ServicesResponse> {
  try {
    let q = query(collection(db, "services"))

    // Apply filters
    if (filters.category) {
      q = query(q, where("categories", "array-contains", filters.category))
    }

    if (filters.status) {
      q = query(q, where("status", "==", filters.status))
    }

    // Add ordering
    q = query(q, orderBy("created_at", "desc"))

    // Add pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    q = query(q, limit(pageSize + 1))

    const querySnapshot = await getDocs(q)
    const docs = querySnapshot.docs

    const hasMore = docs.length > pageSize
    const services = docs.slice(0, pageSize).map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Service[]

    return {
      services,
      total: services.length,
      hasMore,
      lastDoc: hasMore ? docs[pageSize - 1] : undefined,
    }
  } catch (error) {
    console.error("Error getting services:", error)
    throw error
  }
}

export async function getUserServices(
  userId: string,
  filters: any = {}, // Renamed ServiceFilter to any to avoid redeclaration
  pageSize = 20,
  lastDoc?: QueryDocumentSnapshot,
): Promise<ServicesResponse> {
  try {
    let q = query(collection(db, "services"), where("user_id", "==", userId))

    // Apply additional filters
    if (filters.status) {
      q = query(q, where("status", "==", filters.status))
    }

    if (filters.category) {
      q = query(q, where("categories", "array-contains", filters.category))
    }

    // Add ordering
    q = query(q, orderBy("created_at", "desc"))

    // Add pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    q = query(q, limit(pageSize + 1))

    const querySnapshot = await getDocs(q)
    const docs = querySnapshot.docs

    const hasMore = docs.length > pageSize
    const services = docs.slice(0, pageSize).map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Service[]

    return {
      services,
      total: services.length,
      hasMore,
      lastDoc: hasMore ? docs[pageSize - 1] : undefined,
    }
  } catch (error) {
    console.error("Error getting user services:", error)
    throw error
  }
}

// Image management for services
export async function uploadServiceImage(file: File, userId: string, serviceId?: string): Promise<string> {
  try {
    const fileName = `${Date.now()}_${file.name}`
    const path = serviceId ? `services/${userId}/${serviceId}/${fileName}` : `services/${userId}/temp/${fileName}`
    const storageRef = ref(storage, path)

    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)

    return downloadURL
  } catch (error) {
    console.error("Error uploading service image:", error)
    throw error
  }
}

export async function deleteServiceImages(imageUrls: string[]): Promise<void> {
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
    console.error("Error deleting service images:", error)
    throw error
  }
}
