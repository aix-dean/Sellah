// Preview-compatible Firebase configuration and utilities
import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Check if we're in preview environment
const isPreviewEnvironment = typeof window !== "undefined" && window.location.hostname.includes("v0.dev")

// Fallback Firebase config for preview environment
const previewFirebaseConfig = {
  apiKey: "AIzaSyBByUHvQmjYdalF2C1UIpzn-onB3iXGMhc",
  authDomain: "oh-app-bcf24.firebaseapp.com",
  projectId: "oh-app-bcf24",
  storageBucket: "oh-app-bcf24.appspot.com",
  messagingSenderId: "272363630855",
  appId: "1:272363630855:web:820601c723e85625d915a2",
}

// Get Firebase config with fallbacks for preview
export function getPreviewCompatibleFirebaseConfig() {
  if (isPreviewEnvironment) {
    return previewFirebaseConfig
  }

  // Try to get from environment variables
  try {
    return {
      apiKey: process.env.NEXT_PUBLIC_API_KEY || previewFirebaseConfig.apiKey,
      authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN || previewFirebaseConfig.authDomain,
      projectId: process.env.NEXT_PUBLIC_PROJECT_ID || previewFirebaseConfig.projectId,
      storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET || previewFirebaseConfig.storageBucket,
      messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID || previewFirebaseConfig.messagingSenderId,
      appId: process.env.NEXT_PUBLIC_APP_ID || previewFirebaseConfig.appId,
    }
  } catch (error) {
    console.warn("Failed to load environment variables, using fallback config:", error)
    return previewFirebaseConfig
  }
}

// Initialize Firebase with preview compatibility
let previewApp: any = null
let previewAuth: any = null
let previewDb: any = null
let previewStorage: any = null

export function initializePreviewCompatibleFirebase() {
  try {
    const config = getPreviewCompatibleFirebaseConfig()

    // Initialize Firebase only if it hasn't been initialized already
    if (!previewApp) {
      previewApp = !getApps().length ? initializeApp(config) : getApp()
    }

    // Initialize Firebase Auth
    if (!previewAuth) {
      previewAuth = getAuth(previewApp)

      // Set tenant ID if available
      if (typeof window !== "undefined") {
        previewAuth.tenantId = process.env.NEXT_PUBLIC_TENANT_ID || "sellah-zgqvh"
      }
    }

    // Initialize Firestore
    if (!previewDb) {
      previewDb = getFirestore(previewApp)
    }

    // Initialize Storage
    if (!previewStorage) {
      previewStorage = getStorage(previewApp)
    }

    return {
      app: previewApp,
      auth: previewAuth,
      db: previewDb,
      storage: previewStorage,
    }
  } catch (error) {
    console.error("Failed to initialize Firebase for preview:", error)
    throw error
  }
}

// Export preview-compatible Firebase instances
export const getPreviewFirebase = () => {
  try {
    return initializePreviewCompatibleFirebase()
  } catch (error) {
    console.error("Error getting preview Firebase:", error)
    // Return null objects to prevent crashes
    return {
      app: null,
      auth: null,
      db: null,
      storage: null,
    }
  }
}
