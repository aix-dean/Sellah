import { initializeApp, getApps, getApp } from "firebase/app"
import { getAnalytics } from "firebase/analytics"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Hardcoded Firebase config (Firebase API keys are safe to expose)
const firebaseConfig = {
  apiKey: "AIzaSyBByUHvQmjYdalF2C1UIpzn-onB3iXGMhc",
  authDomain: "oh-app-bcf24.firebaseapp.com",
  projectId: "oh-app-bcf24",
  storageBucket: "oh-app-bcf24.appspot.com",
  messagingSenderId: "272363630855",
  appId: "1:272363630855:web:820601c723e85625d915a2",
  measurementId: "G-7CPDJLG85K"
}

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

// Initialize Firebase Auth
export const auth = getAuth(app)

// Initialize Firebase Analytics only on the client side
let analytics: any
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app)
  } catch (e) {
    console.error("Failed to initialize analytics:", e)
  }
}

// Set tenant ID
if (typeof window !== "undefined") {
  auth.tenantId = "sellah-zgqvh"
}

// Initialize Firestore
export const db = getFirestore(app)

// Initialize Storage
export const storage = getStorage(app)


export default app
