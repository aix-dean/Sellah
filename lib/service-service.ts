import { db, storage } from "@/lib/firebase"
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  writeBatch,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
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

export const ServiceService = {
  // Upload a single service image
  async uploadServiceImage(file: File, userId: string, serviceId?: string): Promise<string> {
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
  },

  // Upload multiple service images
  async uploadServiceImages(files: File[], userId: string, serviceId?: string): Promise<string[]> {
    try {
      const uploadPromises = files.map((file) => this.uploadServiceImage(file, userId, serviceId))
      const imageUrls = await Promise.all(uploadPromises)
      return imageUrls
    } catch (error) {
      console.error("Error uploading service images:", error)
      throw error
    }
  },

  // Delete service images from storage
  async deleteServiceImages(imageUrls: string[]): Promise<void> {
    try {
      const deletePromises = imageUrls.map(async (url) => {
        try {
          // Extract path from Firebase Storage URL
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
  },

  // Create a new service
  async createService(serviceData: Omit<CreateServiceData, "imageUrls">, imageFiles: File[] = []): Promise<string> {
    try {
      // Upload images first
      const imageUrls = imageFiles.length > 0 ? await this.uploadServiceImages(imageFiles, serviceData.seller_id) : []

      const service: Omit<Service, "id"> = {
        ...serviceData,
        imageUrls,
        type: "SERVICES",
        active: true,
        deleted: false,
        views: 0,
        bookings: 0,
        rating: 5,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, "products"), service)
      console.log("Service created successfully:", docRef.id)
      return docRef.id
    } catch (error) {
      console.error("Error creating service:", error)
      throw error
    }
  },

  // Update an existing service
  async updateService(
    serviceId: string,
    updates: Partial<Service>,
    newImageFiles: File[] = [],
    existingImageUrls: string[] = [],
  ): Promise<void> {
    try {
      const serviceRef = doc(db, "products", serviceId)

      // Upload new images if any
      const newImageUrls =
        newImageFiles.length > 0
          ? await this.uploadServiceImages(newImageFiles, updates.seller_id || "", serviceId)
          : []

      // Combine existing and new image URLs
      const allImageUrls = [...existingImageUrls, ...newImageUrls]

      const updateData = {
        ...updates,
        imageUrls: allImageUrls,
        updated_at: serverTimestamp(),
      }

      await updateDoc(serviceRef, updateData)
      console.log("Service updated successfully:", serviceId)
    } catch (error) {
      console.error("Error updating service:", error)
      throw error
    }
  },

  // Soft delete service
  async deleteService(serviceId: string, userId: string): Promise<void> {
    try {
      const serviceRef = doc(db, "products", serviceId)
      const serviceDoc = await getDoc(serviceRef)

      if (!serviceDoc.exists()) {
        throw new Error("Service not found")
      }

      const serviceData = serviceDoc.data() as Service

      // Verify ownership
      if (serviceData.seller_id !== userId) {
        throw new Error("Unauthorized: You can only delete your own services")
      }

      // Soft delete: set active=false and deleted=true
      await updateDoc(serviceRef, {
        active: false,
        deleted: true,
        updated_at: serverTimestamp(),
      })

      console.log("Service soft deleted successfully:", serviceId)
    } catch (error) {
      console.error("Error deleting service:", error)
      throw error
    }
  },

  // Get a single service
  async getService(serviceId: string): Promise<Service | null> {
    try {
      const serviceDoc = await getDoc(doc(db, "products", serviceId))

      if (serviceDoc.exists()) {
        const data = serviceDoc.data()
        if (data.type === "SERVICES") {
          return {
            id: serviceDoc.id,
            ...data,
          } as Service
        }
      }

      return null
    } catch (error) {
      console.error("Error getting service:", error)
      throw error
    }
  },

  // Get services with filters
  async getServices(
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

      // Apply client-side filters
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
  },

  // Get user services
  async getUserServices(
    userId: string,
    filters: ServiceFilter = {},
    pageSize = 20,
    lastDoc?: QueryDocumentSnapshot,
  ): Promise<ServicesResponse> {
    try {
      let q = query(
        collection(db, "products"),
        where("seller_id", "==", userId),
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
  },

  // Bulk delete services
  async bulkDeleteServices(serviceIds: string[], userId: string): Promise<void> {
    try {
      const batch = writeBatch(db)

      // Get all services to delete their images
      const services = await Promise.all(serviceIds.map((id) => this.getService(id)))

      // Delete images
      const allImages = services.filter((service) => service !== null).flatMap((service) => service!.imageUrls || [])

      if (allImages.length > 0) {
        await this.deleteServiceImages(allImages)
      }

      // Soft delete service documents
      serviceIds.forEach((id) => {
        const serviceRef = doc(db, "products", id)
        batch.update(serviceRef, {
          active: false,
          deleted: true,
          updated_at: serverTimestamp(),
        })
      })

      await batch.commit()
      console.log("Bulk delete completed for", serviceIds.length, "services")
    } catch (error) {
      console.error("Error bulk deleting services:", error)
      throw error
    }
  },
}
