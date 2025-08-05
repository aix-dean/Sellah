import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  writeBatch,
  type QueryDocumentSnapshot,
  getDoc,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { db, storage } from "./firebase"
import type { Service, CreateServiceData } from "@/types/service"

export interface ServiceFilter {
  serviceType?: string
  status?: string
  priceMin?: number
  priceMax?: number
  search?: string
}

export interface ServicesResponse {
  services: Service[]
  total: number
  hasMore: boolean
  lastDoc?: QueryDocumentSnapshot
}

// Service CRUD operations
export async function createService(serviceData: CreateServiceData): Promise<string> {
  try {
    const service = {
      ...serviceData,
      type: "SERVICES", // Ensure type is set to SERVICES
      active: true,
      deleted: false,
      views: 0,
      bookings: 0,
      rating: 5,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    // Create the service document in the products collection
    const docRef = await addDoc(collection(db, "products"), service)

    return docRef.id
  } catch (error) {
    console.error("Error creating service:", error)
    throw error
  }
}

export async function updateService(serviceId: string, updates: Partial<Service>, userId: string): Promise<void> {
  try {
    const serviceRef = doc(db, "products", serviceId)

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

// Soft delete service (set active=false, deleted=true)
export async function deleteService(serviceId: string, userId: string): Promise<void> {
  try {
    const serviceRef = doc(db, "products", serviceId)
    const serviceDoc = await getDoc(serviceRef)

    if (!serviceDoc.exists()) {
      throw new Error("Service not found")
    }

    const serviceData = serviceDoc.data() as Service

    // Verify ownership
    if (serviceData.userId !== userId) {
      throw new Error("Unauthorized: You can only delete your own services")
    }

    // Soft delete: set active=false and deleted=true
    await updateDoc(serviceRef, {
      active: false,
      deleted: true,
      updatedAt: serverTimestamp(),
    })

    console.log("Service soft deleted successfully:", serviceId)
  } catch (error) {
    console.error("Error deleting service:", error)
    throw error
  }
}

export async function getService(serviceId: string): Promise<Service | null> {
  try {
    const serviceDoc = await getDoc(doc(db, "products", serviceId))

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
  filters: ServiceFilter = {},
  pageSize = 20,
  lastDoc?: QueryDocumentSnapshot,
): Promise<ServicesResponse> {
  try {
    let q = query(
      collection(db, "products"),
      where("type", "==", "SERVICES"),
      where("active", "==", true),
      where("deleted", "==", false),
    )

    // Apply filters
    if (filters.serviceType) {
      q = query(q, where("serviceType", "==", filters.serviceType))
    }

    if (filters.status) {
      q = query(q, where("status", "==", filters.status))
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
    const services = docs.slice(0, pageSize).map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Service[]

    // Apply client-side filters that can't be done in Firestore
    let filteredServices = services

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filteredServices = services.filter(
        (service) =>
          service.name.toLowerCase().includes(searchTerm) || service.description.toLowerCase().includes(searchTerm),
      )
    }

    if (filters.priceMin !== undefined) {
      filteredServices = filteredServices.filter((service) => service.price >= filters.priceMin!)
    }

    if (filters.priceMax !== undefined) {
      filteredServices = filteredServices.filter((service) => service.price <= filters.priceMax!)
    }

    return {
      services: filteredServices,
      total: filteredServices.length,
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
  filters: ServiceFilter = {},
  pageSize = 20,
  lastDoc?: QueryDocumentSnapshot,
): Promise<ServicesResponse> {
  try {
    let q = query(
      collection(db, "products"),
      where("userId", "==", userId),
      where("type", "==", "SERVICES"),
      where("active", "==", true),
      where("deleted", "==", false),
    )

    // Apply additional filters
    if (filters.status) {
      q = query(q, where("status", "==", filters.status))
    }

    if (filters.serviceType) {
      q = query(q, where("serviceType", "==", filters.serviceType))
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

// Image management
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
        // Firebase Storage URLs can be complex. Extract path from URL.
        const urlObj = new URL(url)
        const path = decodeURIComponent(urlObj.pathname.split("/o/")[1].split("?")[0])
        const imageRef = ref(storage, path)
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

// Batch operations
export async function bulkUpdateServices(
  updates: Array<{ id: string; data: Partial<Service> }>,
  userId: string,
): Promise<void> {
  try {
    const batch = writeBatch(db)

    updates.forEach(({ id, data }) => {
      const serviceRef = doc(db, "products", id)
      batch.update(serviceRef, {
        ...data,
        updatedAt: serverTimestamp(),
      })
    })

    await batch.commit()

    console.log("Bulk update completed for", updates.length, "services")
  } catch (error) {
    console.error("Error bulk updating services:", error)
    throw error
  }
}

export async function bulkDeleteServices(serviceIds: string[], userId: string): Promise<void> {
  try {
    const batch = writeBatch(db)

    // Get all services to delete their images
    const services = await Promise.all(serviceIds.map((id) => getService(id)))

    // Delete images
    const allImages = services
      .filter((service) => service !== null)
      .flatMap((service) => (service!.imageUrls ? service!.imageUrls : [])) // Use imageUrls

    if (allImages.length > 0) {
      await deleteServiceImages(allImages)
    }

    // Soft delete service documents
    serviceIds.forEach((id) => {
      const serviceRef = doc(db, "products", id)
      batch.update(serviceRef, {
        active: false,
        deleted: true,
        updatedAt: serverTimestamp(),
      })
    })

    await batch.commit()

    console.log("Bulk delete completed for", serviceIds.length, "services")
  } catch (error) {
    console.error("Error bulk deleting services:", error)
    throw error
  }
}

// Get user's service statistics
export async function getUserServiceStats(userId: string): Promise<{
  totalServices: number
  activeServices: number
  draftServices: number
  inactiveServices: number
}> {
  try {
    // Get all user services (including deleted for total count)
    const allServicesQuery = query(
      collection(db, "products"),
      where("userId", "==", userId),
      where("type", "==", "SERVICES"),
    )
    const allServicesSnapshot = await getDocs(allServicesQuery)

    // Get active services only
    const activeServicesQuery = query(
      collection(db, "products"),
      where("userId", "==", userId),
      where("type", "==", "SERVICES"),
      where("active", "==", true),
      where("deleted", "==", false),
    )
    const activeServicesSnapshot = await getDocs(activeServicesQuery)

    let activeServices = 0
    let draftServices = 0
    let inactiveServices = 0

    activeServicesSnapshot.docs.forEach((doc) => {
      const service = doc.data() as Service
      switch (service.status) {
        case "active":
          activeServices++
          break
        case "draft":
          draftServices++
          break
        case "inactive":
          inactiveServices++
          break
      }
    })

    return {
      totalServices: allServicesSnapshot.size,
      activeServices,
      draftServices,
      inactiveServices,
    }
  } catch (error) {
    console.error("Error getting user service stats:", error)
    throw error
  }
}

export const ServiceService = {
  createService,
  updateService,
  deleteService,
  getService,
  getServices,
  getUserServices,
  uploadServiceImage,
  deleteServiceImages,
  bulkUpdateServices,
  bulkDeleteServices,
  getUserServiceStats,
}
