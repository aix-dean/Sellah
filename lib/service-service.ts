import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  getDoc,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { db, storage } from "./firebase"
import type { Service } from "@/types/service"

export class ServiceService {
  private static collection = "products" // Using same collection as products

  static async createService(
    serviceData: Omit<Service, "id" | "createdAt" | "updatedAt">,
    imageFile?: File,
  ): Promise<string> {
    try {
      let imageUrl = ""

      if (imageFile) {
        imageUrl = await this.uploadImage(imageFile, serviceData.userId)
      }

      const docRef = await addDoc(collection(db, this.collection), {
        ...serviceData,
        imageUrl,
        type: "SERVICE",
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      return docRef.id
    } catch (error) {
      console.error("Error creating service:", error)
      throw error
    }
  }

  static async updateService(serviceId: string, updates: Partial<Service>, imageFile?: File): Promise<void> {
    try {
      let imageUrl = updates.imageUrl

      if (imageFile) {
        // Delete old image if exists
        if (updates.imageUrl) {
          await this.deleteImage(updates.imageUrl)
        }
        imageUrl = await this.uploadImage(imageFile, updates.userId!)
      }

      const docRef = doc(db, this.collection, serviceId)
      await updateDoc(docRef, {
        ...updates,
        imageUrl,
        updatedAt: new Date(),
      })
    } catch (error) {
      console.error("Error updating service:", error)
      throw error
    }
  }

  static async deleteService(serviceId: string): Promise<void> {
    try {
      // Get service data to delete image
      const serviceDoc = await getDoc(doc(db, this.collection, serviceId))
      const serviceData = serviceDoc.data()

      if (serviceData?.imageUrl) {
        await this.deleteImage(serviceData.imageUrl)
      }

      await deleteDoc(doc(db, this.collection, serviceId))
    } catch (error) {
      console.error("Error deleting service:", error)
      throw error
    }
  }

  static async getServicesByUser(userId: string): Promise<Service[]> {
    try {
      const q = query(
        collection(db, this.collection),
        where("userId", "==", userId),
        where("type", "==", "SERVICE"),
        orderBy("createdAt", "desc"),
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Service,
      )
    } catch (error) {
      console.error("Error getting services:", error)
      throw error
    }
  }

  static async getService(serviceId: string): Promise<Service | null> {
    try {
      const docRef = doc(db, this.collection, serviceId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as Service
      }

      return null
    } catch (error) {
      console.error("Error getting service:", error)
      throw error
    }
  }

  private static async uploadImage(file: File, userId: string): Promise<string> {
    const storageRef = ref(storage, `services/${userId}/${Date.now()}_${file.name}`)
    const snapshot = await uploadBytes(storageRef, file)
    return await getDownloadURL(snapshot.ref)
  }

  private static async deleteImage(imageUrl: string): Promise<void> {
    try {
      const imageRef = ref(storage, imageUrl)
      await deleteObject(imageRef)
    } catch (error) {
      console.error("Error deleting image:", error)
      // Don't throw error for image deletion failures
    }
  }
}
