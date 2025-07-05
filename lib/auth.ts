import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  type User,
  type AuthError,
} from "firebase/auth"
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore"
import { auth, db } from "./firebase"
import { validateLicenseFormat, createLicenseDocument } from "./license-generator"

// User data interface
export interface UserData {
  uid: string
  email?: string
  phone_number?: string
  display_name?: string
  photo_url?: string
  first_name?: string
  middle_name?: string
  last_name?: string
  gender?: string
  about_me?: string
  license_key?: string
  active?: boolean
  onboarding?: boolean
  type?: string
  status?: "UNKNOWN" | "INCOMPLETE" | "VERIFIED"
  account_status?: "active" | "inactive"
  emailVerified?: boolean
  company_id?: string
  product_count?: number
  created_at?: any
  updated_at?: any
  last_login?: any
}

// Registration data interface
export interface RegistrationData {
  email: string
  password: string
  firstName: string
  middleName?: string
  lastName: string
  phoneNumber?: string
  licenseKey: string
  gender?: string
  aboutMe?: string
}

// Login result interface
export interface LoginResult {
  success: boolean
  user?: User
  error?: string
  requiresEmailVerification?: boolean
}

// Registration result interface
export interface RegistrationResult {
  success: boolean
  user?: User
  error?: string
  requiresEmailVerification?: boolean
}

// Session management constants
const LOGOUT_FLAG_KEY = "sellah_logout_flag"
const SESSION_EXPIRED_KEY = "sellah_session_expired"
const LOGOUT_REASON_KEY = "sellah_logout_reason"

// Session management functions
export function setLogoutFlags(reason: "manual" | "session_expired" | "inactivity" = "manual") {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOGOUT_FLAG_KEY, "true")
    localStorage.setItem(LOGOUT_REASON_KEY, reason)
    if (reason === "session_expired") {
      localStorage.setItem(SESSION_EXPIRED_KEY, "true")
    }
  }
}

export function clearLogoutFlags() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(LOGOUT_FLAG_KEY)
    localStorage.removeItem(SESSION_EXPIRED_KEY)
    localStorage.removeItem(LOGOUT_REASON_KEY)
  }
}

export function wasLoggedOut(): boolean {
  if (typeof window !== "undefined") {
    return localStorage.getItem(LOGOUT_FLAG_KEY) === "true"
  }
  return false
}

export function wasSessionExpired(): boolean {
  if (typeof window !== "undefined") {
    return localStorage.getItem(SESSION_EXPIRED_KEY) === "true"
  }
  return false
}

export function getLogoutReason(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem(LOGOUT_REASON_KEY) || "manual"
  }
  return "manual"
}

// Format license key as user types
export function formatLicenseKey(value: string): string {
  // Remove all non-alphanumeric characters
  const cleaned = value.replace(/[^A-Z0-9]/g, "").toUpperCase()

  // Add dashes every 5 characters
  const formatted = cleaned.replace(/(.{5})/g, "$1-").replace(/-$/, "")

  // Limit to 23 characters (XXXXX-XXXXX-XXXXX-XXXXX)
  return formatted.substring(0, 23)
}

// Validate license key format
export function isValidLicenseKeyFormat(licenseKey: string): boolean {
  return validateLicenseFormat(licenseKey)
}

// Check if license key is already used
export async function isLicenseKeyUsed(licenseKey: string): Promise<boolean> {
  try {
    const licensesRef = collection(db, "licenses")
    const q = query(licensesRef, where("license_key", "==", licenseKey))
    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty
  } catch (error) {
    console.error("Error checking license key:", error)
    return false
  }
}

// Sign in with email and password
export async function signInWithEmail(email: string, password: string): Promise<LoginResult> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Update last login timestamp
    try {
      const userDocRef = doc(db, "iboard_users", user.uid)
      await updateDoc(userDocRef, {
        last_login: serverTimestamp(),
        updated_at: serverTimestamp(),
      })
    } catch (updateError) {
      console.error("Error updating last login:", updateError)
      // Don't fail the login if we can't update the timestamp
    }

    // Clear any logout flags on successful login
    clearLogoutFlags()

    return {
      success: true,
      user,
      requiresEmailVerification: !user.emailVerified,
    }
  } catch (error) {
    console.error("Login error:", error)
    const authError = error as AuthError

    let errorMessage = "Login failed. Please try again."

    switch (authError.code) {
      case "auth/user-not-found":
        errorMessage = "No account found with this email address."
        break
      case "auth/wrong-password":
        errorMessage = "Incorrect password. Please try again."
        break
      case "auth/invalid-email":
        errorMessage = "Invalid email address format."
        break
      case "auth/user-disabled":
        errorMessage = "This account has been disabled. Please contact support."
        break
      case "auth/too-many-requests":
        errorMessage = "Too many failed login attempts. Please try again later."
        break
      case "auth/network-request-failed":
        errorMessage = "Network error. Please check your connection and try again."
        break
      case "auth/invalid-credential":
        errorMessage = "Invalid email or password. Please check your credentials."
        break
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

// Register new user
export async function registerUser(data: RegistrationData): Promise<RegistrationResult> {
  try {
    // Validate license key format
    if (!isValidLicenseKeyFormat(data.licenseKey)) {
      return {
        success: false,
        error: "Invalid license key format. Please use format: XXXXX-XXXXX-XXXXX-XXXXX",
      }
    }

    // Check if license key is already used
    const licenseUsed = await isLicenseKeyUsed(data.licenseKey)
    if (licenseUsed) {
      return {
        success: false,
        error: "This license key has already been registered. Please use a different license key.",
      }
    }

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
    const user = userCredential.user

    // Update user profile
    await updateProfile(user, {
      displayName: `${data.firstName} ${data.lastName}`.trim(),
    })

    // Create user document in Firestore
    const userData: UserData = {
      uid: user.uid,
      email: user.email || data.email,
      phone_number: data.phoneNumber || "",
      display_name: `${data.firstName} ${data.lastName}`.trim(),
      photo_url: user.photoURL || "",
      first_name: data.firstName,
      middle_name: data.middleName || "",
      last_name: data.lastName,
      gender: data.gender || "",
      about_me: data.aboutMe || "",
      license_key: data.licenseKey,
      active: true,
      onboarding: false,
      type: "SELLAH",
      status: "UNKNOWN",
      account_status: "active",
      emailVerified: user.emailVerified,
      company_id: "",
      product_count: 0,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      last_login: serverTimestamp(),
    }

    // Save user data to Firestore
    const userDocRef = doc(db, "iboard_users", user.uid)
    await setDoc(userDocRef, userData)

    // Create license document
    try {
      await createLicenseDocument(data.licenseKey, user.uid)
    } catch (licenseError) {
      console.error("Error creating license document:", licenseError)
      // Don't fail registration if license document creation fails
    }

    return {
      success: true,
      user,
      requiresEmailVerification: !user.emailVerified,
    }
  } catch (error) {
    console.error("Registration error:", error)
    const authError = error as AuthError

    let errorMessage = "Registration failed. Please try again."

    switch (authError.code) {
      case "auth/email-already-in-use":
        errorMessage = "An account with this email address already exists."
        break
      case "auth/invalid-email":
        errorMessage = "Invalid email address format."
        break
      case "auth/weak-password":
        errorMessage = "Password is too weak. Please use at least 6 characters."
        break
      case "auth/network-request-failed":
        errorMessage = "Network error. Please check your connection and try again."
        break
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

// Sign out user
export async function signOut(reason: "manual" | "session_expired" | "inactivity" = "manual"): Promise<void> {
  try {
    // Set logout flags before signing out
    setLogoutFlags(reason)

    await firebaseSignOut(auth)
  } catch (error) {
    console.error("Sign out error:", error)
    throw error
  }
}

// Send password reset email
export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sendPasswordResetEmail(auth, email)
    return { success: true }
  } catch (error) {
    console.error("Password reset error:", error)
    const authError = error as AuthError

    let errorMessage = "Failed to send password reset email. Please try again."

    switch (authError.code) {
      case "auth/user-not-found":
        errorMessage = "No account found with this email address."
        break
      case "auth/invalid-email":
        errorMessage = "Invalid email address format."
        break
      case "auth/network-request-failed":
        errorMessage = "Network error. Please check your connection and try again."
        break
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

// Get current user data from Firestore
export async function getCurrentUserData(): Promise<UserData | null> {
  try {
    const user = auth.currentUser
    if (!user) return null

    const userDocRef = doc(db, "iboard_users", user.uid)
    const userDoc = await getDoc(userDocRef)

    if (userDoc.exists()) {
      const firestoreData = userDoc.data()
      return {
        uid: user.uid,
        email: user.email || firestoreData.email,
        phone_number: user.phoneNumber || firestoreData.phone_number,
        display_name: user.displayName || firestoreData.display_name,
        photo_url: user.photoURL || firestoreData.photo_url,
        emailVerified: user.emailVerified,
        ...firestoreData,
      } as UserData
    }

    return null
  } catch (error) {
    console.error("Error getting current user data:", error)
    return null
  }
}

// Update user profile
export async function updateUserProfile(updates: Partial<UserData>): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser
    if (!user) {
      return { success: false, error: "No authenticated user" }
    }

    // Update Firebase Auth profile if needed
    if (updates.display_name || updates.photo_url) {
      await updateProfile(user, {
        displayName: updates.display_name,
        photoURL: updates.photo_url,
      })
    }

    // Update Firestore document
    const userDocRef = doc(db, "iboard_users", user.uid)
    await updateDoc(userDocRef, {
      ...updates,
      updated_at: serverTimestamp(),
    })

    return { success: true }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return {
      success: false,
      error: "Failed to update profile. Please try again.",
    }
  }
}
