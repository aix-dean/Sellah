import { db, storage } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import type { Service, CreateServiceData } from "@/types/service";

const SERVICES_COLLECTION = "services";

export const ServiceService = {
  /**
   * Creates a new service in Firestore.
   * @param serviceData The service data to create.
   * @param imageFiles An array of image files to upload.
   * @returns The ID of the newly created service.
   */
  async createService(
    serviceData: CreateServiceData,
    imageFiles: File[],
  ): Promise<string> {
    try {
      const imageUrls: string[] = [];
      for (const file of imageFiles) {
        const storageRef = ref(
          storage,
          `service_images/${serviceData.seller_id}/${Date.now()}_${file.name}`,
        );
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
      }

      const docRef = await addDoc(collection(db, SERVICES_COLLECTION), {
        ...serviceData,
        imageUrls,
        type: "SERVICES",
        active: true,
        deleted: false,
        views: 0,
        bookings: 0,
        rating: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating service:", error);
      throw new Error("Failed to create service.");
    }
  },

  /**
   * Fetches a single service by its ID.
   * @param serviceId The ID of the service to fetch.
   * @returns The service data or null if not found.
   */
  async getServiceById(serviceId: string): Promise<Service | null> {
    try {
      const docRef = doc(db, SERVICES_COLLECTION, serviceId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name,
          description: data.description,
          category: data.category,
          price: data.price,
          duration: data.duration,
          imageUrls: data.imageUrls || [],
          seller_id: data.seller_id,
          type: data.type || "SERVICES",
          active: data.active || true,
          deleted: data.deleted || false,
          views: data.views || 0,
          bookings: data.bookings || 0,
          rating: data.rating || 0,
          availability: data.availability,
          scope: data.scope,
          regions: data.regions || [],
          schedule: data.schedule || {},
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error fetching service by ID:", error);
      throw new Error("Failed to fetch service.");
    }
  },

  /**
   * Updates an existing service in Firestore.
   * @param serviceId The ID of the service to update.
   * @param serviceData The updated service data.
   * @param newImageFiles New image files to upload.
   * @param existingImageUrls URLs of images that should be kept.
   */
  async updateService(
    serviceId: string,
    serviceData: Partial<CreateServiceData>,
    newImageFiles: File[],
    existingImageUrls: string[],
  ): Promise<void> {
    try {
      const serviceRef = doc(db, SERVICES_COLLECTION, serviceId);
      const currentServiceSnap = await getDoc(serviceRef);

      if (!currentServiceSnap.exists()) {
        throw new Error("Service not found.");
      }

      const currentData = currentServiceSnap.data();
      const currentImageUrls: string[] = currentData.imageUrls || [];
      const imagesToDelete = currentImageUrls.filter(
        (url) => !existingImageUrls.includes(url),
      );

      // Delete removed images from storage
      for (const url of imagesToDelete) {
        const imageRef = ref(storage, url);
        try {
          await deleteObject(imageRef);
        } catch (deleteError) {
          console.warn(`Failed to delete old image: ${url}`, deleteError);
          // Continue even if an image deletion fails
        }
      }

      // Upload new images
      const uploadedNewImageUrls: string[] = [];
      for (const file of newImageFiles) {
        const storageRef = ref(
          storage,
          `service_images/${currentData.seller_id}/${Date.now()}_${file.name}`,
        );
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        uploadedNewImageUrls.push(url);
      }

      const finalImageUrls = [...existingImageUrls, ...uploadedNewImageUrls];

      await updateDoc(serviceRef, {
        ...serviceData,
        imageUrls: finalImageUrls,
        updated_at: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating service:", error);
      throw new Error("Failed to update service.");
    }
  },

  /**
   * Deletes a service and its associated images from Firestore and Storage.
   * @param serviceId The ID of the service to delete.
   */
  async deleteService(serviceId: string): Promise<void> {
    try {
      const serviceRef = doc(db, SERVICES_COLLECTION, serviceId);
      const serviceSnap = await getDoc(serviceRef);

      if (serviceSnap.exists()) {
        const imageUrls: string[] = serviceSnap.data().imageUrls || [];

        // Delete images from storage
        for (const url of imageUrls) {
          const imageRef = ref(storage, url);
          try {
            await deleteObject(imageRef);
          } catch (deleteError) {
            console.warn(`Failed to delete image: ${url}`, deleteError);
          }
        }

        // Delete service document from Firestore
        await deleteDoc(serviceRef);
      } else {
        throw new Error("Service not found.");
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      throw new Error("Failed to delete service.");
    }
  },

  /**
   * Fetches all services for a given user.
   * @param userId The ID of the user whose services to fetch.
   * @returns An array of services.
   */
  async getServicesByUserId(userId: string): Promise<Service[]> {
    try {
      const q = query(
        collection(db, SERVICES_COLLECTION),
        where("seller_id", "==", userId),
      );
      const querySnapshot = await getDocs(q);
      const services: Service[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        services.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          category: data.category,
          price: data.price,
          duration: data.duration,
          imageUrls: data.imageUrls || [],
          seller_id: data.seller_id,
          type: data.type || "SERVICES",
          active: data.active || true,
          deleted: data.deleted || false,
          views: data.views || 0,
          bookings: data.bookings || 0,
          rating: data.rating || 0,
          availability: data.availability,
          scope: data.scope,
          regions: data.regions || [],
          schedule: data.schedule || {},
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
      });
      return services;
    } catch (error) {
      console.error("Error fetching services by user ID:", error);
      throw new Error("Failed to fetch services.");
    }
  },

  // Alias for getServiceById for compatibility
  async getService(serviceId: string): Promise<Service | null> {
    return this.getServiceById(serviceId);
  }
};
