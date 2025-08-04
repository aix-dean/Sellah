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
  serverTimestamp,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { db, storage } from "./firebase"
import type { Service } from "@/types/service"

export class ServiceService {
  private static collection = "products" // Using same collection as products

  static async createService(
    serviceData: Omit<Service, "id" | "createdAt" | "updatedAt" | "imageUrl">, // imageUrl is handled internally
    imageFile?: File,
  ): Promise<string> {
    try {
      let imageUrl = ""

      if (imageFile) {
        imageUrl = await this.uploadImage(imageFile, serviceData.userId)
      }

      const docRef = await addDoc(collection(db, this.collection), {
        ...serviceData,
        imageUrl, // This imageUrl is the one from the upload, or "" if no file
        type: "SERVICE",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
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
          try {
            await this.deleteImage(updates.imageUrl)
          } catch (deleteError) {
            console.warn("Could not delete old image:", deleteError)
            // Continue with upload even if old image deletion fails
          }
        }
        imageUrl = await this.uploadImage(imageFile, updates.userId!)
      } else if (updates.imageUrl === null) {
        // If imageUrl is explicitly set to null, delete the image
        const serviceDoc = await getDoc(doc(db, this.collection, serviceId))
        const currentImageUrl = serviceDoc.data()?.imageUrl
        if (currentImageUrl) {
          try {
            await this.deleteImage(currentImageUrl)
          } catch (deleteError) {
            console.warn("Could not delete old image when setting to null:", deleteError)
          }
        }
      }

      const docRef = doc(db, this.collection, serviceId)
      await updateDoc(docRef, {
        ...updates,
        imageUrl, // This will be the new URL, or null if removed
        updatedAt: serverTimestamp(),
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
    try {
      const storageRef = ref(storage, `services/${userId}/${Date.now()}_${file.name}`)
      const snapshot = await uploadBytes(storageRef, file)
      return await getDownloadURL(snapshot.ref)
    } catch (error) {
      console.error("Error uploading image to Firebase Storage:", error)
      throw new Error("Failed to upload image.")
    }
  }

  private static async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Firebase Storage URLs can be complex. Extract path from URL.
      // Example: https://firebasestorage.googleapis.com/v0/b/YOUR_PROJECT_ID.appspot.com/o/images%2Fuser123%2Fimage.jpg?alt=media...
      const url = new URL(imageUrl)
      const path = decodeURIComponent(url.pathname.split("/o/")[1].split("?")[0])
      const imageRef = ref(storage, path)
      await deleteObject(imageRef)
    } catch (error) {
      console.error("Error deleting image from Firebase Storage:", error)
      // Don't re-throw, as it might be an old or invalid URL, and we want the main operation to proceed.
    }
  }
}
