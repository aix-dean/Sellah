import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  type User,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  reload,
} from "firebase/auth"
import { auth, db } from "./firebase"
import { doc, getDoc, serverTimestamp, updateDoc, collection, addDoc, writeBatch } from "firebase/firestore"
import { generateLicenseKey } from "./license-generator"

// Set tenant ID for multi-tenancy
auth.tenantId = "sellah-zgqvh"

// Types
export interface UserData {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  phoneNumber?: string
  emailVerified: boolean
  createdAt: any
  updatedAt: any
  lastLoginAt: any
  loginCount: number
  provider: string
  companyId?: string
  role: string
  status: string
  preferences?: {
    theme: string
    notifications: boolean
    language: string
  }
  first_name?: string
  middle_name?: string
  last_name?: string
  gender?: string
  phone_number?: string
  companyName?: string
  companyDescription?: string
  industry?: string
  companySize?: string
}

export interface CompanyData {
  id: string
  name: string
  description?: string
  industry?: string
  size?: string
  website?: string
  phone?: string
  address?: {
    street: string
    city: string
    province: string
    postal_code: string
    country: string
  }
  logo?: string
  createdAt: any
  updatedAt: any
  ownerId: string
  status: string
  business_type?: string
  settings?: {
    currency: string
    timezone: string
    dateFormat: string
  }
}

export interface LicenseData {
  id: string
  license_key: string
  project_name: string
  type: string
  uid: string
  created: any
  updated: any
  deleted: boolean
}

export interface RegistrationData {
  email: string
  password: string
  displayName: string
  companyName: string
  companyDescription?: string
  industry?: string
  companySize?: string
  phoneNumber?: string
}

export interface CompleteRegistrationData {
  userData: {
    first_name: string
    middle_name?: string
    last_name: string
    phone_number: string
    gender: string
    email: string
    password: string
  }
  companyData: {
    name: string
    address: {
      street: string
      city: string
      province: string
      postal_code: string
    }
    website?: string
    business_type?: string
  }
}

export interface AuthResult {
  success: boolean
  user?: User
  userData?: UserData
  companyData?: CompanyData
  licenseId?: string
  companyId?: string
  error?: string
  needsEmailVerification?: boolean
  needsRegistrationCompletion?: boolean
  message?: string
}

// Logout flag management
export const wasLoggedOut = (): boolean => {
  if (typeof window === "undefined") return false

  const sessionFlag = sessionStorage.getItem("wasLoggedOut")
  const localFlag = localStorage.getItem("wasLoggedOut")
  const cookieFlag = document.cookie.includes("auth_logged_out=true")

  return sessionFlag === "true" || localFlag === "true" || cookieFlag
}

export const setLogoutFlags = (): void => {
  if (typeof window === "undefined") return

  sessionStorage.setItem("wasLoggedOut", "true")
  localStorage.setItem("wasLoggedOut", "true")
  document.cookie = "auth_logged_out=true; path=/"
}

export const clearLogoutFlags = (): void => {
  if (typeof window === "undefined") return

  sessionStorage.removeItem("wasLoggedOut")
  localStorage.removeItem("wasLoggedOut")
  document.cookie = "auth_logged_out=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/"
}

// Check email verification status
export const checkEmailVerification = async (user: User): Promise<boolean> => {
  try {
    console.log("Checking email verification for user:", user.uid)
    console.log("Current emailVerified status:", user.emailVerified)

    // Reload user to get latest verification status
    await reload(user)
    console.log("After reload - emailVerified status:", user.emailVerified)

    return user.emailVerified
  } catch (error) {
    console.error("Error checking email verification:", error)
    return false
  }
}

// Check if email is verified without signing out
export const checkEmailVerified = async (): Promise<boolean> => {
  try {
    const user = auth.currentUser
    if (!user) {
      throw new Error("No user is currently signed in")
    }

    await reload(user)
    return user.emailVerified
  } catch (error) {
    console.error("Error checking email verification:", error)
    throw error
  }
}

// Create license document
export const createLicenseDocument = async (uid: string): Promise<string> => {
  try {
    const licenseKey = generateLicenseKey()
    const now = serverTimestamp()

    const licenseData: Omit<LicenseData, "id"> = {
      license_key: licenseKey,
      project_name: "sellah",
      type: "full",
      uid: uid,
      created: now,
      updated: now,
      deleted: false,
    }

    const licenseRef = await addDoc(collection(db, "License"), licenseData)

    console.log("License document created:", licenseRef.id)
    return licenseRef.id
  } catch (error) {
    console.error("Error creating license document:", error)
    throw error
  }
}

// Save user to Firestore with company and license
export const saveUserToFirestore = async (
  user: User,
  additionalData: Partial<UserData> = {},
): Promise<{ companyId: string; licenseId: string }> => {
  try {
    const batch = writeBatch(db)
    const now = serverTimestamp()

    // Create company document
    const companyRef = doc(collection(db, "companies"))
    const companyData: Omit<CompanyData, "id"> = {
      name: additionalData.companyName || `${user.displayName || user.email}'s Company`,
      description: additionalData.companyDescription || "",
      industry: additionalData.industry || "",
      size: additionalData.companySize || "",
      phone: additionalData.phoneNumber || "",
      createdAt: now,
      updatedAt: now,
      ownerId: user.uid,
      status: "active",
      settings: {
        currency: "PHP",
        timezone: "Asia/Manila",
        dateFormat: "MM/DD/YYYY",
      },
    }
    batch.set(companyRef, companyData)

    // Create user document
    const userRef = doc(db, "iboard_users", user.uid)
    const userData: Omit<UserData, "uid"> = {
      email: user.email || "",
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      phoneNumber: user.phoneNumber || additionalData.phoneNumber || "",
      emailVerified: user.emailVerified,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
      loginCount: 1,
      provider: additionalData.provider || "email",
      companyId: companyRef.id,
      role: "owner",
      status: "active",
      preferences: {
        theme: "light",
        notifications: true,
        language: "en",
      },
      ...additionalData,
    }
    batch.set(userRef, userData)

    // Commit batch
    await batch.commit()

    // Create license document separately (not in batch due to collection reference)
    const licenseId = await createLicenseDocument(user.uid)

    console.log("User, company, and license documents created successfully")
    return { companyId: companyRef.id, licenseId }
  } catch (error) {
    console.error("Error saving user to Firestore:", error)
    throw error
  }
}

// Complete registration (used by registration form)
export const completeRegistration = async (data: CompleteRegistrationData): Promise<AuthResult> => {
  try {
    console.log("Starting complete registration with data:", data)

    // Ensure tenant ID is set
    auth.tenantId = "sellah-zgqvh"
    console.log("Using tenant ID:", auth.tenantId)

    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, data.userData.email, data.userData.password)
    const user = userCredential.user

    console.log("User created successfully:", user.uid)

    // Update profile with display name
    const displayName = `${data.userData.first_name} ${data.userData.last_name}`.trim()
    await updateProfile(user, {
      displayName: displayName,
    })

    console.log("Profile updated with display name:", displayName)

    // Prepare user data for Firestore
    const userData: Partial<UserData> = {
      first_name: data.userData.first_name,
      middle_name: data.userData.middle_name || "",
      last_name: data.userData.last_name,
      phone_number: data.userData.phone_number,
      gender: data.userData.gender,
      displayName: displayName,
      provider: "email",
      companyName: data.companyData.name,
    }

    // Save to Firestore with company and license
    const { companyId, licenseId } = await saveUserToFirestore(user, userData)

    console.log("User saved to Firestore with company ID:", companyId, "and license ID:", licenseId)

    // Send email verification
    await sendEmailVerification(user)
    console.log("Email verification sent")

    return {
      success: true,
      user,
      companyId,
      licenseId,
      message: "Registration completed successfully! Please check your email for verification.",
    }
  } catch (error: any) {
    console.error("Complete registration error:", error)

    let message = "Registration failed. Please try again."

    switch (error.code) {
      case "auth/email-already-in-use":
        message = "An account with this email already exists."
        break
      case "auth/invalid-email":
        message = "Please enter a valid email address."
        break
      case "auth/weak-password":
        message = "Password should be at least 6 characters long."
        break
      case "auth/operation-not-allowed":
        message = "Email registration is not enabled."
        break
    }

    return {
      success: false,
      error: message,
      message: message,
    }
  }
}

// Email registration (legacy function)
export const registerWithEmail = async (data: RegistrationData): Promise<AuthResult> => {
  try {
    // Ensure tenant ID is set
    auth.tenantId = "sellah-zgqvh"

    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
    const user = userCredential.user

    // Update profile
    await updateProfile(user, {
      displayName: data.displayName,
    })

    // Save to Firestore with company and license
    const { companyId, licenseId } = await saveUserToFirestore(user, {
      displayName: data.displayName,
      companyName: data.companyName,
      companyDescription: data.companyDescription,
      industry: data.industry,
      companySize: data.companySize,
      phoneNumber: data.phoneNumber,
      provider: "email",
    })

    // Send email verification
    await sendEmailVerification(user)

    return {
      success: true,
      user,
      licenseId,
      needsEmailVerification: true,
      message: "Account created successfully! Please check your email and verify your account before signing in.",
    }
  } catch (error: any) {
    console.error("Registration error:", error)
    return {
      success: false,
      error: error.message || "Registration failed",
      message: error.message || "Registration failed",
    }
  }
}

// Email sign in
export const signInWithEmail = async (email: string, password: string): Promise<AuthResult> => {
  try {
    // Ensure tenant ID is set
    auth.tenantId = "sellah-zgqvh"
    console.log("Signing in with tenant ID:", auth.tenantId)

    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    console.log("User signed in:", user.email, "Email verified:", user.emailVerified)

    // Check if email is verified by reloading user data
    const isEmailVerified = await checkEmailVerification(user)
    console.log("Email verification status after reload:", isEmailVerified)

    if (!isEmailVerified) {
      // Sign out the user if email is not verified
      await firebaseSignOut(auth)
      return {
        success: false,
        needsEmailVerification: true,
        error: "Please verify your email address before logging in. Check your inbox for the verification link.",
        message: "Please verify your email address before logging in. Check your inbox for the verification link.",
      }
    }

    // Update last login
    const userRef = doc(db, "iboard_users", user.uid)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const currentData = userDoc.data()
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
        loginCount: (currentData.loginCount || 0) + 1,
        updatedAt: serverTimestamp(),
        emailVerified: isEmailVerified, // Update email verification status in Firestore
      })
    }

    // Clear logout flags
    clearLogoutFlags()

    return {
      success: true,
      user,
      message: "Successfully signed in!",
    }
  } catch (error: any) {
    console.error("Sign in error:", error)

    let message = "Failed to sign in. Please try again."

    switch (error.code) {
      case "auth/user-not-found":
        message = "No account found with this email address."
        break
      case "auth/wrong-password":
        message = "Incorrect password. Please try again."
        break
      case "auth/invalid-email":
        message = "Please enter a valid email address."
        break
      case "auth/user-disabled":
        message = "This account has been disabled."
        break
      case "auth/too-many-requests":
        message = "Too many failed attempts. Please try again later."
        break
      case "auth/invalid-credential":
        message = "Invalid email or password. Please check your credentials."
        break
    }

    return {
      success: false,
      error: message,
      message: message,
    }
  }
}

// Google sign in
export const signInWithGoogle = async (): Promise<AuthResult> => {
  try {
    // Ensure tenant ID is set
    auth.tenantId = "sellah-zgqvh"
    console.log("Google sign in with tenant ID:", auth.tenantId)

    const provider = new GoogleAuthProvider()
    provider.addScope("email")
    provider.addScope("profile")

    const result = await signInWithPopup(auth, provider)
    const user = result.user

    // Check if user exists in Firestore
    const userRef = doc(db, "iboard_users", user.uid)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      // New user - needs registration completion
      return {
        success: true,
        user,
        needsRegistrationCompletion: true,
        message: "Please complete your registration.",
      }
    } else {
      // Existing user - update last login
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
        loginCount: (userDoc.data().loginCount || 0) + 1,
        updatedAt: serverTimestamp(),
      })

      // Clear logout flags
      clearLogoutFlags()

      return {
        success: true,
        user,
        message: "Successfully signed in with Google!",
      }
    }
  } catch (error: any) {
    console.error("Google sign in error:", error)

    let message = "Failed to sign in with Google."

    switch (error.code) {
      case "auth/popup-closed-by-user":
        message = "Sign in was cancelled."
        break
      case "auth/popup-blocked":
        message = "Popup was blocked. Please allow popups and try again."
        break
    }

    return {
      success: false,
      error: message,
      message: message,
    }
  }
}

// Facebook sign in
export const signInWithFacebook = async (): Promise<AuthResult> => {
  try {
    // Ensure tenant ID is set
    auth.tenantId = "sellah-zgqvh"
    console.log("Facebook sign in with tenant ID:", auth.tenantId)

    const provider = new FacebookAuthProvider()
    provider.addScope("email")

    const result = await signInWithPopup(auth, provider)
    const user = result.user

    // Check if user exists in Firestore
    const userRef = doc(db, "iboard_users", user.uid)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      // New user - needs registration completion
      return {
        success: true,
        user,
        needsRegistrationCompletion: true,
        message: "Please complete your registration.",
      }
    } else {
      // Existing user - update last login
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
        loginCount: (userDoc.data().loginCount || 0) + 1,
        updatedAt: serverTimestamp(),
      })

      // Clear logout flags
      clearLogoutFlags()

      return {
        success: true,
        user,
        message: "Successfully signed in with Facebook!",
      }
    }
  } catch (error: any) {
    console.error("Facebook sign in error:", error)

    let message = "Failed to sign in with Facebook."

    switch (error.code) {
      case "auth/popup-closed-by-user":
        message = "Sign in was cancelled."
        break
      case "auth/popup-blocked":
        message = "Popup was blocked. Please allow popups and try again."
        break
    }

    return {
      success: false,
      error: message,
      message: message,
    }
  }
}

// Apple sign in
export const signInWithApple = async (): Promise<AuthResult> => {
  try {
    // Ensure tenant ID is set
    auth.tenantId = "sellah-zgqvh"
    console.log("Apple sign in with tenant ID:", auth.tenantId)

    const provider = new OAuthProvider("apple.com")
    provider.addScope("email")
    provider.addScope("name")

    const result = await signInWithPopup(auth, provider)
    const user = result.user

    // Check if user exists in Firestore
    const userRef = doc(db, "iboard_users", user.uid)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      // New user - needs registration completion
      return {
        success: true,
        user,
        needsRegistrationCompletion: true,
        message: "Please complete your registration.",
      }
    } else {
      // Existing user - update last login
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
        loginCount: (userDoc.data().loginCount || 0) + 1,
        updatedAt: serverTimestamp(),
      })

      // Clear logout flags
      clearLogoutFlags()

      return {
        success: true,
        user,
        message: "Successfully signed in with Apple!",
      }
    }
  } catch (error: any) {
    console.error("Apple sign in error:", error)

    let message = "Failed to sign in with Apple."

    switch (error.code) {
      case "auth/popup-closed-by-user":
        message = "Sign in was cancelled."
        break
      case "auth/popup-blocked":
        message = "Popup was blocked. Please allow popups and try again."
        break
    }

    return {
      success: false,
      error: message,
      message: message,
    }
  }
}

// Phone authentication
export const setupRecaptcha = (containerId: string): RecaptchaVerifier => {
  // Temporarily remove tenant ID for phone auth
  const originalTenantId = auth.tenantId
  auth.tenantId = null

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {
      console.log("reCAPTCHA solved")
    },
  })

  // Restore tenant ID
  auth.tenantId = originalTenantId

  return verifier
}

export const sendVerificationCode = async (
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier,
): Promise<ConfirmationResult> => {
  try {
    // Temporarily remove tenant ID for phone auth
    const originalTenantId = auth.tenantId
    auth.tenantId = null

    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)

    // Restore tenant ID
    auth.tenantId = originalTenantId

    return confirmationResult
  } catch (error: any) {
    // Restore tenant ID in case of error
    auth.tenantId = "sellah-zgqvh"
    console.error("Error sending verification code:", error)
    throw error
  }
}

export const verifyPhoneCode = async (confirmationResult: ConfirmationResult, code: string): Promise<AuthResult> => {
  try {
    // Temporarily remove tenant ID for phone auth
    const originalTenantId = auth.tenantId
    auth.tenantId = null

    const result = await confirmationResult.confirm(code)
    const user = result.user

    // Restore tenant ID
    auth.tenantId = originalTenantId

    // Check if user exists in Firestore
    const userRef = doc(db, "iboard_users", user.uid)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      // New user - needs registration completion
      return {
        success: true,
        user,
        needsRegistrationCompletion: true,
        message: "Please complete your registration.",
      }
    } else {
      // Existing user - update last login
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
        loginCount: (userDoc.data().loginCount || 0) + 1,
        updatedAt: serverTimestamp(),
      })

      // Clear logout flags
      clearLogoutFlags()

      return {
        success: true,
        user,
        message: "Phone number verified successfully!",
      }
    }
  } catch (error: any) {
    // Restore tenant ID in case of error
    auth.tenantId = "sellah-zgqvh"
    console.error("Phone verification error:", error)
    return {
      success: false,
      error: error.message || "Phone verification failed",
      message: error.message || "Phone verification failed",
    }
  }
}

// Password reset
export const resetPassword = async (email: string): Promise<{ success: boolean; error?: string; message?: string }> => {
  try {
    // Ensure tenant ID is set
    auth.tenantId = "sellah-zgqvh"

    await sendPasswordResetEmail(auth, email)
    return {
      success: true,
      message: "Password reset email sent! Please check your inbox.",
    }
  } catch (error: any) {
    console.error("Password reset error:", error)

    let message = "Failed to send password reset email."

    switch (error.code) {
      case "auth/user-not-found":
        message = "No account found with this email address."
        break
      case "auth/invalid-email":
        message = "Please enter a valid email address."
        break
    }

    return {
      success: false,
      error: message,
      message: message,
    }
  }
}

// Sign out
export const signOut = async (): Promise<{ success: boolean; error?: string; message?: string }> => {
  try {
    await firebaseSignOut(auth)
    setLogoutFlags()
    return {
      success: true,
      message: "Successfully signed out!",
    }
  } catch (error: any) {
    console.error("Sign out error:", error)
    return {
      success: false,
      error: error.message || "Sign out failed",
      message: error.message || "Sign out failed",
    }
  }
}

// Force logout (for session timeout)
export const forceLogout = async (): Promise<void> => {
  try {
    setLogoutFlags()
    await firebaseSignOut(auth)
  } catch (error) {
    console.error("Force logout error:", error)
    // Still set flags even if signOut fails
    setLogoutFlags()
  }
}

// Get current user data from Firestore
export const getCurrentUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const userRef = doc(db, "iboard_users", uid)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      return { uid, ...userDoc.data() } as UserData
    }

    return null
  } catch (error) {
    console.error("Error getting user data:", error)
    return null
  }
}

// Update user data
export const updateUserData = async (
  uid: string,
  data: Partial<UserData>,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const userRef = doc(db, "iboard_users", uid)
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error updating user data:", error)
    return {
      success: false,
      error: error.message || "Failed to update user data",
    }
  }
}

// Resend email verification
export const resendEmailVerification = async (
  user?: User,
): Promise<{ success: boolean; error?: string; message?: string }> => {
  try {
    const currentUser = user || auth.currentUser
    if (!currentUser) {
      return {
        success: false,
        error: "No user is currently signed in.",
        message: "No user is currently signed in.",
      }
    }

    await sendEmailVerification(currentUser)
    return {
      success: true,
      message: "Verification email sent! Please check your inbox.",
    }
  } catch (error: any) {
    console.error("Error resending email verification:", error)
    return {
      success: false,
      error: error.message || "Failed to resend verification email",
      message: error.message || "Failed to resend verification email",
    }
  }
}

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser
}

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!auth.currentUser
}

// Get user token
export const getUserToken = async (): Promise<string | null> => {
  try {
    const user = auth.currentUser
    if (user) {
      return await user.getIdToken()
    }
    return null
  } catch (error) {
    console.error("Error getting user token:", error)
    return null
  }
}
