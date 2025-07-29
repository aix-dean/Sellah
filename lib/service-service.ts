import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, serverTimestamp, increment } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { db, storage } from "./firebase"
import type { Service } from "@/types/service"

// Service limits (can be different from product limits)
export const SERVICE_LIMITS = {
  UNKNOWN: 1,
  BASIC: 3,
  VERIFIED: Number.POSITIVE_INFINITY, // No limit
  INCOMPLETE: 3, // Legacy support
} as const

export type UserStatus = keyof typeof SERVICE_LIMITS

// Check if user can add more services
export async function canUserAddService(userId: string): Promise<{
  canAdd: boolean
  currentCount: number
  limit: number
  status: string
  message?: string
}> {
  try {
    const userRef = doc(db, "iboard_users", userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      throw new Error("User not found")
    }

    const userData = userDoc.data()
    const userStatus = userData.status || "UNKNOWN"
    const currentCount = userData.service_count || 0 // Assuming a separate service_count field

    let limit: number
    switch (userStatus) {
      case "UNKNOWN":
        limit = SERVICE_LIMITS.UNKNOWN
        break
      case "BASIC":
        limit = SERVICE_LIMITS.BASIC
        break
      case "VERIFIED":
        limit = SERVICE_LIMITS.VERIFIED
        break
      case "INCOMPLETE":
        limit = SERVICE_LIMITS.INCOMPLETE
        break
      default:
        limit = SERVICE_LIMITS.UNKNOWN
    }

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
            "You have reached the limit of 3 services for BASIC status. Please verify your account to remove this limit."
          break
        case "INCOMPLETE":
          message =
            "You have reached the limit of 3 services for INCOMPLETE status. Please verify your account to remove this limit."
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
export async function createService(serviceData: Omit<Service, "id" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    const limitCheck = await canUserAddService(serviceData.userId)
    if (!limitCheck.canAdd) {
      throw new Error(limitCheck.message || "Service limit reached")
    }

    const service: Omit<Service, "id"> = {
      ...serviceData,
      active: true,
      deleted: false,
      sales: 0,
      views: 0,
      rating: 5,
      image_url: serviceData.mainImage || serviceData.service_images[0] || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "services"), service)

    // Increment user's service count
    const userRef = doc(db, "iboard_users", serviceData.userId)
    await updateDoc(userRef, {
      service_count: increment(1),
      updatedAt: serverTimestamp(),
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
      updatedAt: serverTimestamp(),
    }
    await updateDoc(serviceRef, updateData)
    console.log("Service updated successfully:", serviceId)
  } catch (error) {
    console.error("Error updating service:", error)
    throw error
  }
}

// Soft delete service
export async function deleteService(serviceId: string, userId: string): Promise<void> {
  try {
    const serviceRef = doc(db, "services", serviceId)
    const serviceDoc = await getDoc(serviceRef)

    if (!serviceDoc.exists()) {
      throw new Error("Service not found")
    }

    await updateDoc(serviceRef, {
      active: false,
      deleted: true,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw error
  }
}

// Hard delete service (completely remove from database)
export async function hardDeleteService(serviceId: string, userId: string): Promise<void> {
  try {
    const serviceRef = doc(db, "services", serviceId)
    const serviceDoc = await getDoc(serviceRef)

    if (!serviceDoc.exists()) {
      throw new Error("Service not found")
    }

    const serviceData = serviceDoc.data() as Service

    if (serviceData.userId !== userId) {
      throw new Error("Unauthorized: You can only delete your own services")
    }

    if (serviceData.service_images && serviceData.service_images.length > 0) {
      await deleteServiceImages(serviceData.service_images)
    }

    await deleteDoc(serviceRef)

    // Decrement user's service count
    const userRef = doc(db, "iboard_users", userId)
    await updateDoc(userRef, {
      service_count: increment(-1),
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error hard deleting service:", error)
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

// Utility function to generate SKU for services (if applicable)
export function generateServiceSKU(serviceName: string, category: string): string {
  const namePrefix = serviceName
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 3)
    .toUpperCase()
  const categoryPrefix = category
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 3)
    .toUpperCase()
  const timestamp = Date.now().toString().slice(-6)
  return `SVC-${namePrefix}${categoryPrefix}${timestamp}`
}
