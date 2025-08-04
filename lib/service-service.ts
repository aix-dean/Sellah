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
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import type { Service, ServiceFormData } from "@/types/service"
import { toast } from "@/components/ui/use-toast"
import { getAuth } from "firebase/auth"
import { optimizeImage } from "@/lib/media-optimizer"

const SERVICES_COLLECTION = "services"
const SERVICE_IMAGES_FOLDER = "service_images"
const servicesCollection = collection(db, "services")

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

export async function createService(serviceData: Omit<Service, "id" | "createdAt" | "updatedAt">): Promise<Service> {
  try {
    const docRef = await addDoc(collection(db, SERVICES_COLLECTION), {
      ...serviceData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    const newService: Service = {
      id: docRef.id,
      ...(serviceData as Service), // Cast back to Service, as id and timestamps will be added
      createdAt: (await getDoc(docRef)).data()?.createdAt, // Fetch actual timestamp
      updatedAt: (await getDoc(docRef)).data()?.updatedAt, // Fetch actual timestamp
    }
    return newService
  } catch (error) {
    console.error("Error creating service:", error)
    throw new Error("Failed to create service.")
  }
}

export async function getAllServices(): Promise<Service[]> {
  try {
    const q = query(collection(db, SERVICES_COLLECTION))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Service[]
  } catch (error) {
    console.error("Error getting all services:", error)
    throw new Error("Failed to retrieve services.")
  }
}

export async function uploadServiceImage(file: File, userId: string): Promise<string> {
  try {
    const storageRef = ref(storage, `${SERVICE_IMAGES_FOLDER}/${userId}/${file.name}_${Date.now()}`)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    return downloadURL
  } catch (error) {
    console.error("Error uploading service image:", error)
    throw new Error("Failed to upload service image.")
  }
}

export async function deleteServiceImages(imageUrls: string[]): Promise<void> {
  try {
    const deletePromises = imageUrls.map((url) => {
      const imageRef = ref(storage, url)
      return deleteObject(imageRef)
    })
    await Promise.all(deletePromises)
  } catch (error) {
    console.error("Error deleting service images:", error)
    // Don't throw if some images fail to delete, just log
    toast({
      title: "Image Deletion Warning",
      description: "Some images could not be deleted from storage. Please check manually.",
      variant: "warning",
    })
  }
}
