import { db, storage } from "@/lib/firebase"
import { collection, addDoc, doc, updateDoc, getDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import type { CreateServiceData, Service } from "@/types/service"
import { toast } from "@/components/ui/use-toast"

export const ServiceService = {
  async createService(serviceData: CreateServiceData, imageFiles: File[]): Promise<Service | null> {
    try {
      const imageUrls: string[] = []
      for (const file of imageFiles) {
        const url = await ServiceService.uploadServiceImage(file)
        if (url) {
          imageUrls.push(url)
        }
      }

      const docRef = await addDoc(collection(db, "products"), {
        ...serviceData,
        imageUrls: imageUrls, // Save all uploaded image URLs
        type: "SERVICES", // Ensure type is SERVICES
        createdAt: new Date(),
        active: true,
        deleted: false,
        views: 0,
        likes: 0,
        bookings: 0,
        status: "published",
      })

      const newService: Service = {
        id: docRef.id,
        ...serviceData,
        imageUrls: imageUrls,
        type: "SERVICES",
        createdAt: new Date(),
        active: true,
        deleted: false,
        views: 0,
        likes: 0,
        bookings: 0,
        status: "published",
      }
      toast({
        title: "Service created successfully!",
        description: newService.name,
      })
      return newService
    } catch (error) {
      console.error("Error creating service:", error)
      toast({
        title: "Failed to create service",
        description: (error as Error).message,
        variant: "destructive",
      })
      return null
    }
  },

  async getServiceById(id: string): Promise<Service | null> {
    try {
      const docRef = doc(db, "products", id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists() && docSnap.data().type === "SERVICES") {
        return { id: docSnap.id, ...docSnap.data() } as Service
      } else {
        return null
      }
    } catch (error) {
      console.error("Error getting service by ID:", error)
      return null
    }
  },

  async updateService(
    id: string,
    serviceData: Partial<CreateServiceData>,
    newImageFiles: File[],
    existingImageUrls: string[],
  ): Promise<Service | null> {
    try {
      const serviceRef = doc(db, "products", id)
      const currentServiceSnap = await getDoc(serviceRef)
      if (!currentServiceSnap.exists()) {
        throw new Error("Service not found.")
      }
      const currentService = currentServiceSnap.data() as Service

      // Upload new images
      const uploadedNewImageUrls: string[] = []
      for (const file of newImageFiles) {
        const url = await ServiceService.uploadServiceImage(file)
        if (url) {
          uploadedNewImageUrls.push(url)
        }
      }

      // Combine existing and newly uploaded image URLs
      const finalImageUrls = [...existingImageUrls, ...uploadedNewImageUrls]

      await updateDoc(serviceRef, {
        ...serviceData,
        imageUrls: finalImageUrls,
        updatedAt: new Date(),
      })

      const updatedService: Service = {
        ...currentService,
        ...serviceData,
        imageUrls: finalImageUrls,
        id: id,
      }
      toast({
        title: "Service updated successfully!",
        description: updatedService.name,
      })
      return updatedService
    } catch (error) {
      console.error("Error updating service:", error)
      toast({
        title: "Failed to update service",
        description: (error as Error).message,
        variant: "destructive",
      })
      return null
    }
  },

  async deleteService(id: string): Promise<boolean> {
    try {
      const serviceRef = doc(db, "products", id)
      const serviceSnap = await getDoc(serviceRef)
      if (serviceSnap.exists()) {
        const serviceData = serviceSnap.data() as Service
        // Mark as deleted instead of actual deletion
        await updateDoc(serviceRef, {
          deleted: true,
          active: false,
          updatedAt: new Date(),
        })

        // Optionally delete images from storage if truly deleting
        // For now, we'll keep them as the document is only marked deleted
        // await ServiceService.deleteServiceImages(serviceData.imageUrls);

        toast({
          title: "Service deleted successfully!",
          description: serviceData.name,
        })
        return true
      }
      return false
    } catch (error) {
      console.error("Error deleting service:", error)
      toast({
        title: "Failed to delete service",
        description: (error as Error).message,
        variant: "destructive",
      })
      return false
    }
  },

  async uploadServiceImage(file: File): Promise<string | null> {
    try {
      const storageRef = ref(storage, `service_images/${file.name}_${Date.now()}`)
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      return downloadURL
    } catch (error) {
      console.error("Error uploading service image:", error)
      toast({
        title: "Failed to upload image",
        description: (error as Error).message,
        variant: "destructive",
      })
      return null
    }
  },

  async deleteServiceImage(imageUrl: string): Promise<boolean> {
    try {
      const imageRef = ref(storage, imageUrl)
      await deleteObject(imageRef)
      return true
    } catch (error) {
      console.error("Error deleting service image:", error)
      toast({
        title: "Failed to delete image",
        description: (error as Error).message,
        variant: "destructive",
      })
      return false
    }
  },

  async deleteServiceImages(imageUrls: string[]): Promise<void> {
    const deletePromises = imageUrls.map((url) => ServiceService.deleteServiceImage(url))
    await Promise.all(deletePromises)
  },

  async bulkDeleteServices(serviceIds: string[]): Promise<boolean> {
    try {
      const deletePromises = serviceIds.map(async (id) => {
        const serviceRef = doc(db, "products", id)
        const serviceSnap = await getDoc(serviceRef)
        if (serviceSnap.exists()) {
          const serviceData = serviceSnap.data() as Service
          // Mark as deleted
          await updateDoc(serviceRef, {
            deleted: true,
            active: false,
            updatedAt: new Date(),
          })
          // Optionally delete images from storage
          // await ServiceService.deleteServiceImages(serviceData.imageUrls);
        }
      })
      await Promise.all(deletePromises)
      toast({
        title: "Services deleted successfully!",
        description: `${serviceIds.length} services marked as deleted.`,
      })
      return true
    } catch (error) {
      console.error("Error bulk deleting services:", error)
      toast({
        title: "Failed to bulk delete services",
        description: (error as Error).message,
        variant: "destructive",
      })
      return false
    }
  },
}
