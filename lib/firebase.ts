import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, connectAuthEmulator } from "firebase/auth"
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore"
import { getStorage, connectStorageEmulator } from "firebase/storage"

// Hardcoded Firebase config (Firebase API keys are safe to expose)
const firebaseConfig = {
  apiKey: "AIzaSyBByUHvQmjYdalF2C1UIpzn-onB3iXGMhc",
  authDomain: "oh-app-bcf24.firebaseapp.com",
  projectId: "oh-app-bcf24",
  storageBucket: "oh-app-bcf24.appspot.com",
  messagingSenderId: "272363630855",
  appId: "1:272363630855:web:820601c723e85625d915a2",
}

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

// Initialize Firebase Auth
export const auth = getAuth(app)

// Set tenant ID
if (typeof window !== "undefined") {
  auth.tenantId = "sellah-zgqvh"
}

// Initialize Firestore
export const db = getFirestore(app)

// Initialize Storage
export const storage = getStorage(app)

// Only connect to emulators in development and if not already connected
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  try {
    // Check if already connected to avoid multiple connections
    if (!auth.config.emulator) {
      connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true })
    }
    if (!db._delegate._databaseId.projectId.includes("demo-")) {
      connectFirestoreEmulator(db, "localhost", 8080)
    }
    // Connect to Storage emulator if available
    connectStorageEmulator(storage, "localhost", 9199)
  } catch (error) {
    // Emulator connection failed, continue with production
    console.log("Using production Firebase services")
  }
}

export default app
