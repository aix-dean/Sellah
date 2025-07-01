import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  FacebookAuthProvider,
  type User,
  onAuthStateChanged,
} from "firebase/auth"
import { doc, setDoc, getDoc, collection, addDoc, Timestamp } from "firebase/firestore"
import { auth, db } from "./firebase"
import { generateLicenseKey } from "./license-generator"

// Logout flag management
let wasLoggedOutFlag = false
let sessionExpiredFlag = false

export function setLogoutFlags(wasLoggedOut = true, sessionExpired = false) {
  wasLoggedOutFlag = wasLoggedOut
  sessionExpiredFlag = sessionExpired

  if (typeof window !== "undefined") {
    localStorage.setItem("wasLoggedOut", wasLoggedOut.toString())
    localStorage.setItem("sessionExpired", sessionExpired.toString())
  }
}

export function clearLogoutFlags() {
  wasLoggedOutFlag = false
  sessionExpiredFlag = false

  if (typeof window !== "undefined") {
    localStorage.removeItem("wasLoggedOut")
    localStorage.removeItem("sessionExpired")
  }
}

export function wasLoggedOut(): boolean {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("wasLoggedOut")
    return stored === "true" || wasLoggedOutFlag
  }
  return wasLoggedOutFlag
}

export function wasSessionExpired(): boolean {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("sessionExpired")
    return stored === "true" || sessionExpiredFlag
  }
  return sessionExpiredFlag
}

// Force logout function for session timeout
export async function forceLogout() {
  try {
    await firebaseSignOut(auth)
    setLogoutFlags(true, true)

    if (typeof window !== "undefined") {
      // Clear browser history to prevent back navigation
      window.history.replaceState(null, "", "/login?session=expired")
      window.location.href = "/login?session=expired"
    }

    return { error: null }
  } catch (error: any) {
    console.error("Force logout error:", error)

    // Even if Firebase signOut fails, redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/login?error=force_logout_failed"
    }

    return { error: error.message }
  }
}

export interface RegistrationData {
  firstName: string
  middleName?: string
  lastName: string
  email: string
  password: string
  companyName: string
  phoneNumber: string
  street: string
  city: string
  province: string
}

interface AuthResult {
  success: boolean
  error?: string
  user?: User
  licenseKey?: string
}

export async function registerUser(data: RegistrationData): Promise<AuthResult> {
  try {
    clearLogoutFlags()

    // Create Firebase user
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
    const user = userCredential.user

    // Send email verification
    await sendEmailVerification(user)

    // Generate unique license key
    const licenseKey = generateLicenseKey()

    // Create company document
    const companyRef = await addDoc(collection(db, "companies"), {
      name: data.companyName,
      phone: data.phoneNumber,
      address: {
        street: data.street,
        city: data.city,
        province: data.province,
      },
      owner_id: user.uid,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
      status: "active",
    })

    // Create user document in iboard_users collection
    await setDoc(doc(db, "iboard_users", user.uid), {
      uid: user.uid,
      first_name: data.firstName,
      middle_name: data.middleName || "",
      last_name: data.lastName,
      email: data.email,
      company_id: companyRef.id,
      license_key: licenseKey,
      email_verified: false,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
      status: "pending_verification",
      role: "owner",
    })

    // Create license document
    const licenseDocument = {
      license_key: licenseKey,
      user_id: user.uid,
      company_id: companyRef.id,
      status: "pending_verification",
      type: "standard",
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      features: {
        max_products: 1000,
        max_orders: 10000,
        analytics: true,
        api_access: true,
      },
      metadata: {
        activation_count: 0,
        last_activated: null,
        created_by: user.uid,
      },
    }

    await setDoc(doc(db, "licenses", licenseKey), licenseDocument)

    console.log("Registration successful:", {
      userId: user.uid,
      companyId: companyRef.id,
      licenseKey: licenseKey,
    })

    return {
      success: true,
      user,
      licenseKey,
    }
  } catch (error: any) {
    console.error("Registration error:", error)

    let errorMessage = "Registration failed. Please try again."

    if (error.code === "auth/email-already-in-use") {
      errorMessage = "An account with this email already exists."
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password is too weak. Please choose a stronger password."
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Please enter a valid email address."
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    clearLogoutFlags()
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Check if email is verified
    if (!user.emailVerified) {
      await firebaseSignOut(auth)
      return {
        success: false,
        error: "Please verify your email address before signing in. Check your inbox for the verification email.",
      }
    }

    // Update user status to active if email is verified
    const userRef = doc(db, "iboard_users", user.uid)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists() && userDoc.data().status === "pending_verification") {
      await setDoc(
        userRef,
        {
          email_verified: true,
          status: "active",
          updated_at: Timestamp.now(),
        },
        { merge: true },
      )

      // Also update license status to active
      const licenseKey = userDoc.data().license_key
      if (licenseKey) {
        const licenseRef = doc(db, "licenses", licenseKey)
        const licenseDoc = await getDoc(licenseRef)

        if (licenseDoc.exists()) {
          await setDoc(
            licenseRef,
            {
              status: "active",
              activated_at: Timestamp.now(),
              updated_at: Timestamp.now(),
              "metadata.activation_count": (licenseDoc.data().metadata?.activation_count || 0) + 1,
              "metadata.last_activated": Timestamp.now(),
            },
            { merge: true },
          )
        }
      }
    }

    return {
      success: true,
      user,
    }
  } catch (error: any) {
    console.error("Sign in error:", error)

    let errorMessage = "Sign in failed. Please try again."

    if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
      errorMessage = "Invalid email or password."
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Please enter a valid email address."
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Too many failed attempts. Please try again later."
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

// Legacy function for compatibility
export async function signUpWithEmail(
  email: string,
  password: string,
  userData: {
    firstName: string
    middleName: string
    lastName: string
    companyName: string
    phoneNumber: string
    street: string
    city: string
    province: string
  },
) {
  return await registerUser({
    firstName: userData.firstName,
    middleName: userData.middleName,
    lastName: userData.lastName,
    email: email,
    password: password,
    companyName: userData.companyName,
    phoneNumber: userData.phoneNumber,
    street: userData.street,
    city: userData.city,
    province: userData.province,
  })
}

export async function signInWithGoogle() {
  try {
    clearLogoutFlags()
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    return { user: result.user, error: null }
  } catch (error: any) {
    return { user: null, error: error.message }
  }
}

export async function signInWithFacebook() {
  try {
    clearLogoutFlags()
    const provider = new FacebookAuthProvider()
    const result = await signInWithPopup(auth, provider)
    return { user: result.user, error: null }
  } catch (error: any) {
    return { user: null, error: error.message }
  }
}

export async function resetPassword(email: string) {
  try {
    clearLogoutFlags()
    await sendPasswordResetEmail(auth, email)
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth)
    setLogoutFlags(true, false)

    if (typeof window !== "undefined") {
      // Clear browser history to prevent back navigation
      window.history.replaceState(null, "", "/login")
      window.location.href = "/login"
    }

    return { error: null }
  } catch (error: any) {
    console.error("Logout error:", error)

    // Even if Firebase signOut fails, redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/login?error=logout_failed"
    }

    return { error: error.message }
  }
}

export async function getCurrentUser(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

export async function getUserData(uid: string) {
  try {
    const userDoc = await getDoc(doc(db, "iboard_users", uid))
    if (userDoc.exists()) {
      return { data: userDoc.data(), error: null }
    } else {
      return { data: null, error: "User not found" }
    }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function resendVerificationEmail() {
  try {
    const user = auth.currentUser
    if (user && !user.emailVerified) {
      await sendEmailVerification(user)
      return { error: null }
    }
    return { error: "No user found or email already verified" }
  } catch (error: any) {
    return { error: error.message }
  }
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}
