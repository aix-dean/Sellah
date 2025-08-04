import { db, storage } from "@/lib/firebase"
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  serverTimestamp,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import type { Service } from "@/types/service"
import { toast } from "@/components/ui/use-toast"

const SERVICES_COLLECTION = "services"
const SERVICE_IMAGES_FOLDER = "service_images"

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

export async function getService(serviceId: string): Promise<Service | null> {
  try {
    const docRef = doc(db, SERVICES_COLLECTION, serviceId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Service
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting service:", error)
    throw new Error("Failed to retrieve service.")
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

export async function updateService(serviceId: string, serviceData: Partial<Service>): Promise<void> {
  try {
    const docRef = doc(db, SERVICES_COLLECTION, serviceId)
    await updateDoc(docRef, {
      ...serviceData,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating service:", error)
    throw new Error("Failed to update service.")
  }
}

export async function deleteService(serviceId: string): Promise<void> {
  try {
    const docRef = doc(db, SERVICES_COLLECTION, serviceId)
    await deleteDoc(docRef)
  } catch (error) {
    console.error("Error deleting service:", error)
    throw new Error("Failed to delete service.")
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
