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
import type { Service, ServiceFormData } from "@/types/service";

const SERVICES_COLLECTION = "services";

export default const serviceService = {
  /**
   * Creates a new service in Firestore.
   * @param userId The ID of the user creating the service.
   * @param serviceData The service data to create.
   * @param imageFiles An array of image files to upload.
   * @returns The ID of the newly created service.
   */
  async createService(
    userId: string,
    serviceData: ServiceFormData,
    imageFiles: File[],
  ): Promise<string> {
    try {
      const imageUrls: string[] = [];
      for (const file of imageFiles) {
        const storageRef = ref(
          storage,
          `service_images/${userId}/${Date.now()}_${file.name}`,
        );
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
      }

      const docRef = await addDoc(collection(db, SERVICES_COLLECTION), {
        ...serviceData,
        userId,
        imageUrls,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
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
          userId: data.userId,
          name: data.name,
          description: data.description,
          category: data.category,
          price: data.price,
          duration: data.duration,
          availability: data.availability,
          scope: data.scope,
          regions: data.regions || [],
          imageUrls: data.imageUrls || [],
          createdAt: data.createdAt?.toDate().toISOString() || "",
          updatedAt: data.updatedAt?.toDate().toISOString() || "",
          schedule: data.schedule || {},
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
   * @param existingImageUrls URLs of images that should be kept.
   * @param newImageFiles New image files to upload.
   */
  async updateService(
    serviceId: string,
    serviceData: Partial<ServiceFormData>,
    existingImageUrls: string[],
    newImageFiles: File[],
  ): Promise<void> {
    try {
      const serviceRef = doc(db, SERVICES_COLLECTION, serviceId);
      const currentServiceSnap = await getDoc(serviceRef);

      if (!currentServiceSnap.exists()) {
        throw new Error("Service not found.");
      }

      const currentImageUrls: string[] = currentServiceSnap.data().imageUrls || [];
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
          `service_images/${currentServiceSnap.data().userId}/${Date.now()}_${file.name}`,
        );
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        uploadedNewImageUrls.push(url);
      }

      const finalImageUrls = [...existingImageUrls, ...uploadedNewImageUrls];

      console.log("Data being sent to Firestore for update:", {
        ...serviceData,
        imageUrls: finalImageUrls,
        updatedAt: serverTimestamp(),
      }); // Debug log

      await updateDoc(serviceRef, {
        ...serviceData,
        imageUrls: finalImageUrls,
        updatedAt: serverTimestamp(),
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
        where("userId", "==", userId),
      );
      const querySnapshot = await getDocs(q);
      const services: Service[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        services.push({
          id: doc.id,
          userId: data.userId,
          name: data.name,
          description: data.description,
          category: data.category,
          price: data.price,
          duration: data.duration,
          availability: data.availability,
          scope: data.scope,
          regions: data.regions || [],
          imageUrls: data.imageUrls || [],
          createdAt: data.createdAt?.toDate().toISOString() || "",
          updatedAt: data.updatedAt?.toDate().toISOString() || "",
          schedule: data.schedule || {},
        });
      });
      return services;
    } catch (error) {
      console.error("Error fetching services by user ID:", error);
      throw new Error("Failed to fetch services.");
    }
  },
};
