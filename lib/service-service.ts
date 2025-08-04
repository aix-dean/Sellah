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
  writeBatch,
  where,
  orderBy,
  limit,
  startAfter,
  type QueryDocumentSnapshot,
  updateDoc, // Import updateDoc
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import type { Service, ServiceFormData, ServiceFilter } from "@/types/service"
import { getAuth } from "firebase/auth"
import { optimizeImage } from "@/lib/media-optimizer"
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
export async function createService(serviceData: Omit<Service, "id" | "createdAt" | "updatedAt">): Promise<string> {
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

export async function updateService(serviceId: string, updates: Partial<Service>): Promise<void> {
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

// Soft delete service (set active=false, deleted=true)
export async function deleteService(serviceId: string): Promise<void> {
  try {
    const serviceRef = doc(db, "services", serviceId)
    const serviceDoc = await getDoc(serviceRef)

    if (!serviceDoc.exists()) {
      throw new Error("Service not found")
    }

    const serviceData = serviceDoc.data() as Service

    // Soft delete: set active=false and deleted=true
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

    // Verify ownership
    if (serviceData.userId !== userId) {
      throw new Error("Unauthorized: You can only delete your own services")
    }

    // Delete service images from storage
    if (serviceData.images && serviceData.images.length > 0) {
      await deleteServiceImage(serviceData.images)
    }

    // Delete service document
    await deleteDoc(serviceRef)

    // Decrement user's service count
    const userRef = doc(db, "iboard_users", userId)
    const userDoc = await getDoc(userRef)
    const userData = userDoc.data()
    const currentCount = userData?.service_count || 0
    await updateDoc(userRef, {
      service_count: currentCount - 1, // Ensure it doesn't go below 0
      updated_at: serverTimestamp(),
    })
  } catch (error) {
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
  filters: ServiceFilter = {},
  pageSize = 20,
  lastDoc?: QueryDocumentSnapshot,
): Promise<ServicesResponse> {
  try {
    let q = query(collection(db, "services"))

    // Only get active, non-deleted services by default
    q = query(q, where("active", "==", true), where("deleted", "==", false))

    // Apply filters
    if (filters.category) {
      q = query(q, where("category", "==", filters.category))
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
          service.name.toLowerCase().includes(searchTerm) ||
          service.description.toLowerCase().includes(searchTerm) ||
          service.tags.some((tag) => tag.toLowerCase().includes(searchTerm)),
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
      collection(db, "services"),
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

export async function deleteServiceImage(imageUrls: string[]): Promise<void> {
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

export async function getServiceCategories(): Promise<string[]> {
  try {
    const q = query(collection(db, "services"), where("active", "==", true), where("deleted", "==", false))
    const querySnapshot = await getDocs(q)

    const categories = new Set<string>()
    querySnapshot.docs.forEach((doc) => {
      const service = doc.data() as Service
      if (service.category) {
        categories.add(service.category)
      }
    })

    return Array.from(categories).sort()
  } catch (error) {
    console.error("Error getting service categories:", error)
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
      const serviceRef = doc(db, "services", id)
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
    const allImages = services.filter((service) => service !== null).flatMap((service) => service!.images || [])

    if (allImages.length > 0) {
      await deleteServiceImage(allImages)
    }

    // Soft delete service documents
    serviceIds.forEach((id) => {
      const serviceRef = doc(db, "services", id)
      batch.update(serviceRef, {
        active: false,
        deleted: true,
        updatedAt: serverTimestamp(),
      })
    })

    await batch.commit()

    // Decrease user's service count by the number of deleted services
    const userRef = doc(db, "iboard_users", userId)
    const userDoc = await getDoc(userRef)
    const userData = userDoc.data()
    const currentCount = userData?.service_count || 0
    await updateDoc(userRef, {
      service_count: currentCount - serviceIds.length,
      updated_at: serverTimestamp(),
    })

    console.log("Bulk delete completed for", serviceIds.length, "services")
    console.log(`User service count decremented by ${serviceIds.length}`)
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
  archivedServices: number
}> {
  try {
    // Get all user services (including deleted for total count)
    const allServicesQuery = query(collection(db, "services"), where("userId", "==", userId))
    const allServicesSnapshot = await getDocs(allServicesQuery)

    // Get active services only
    const activeServicesQuery = query(
      collection(db, "services"),
      where("userId", "==", userId),
      where("active", "==", true),
      where("deleted", "==", false),
    )
    const activeServicesSnapshot = await getDocs(activeServicesQuery)

    let activeServices = 0
    let draftServices = 0
    let archivedServices = 0

    activeServicesSnapshot.docs.forEach((doc) => {
      const service = doc.data() as Service
      switch (service.status) {
        case "active":
          activeServices++
          break
        case "draft":
          draftServices++
          break
        case "archived":
          archivedServices++
          break
      }
    })

    return {
      totalServices: allServicesSnapshot.size,
      activeServices,
      draftServices,
      archivedServices,
    }
  } catch (error) {
    console.error("Error getting user service stats:", error)
    throw error
  }
}

export const serviceService = {
  async addService(formData: ServiceFormData, userId: string): Promise<Service> {
    const auth = getAuth()
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error("User not authenticated.")
    }

    const newServiceRef = doc(servicesCollection)
    const batch = writeBatch(db)

    const mediaUrls: Array<{ distance: string; isVideo: boolean; type: string; url: string }> = []

    // Upload service images
    for (const file of formData.service_images) {
      const optimizedFile = await optimizeImage(file)
      const imageRef = ref(storage, `service_media/${userId}/${newServiceRef.id}/${optimizedFile.name}`)
      await uploadBytes(imageRef, optimizedFile)
      const url = await getDownloadURL(imageRef)
      mediaUrls.push({ distance: "0", isVideo: false, type: "image", url }) // Default distance for now
    }

    // Upload service video
    if (formData.service_video) {
      const videoRef = ref(storage, `service_media/${userId}/${newServiceRef.id}/${formData.service_video.name}`)
      await uploadBytes(videoRef, formData.service_video)
      const url = await getDownloadURL(videoRef)
      mediaUrls.push({ distance: "0", isVideo: true, type: "video", url }) // Default distance for now
    }

    // Upload variation images
    const variationsWithMedia = await Promise.all(
      formData.variations.map(async (variation) => {
        if (variation.images && variation.images.length > 0) {
          const file = variation.images[0] // Assuming one image per variation
          const optimizedFile = await optimizeImage(file)
          const imageRef = ref(
            storage,
            `service_media/${userId}/${newServiceRef.id}/variations/${variation.id}/${optimizedFile.name}`,
          )
          await uploadBytes(imageRef, optimizedFile)
          const url = await getDownloadURL(imageRef)
          return { ...variation, media: url }
        }
        return variation
      }),
    )

    const serviceData: Omit<Service, "id" | "created_at" | "updated_at"> = {
      name: formData.name,
      description: formData.description,
      categories: formData.categories,
      unit: formData.unit,
      media: mediaUrls,
      availability: formData.availability,
      is_pre_order: formData.is_pre_order,
      pre_order_days: formData.is_pre_order ? Number.parseInt(formData.pre_order_days) : 0,
      payment_methods: formData.payment_methods,
      variations: variationsWithMedia.map((v) => ({
        id: v.id,
        name: v.name,
        duration: v.duration,
        price: Number.parseFloat(v.price),
        slots: Number.parseInt(v.slots),
        media: v.media,
      })),
      user_id: userId,
      status: "active", // Default status
    }

    batch.set(newServiceRef, {
      ...serviceData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })

    await batch.commit()

    const newServiceDoc = await getDoc(newServiceRef)
    return { id: newServiceDoc.id, ...(newServiceDoc.data() as Omit<Service, "id">) }
  },

  async getService(serviceId: string): Promise<Service | null> {
    const serviceDoc = await getDoc(doc(servicesCollection, serviceId))
    if (serviceDoc.exists()) {
      return { id: serviceDoc.id, ...(serviceDoc.data() as Omit<Service, "id">) }
    }
    return null
  },

  async updateService(serviceId: string, formData: ServiceFormData, userId: string): Promise<void> {
    const auth = getAuth()
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error("User not authenticated.")
    }

    const serviceRef = doc(servicesCollection, serviceId)
    const batch = writeBatch(db)

    const existingService = await this.getService(serviceId)
    if (!existingService) {
      throw new Error("Service not found.")
    }

    const mediaUrls: Array<{ distance: string; isVideo: boolean; type: string; url: string }> = []
    const filesToUpload: { file: File; isVideo: boolean; variationId?: string }[] = []
    const urlsToDelete: string[] = []

    // Handle main service media
    const newServiceImageFiles = formData.service_images.filter((file) => file instanceof File)
    const existingServiceMedia = formData.media.filter((item) => typeof item.url === "string")

    // Determine which existing media to keep
    const keptMediaUrls = new Set(existingServiceMedia.map((m) => m.url))
    for (const existingItem of existingService.media) {
      if (!keptMediaUrls.has(existingItem.url)) {
        urlsToDelete.push(existingItem.url)
      }
    }

    // Add new files to upload
    for (const file of newServiceImageFiles) {
      filesToUpload.push({ file, isVideo: false })
    }
    if (formData.service_video && formData.service_video instanceof File) {
      filesToUpload.push({ file: formData.service_video, isVideo: true })
    }

    // Process variation media
    const variationsWithUpdatedMedia = await Promise.all(
      formData.variations.map(async (variation) => {
        const existingVariation = existingService.variations.find((v) => v.id === variation.id)
        let updatedMediaUrl = variation.media

        if (variation.images && variation.images.length > 0 && variation.images[0] instanceof File) {
          // New image uploaded for variation
          if (existingVariation?.media) {
            urlsToDelete.push(existingVariation.media) // Delete old image
          }
          const file = variation.images[0]
          const optimizedFile = await optimizeImage(file)
          const imageRef = ref(
            storage,
            `service_media/${userId}/${serviceId}/variations/${variation.id}/${optimizedFile.name}`,
          )
          await uploadBytes(imageRef, optimizedFile)
          updatedMediaUrl = await getDownloadURL(imageRef)
        } else if (existingVariation?.media && !variation.media) {
          // Existing image removed
          urlsToDelete.push(existingVariation.media)
          updatedMediaUrl = null
        }
        return { ...variation, media: updatedMediaUrl }
      }),
    )

    // Perform deletions
    for (const url of urlsToDelete) {
      try {
        const fileRef = ref(storage, url)
        await deleteObject(fileRef)
      } catch (error) {
        console.warn(`Failed to delete old media file: ${url}`, error)
      }
    }

    // Perform uploads and collect new media URLs
    for (const { file, isVideo } of filesToUpload) {
      const optimizedFile = isVideo ? file : await optimizeImage(file)
      const mediaPath = isVideo ? "service_videos" : "service_images"
      const mediaRef = ref(storage, `service_media/${userId}/${serviceId}/${mediaPath}/${optimizedFile.name}`)
      await uploadBytes(mediaRef, optimizedFile)
      const url = await getDownloadURL(mediaRef)
      mediaUrls.push({ distance: "0", isVideo, type: isVideo ? "video" : "image", url })
    }

    const updatedServiceData: Partial<Omit<Service, "id" | "created_at">> = {
      name: formData.name,
      description: formData.description,
      categories: formData.categories,
      unit: formData.unit,
      media: [...existingServiceMedia, ...mediaUrls], // Combine existing kept media with newly uploaded
      availability: formData.availability,
      is_pre_order: formData.is_pre_order,
      pre_order_days: formData.is_pre_order ? Number.parseInt(formData.pre_order_days) : 0,
      payment_methods: formData.payment_methods,
      variations: variationsWithUpdatedMedia.map((v) => ({
        id: v.id,
        name: v.name,
        duration: v.duration,
        price: Number.parseFloat(v.price),
        slots: Number.parseInt(v.slots),
        media: v.media,
      })),
      updated_at: serverTimestamp(),
    }

    batch.update(serviceRef, updatedServiceData)
    await batch.commit()
  },

  async deleteService(serviceId: string, userId: string): Promise<void> {
    const auth = getAuth()
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error("User not authenticated.")
    }

    const serviceRef = doc(servicesCollection, serviceId)
    const serviceDoc = await getDoc(serviceRef)

    if (serviceDoc.exists() && serviceDoc.data().user_id === userId) {
      const serviceData = serviceDoc.data() as Service

      // Delete associated media files from storage
      const mediaToDelete = [...serviceData.media]
      serviceData.variations.forEach((v) => {
        if (v.media) mediaToDelete.push({ url: v.media, isVideo: false, type: "image", distance: "0" })
      })

      for (const mediaItem of mediaToDelete) {
        try {
          const fileRef = ref(storage, mediaItem.url)
          await deleteObject(fileRef)
        } catch (error) {
          console.warn(`Failed to delete media file: ${mediaItem.url}`, error)
        }
      }

      await deleteDoc(serviceRef)
    } else {
      throw new Error("Service not found or unauthorized to delete.")
    }
  },

  async getServicesByUserId(userId: string): Promise<Service[]> {
    const q = query(servicesCollection, where("user_id", "==", userId))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Service, "id">),
    }))
  },
}
