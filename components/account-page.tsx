"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  Edit,
  Bell,
  MessageSquare,
  Palette,
  LogOut,
  Menu,
  X,
  Upload,
  ArrowLeft,
  Home,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, updateDoc, addDoc, collection } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { signOut } from "@/lib/auth"
import Link from "next/link"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "@/lib/firebase"
import { updateProfile } from "firebase/auth"
import { loggedGetDoc } from "@/lib/firestore-logger"
import { useAnimatedSuccess } from "@/hooks/use-animated-success"
import { AnimatedSuccessMessage } from "./animated-success-message"

interface UserData {
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
  emailVerified?: boolean
  company_id?: string
}

interface CompanyData {
  id?: string
  name?: string
  business_type?: string
  address?: {
    street?: string
    city?: string
    province?: string
    postal_code?: string
  }
  website?: string
  created_by?: string
  created_at?: any
  updated_at?: any
}

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState("personal")
  const [userData, setUserData] = useState<UserData | null>(null)
  const [companyData, setCompanyData] = useState<CompanyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Use the animated success hook
  const { showSuccessAnimation, successMessage, isSuccessVisible, showAnimatedSuccess } = useAnimatedSuccess()

  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    phone_number: "",
    gender: "",
    email: "",
    about_me: "",
  })

  const [companyFormData, setCompanyFormData] = useState({
    name: "",
    address_street: "",
    address_city: "",
    address_province: "",
    website: "",
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch user data
          const userRef = doc(db, "iboard_users", user.uid)
          const userSnap = await loggedGetDoc(userRef)

          if (userSnap.exists()) {
            const data = userSnap.data() as UserData
            setUserData(data)
            setFormData({
              first_name: data.first_name || "",
              middle_name: data.middle_name || "",
              last_name: data.last_name || "",
              phone_number: data.phone_number || "",
              gender: data.gender || "",
              email: data.email || "",
              about_me: data.about_me || "",
            })
            setImagePreview(data.photo_url || null)

            // Fetch company data if company_id exists
            if (data.company_id) {
              const companyRef = doc(db, "companies", data.company_id)
              const companySnap = await loggedGetDoc(companyRef)

              if (companySnap.exists()) {
                const companyInfo = { id: companySnap.id, ...companySnap.data() } as CompanyData
                setCompanyData(companyInfo)
                setCompanyFormData({
                  name: companyInfo.name || "",
                  address_street: companyInfo.address?.street || "",
                  address_city: companyInfo.address?.city || "",
                  address_province: companyInfo.address?.province || "",
                  website: companyInfo.website || "",
                })
              }
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          setError("Failed to load user data")
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCompanyInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCompanyFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file")
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB")
        return
      }

      setSelectedFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setError("")
    }
  }

  const handlePhotoUpload = async () => {
    if (!selectedFile || !userData) return

    setUploading(true)
    setError("")

    try {
      // Create a reference to the file location
      const fileRef = ref(storage, `profile-pictures/${userData.uid}/${Date.now()}-${selectedFile.name}`)

      // Upload the file
      const snapshot = await uploadBytes(fileRef, selectedFile)

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref)

      // Update user profile in Firebase Auth
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          photoURL: downloadURL,
        })
      }

      // Update user data in Firestore
      const userRef = doc(db, "iboard_users", userData.uid)
      await updateDoc(userRef, {
        photo_url: downloadURL,
      })

      // Update local state
      setUserData((prev) => (prev ? { ...prev, photo_url: downloadURL } : null))
      setImagePreview(null)
      setSelectedFile(null)

      // Show animated success message
      showAnimatedSuccess("Profile picture updated successfully!")

      // Reset file input
      const fileInput = document.getElementById("photo-upload") as HTMLInputElement
      if (fileInput) fileInput.value = ""
    } catch (error) {
      console.error("Error uploading photo:", error)
      setError("Failed to upload photo. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const cancelPhotoSelection = () => {
    setSelectedFile(null)
    setImagePreview(null)
    const fileInput = document.getElementById("photo-upload") as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  const handleSave = async () => {
    if (!userData) return

    setSaving(true)
    setError("")
    setSuccess("")

    try {
      if (activeTab === "personal") {
        // Update user data
        const userRef = doc(db, "iboard_users", userData.uid)
        await updateDoc(userRef, {
          first_name: formData.first_name,
          middle_name: formData.middle_name,
          last_name: formData.last_name,
          phone_number: formData.phone_number,
          gender: formData.gender,
          about_me: formData.about_me,
          display_name: `${formData.first_name} ${formData.last_name}`.trim(),
        })

        setUserData((prev) => (prev ? { ...prev, ...formData } : null))
        showAnimatedSuccess("Personal information updated successfully!")
      } else if (activeTab === "company") {
        // Check if user has a company_id
        if (userData.company_id) {
          // Update existing company data
          const companyRef = doc(db, "companies", userData.company_id)
          await updateDoc(companyRef, {
            name: companyFormData.name,
            address: {
              street: companyFormData.address_street,
              city: companyFormData.address_city,
              province: companyFormData.address_province,
            },
            website: companyFormData.website,
            updated_at: new Date(),
          })

          setCompanyData((prev) =>
            prev
              ? {
                  ...prev,
                  name: companyFormData.name,
                  address: {
                    street: companyFormData.address_street,
                    city: companyFormData.address_city,
                    province: companyFormData.address_province,
                  },
                  website: companyFormData.website,
                }
              : null,
          )
          showAnimatedSuccess("Company information updated successfully!")
        } else {
          // Create new company
          const newCompanyData = {
            name: companyFormData.name,
            business_type: "", // Default empty business type
            address: {
              street: companyFormData.address_street,
              city: companyFormData.address_city,
              province: companyFormData.address_province,
            },
            website: companyFormData.website,
            created_by: userData.uid,
            created_at: new Date(),
            updated_at: new Date(),
          }

          // Create company document
          const companyRef = await addDoc(collection(db, "companies"), newCompanyData)
          const companyId = companyRef.id

          // Update user document with company ID
          const userRef = doc(db, "iboard_users", userData.uid)
          await updateDoc(userRef, {
            company_id: companyId,
          })

          // Update local state
          setUserData((prev) => (prev ? { ...prev, company_id: companyId } : null))
          setCompanyData({
            id: companyId,
            ...newCompanyData,
          })
          showAnimatedSuccess("Company information created successfully!")
        }
      }

      setIsEditing(false)
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Failed to update profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await signOut()

      // Clear component state
      setUserData(null)
      setCompanyData(null)
      setFormData({
        first_name: "",
        middle_name: "",
        last_name: "",
        phone_number: "",
        gender: "",
        email: "",
        about_me: "",
      })
      setCompanyFormData({
        name: "",
        address_street: "",
        address_city: "",
        address_province: "",
        website: "",
      })

      // Redirect to login page
      window.location.href = "/login"
    } catch (error) {
      console.error("Error signing out:", error)
      setError("Failed to logout. Please try again.")
    } finally {
      setLoggingOut(false)
      setShowLogoutModal(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-red-500 text-white px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                <span className="text-red-500 font-bold text-lg">S</span>
              </div>
              <span className="font-bold text-xl">SELLAH</span>
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            <Bell className="w-5 h-5" />
            <MessageSquare className="w-5 h-5" />
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full overflow-hidden">
                <img
                  src="/placeholder.svg?height=32&width=32"
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg?height=32&width=32"
                  }}
                />
              </div>
              <span className="hidden md:block font-medium">Loading...</span>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Animated Success Message */}
      <AnimatedSuccessMessage show={showSuccessAnimation} message={successMessage} isVisible={isSuccessVisible} />

      {/* Header */}
      <header className="bg-red-500 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white hover:bg-red-600 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <Link href="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <span className="text-red-500 font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-xl">SELLAH</span>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <Bell className="w-5 h-5" />
          <MessageSquare className="w-5 h-5" />
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full overflow-hidden border-2 border-white">
              <img
                src={userData?.photo_url || "/placeholder.svg?height=32&width=32&query=user profile"}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=32&width=32"
                }}
              />
            </div>
            <span className="hidden md:block font-medium">
              {userData?.display_name || `${userData?.first_name} ${userData?.last_name}`.trim() || "User"}
            </span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left Sidebar */}
        <aside
          className={`bg-white w-80 min-h-screen transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 fixed lg:relative z-30 shadow-lg`}
        >
          <div className="p-6">
            {/* Close button for mobile */}
            <div className="flex justify-end lg:hidden mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Profile Picture and Info */}
            <div className="text-center mb-6">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 border-2 border-gray-300">
                  <img
                    src={
                      imagePreview || userData?.photo_url || "/placeholder.svg?height=96&width=96&query=user profile"
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=96&width=96"
                    }}
                  />
                </div>

                {/* Upload/Edit Button */}
                <div className="absolute -bottom-1 -right-2">
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg">
                      <Upload className="w-3 h-3" />
                    </div>
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading}
                  />
                </div>
              </div>

              {/* Photo Upload Controls */}
              {selectedFile && (
                <div className="mb-4 space-y-2">
                  <div className="flex space-x-2 justify-center">
                    <Button
                      onClick={handlePhotoUpload}
                      disabled={uploading}
                      size="sm"
                      variant="outline"
                      className="text-xs px-2 py-1 h-7 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-2 h-2 mr-1 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-2 h-2 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={cancelPhotoSelection}
                      disabled={uploading}
                      size="sm"
                      variant="outline"
                      className="text-xs px-2 py-1 h-7 bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <h2 className="text-xl font-bold text-gray-800">
                {userData?.display_name || `${userData?.first_name} ${userData?.last_name}`.trim() || "User"}
              </h2>
              <p className="text-gray-600 text-sm">{userData?.email}</p>
            </div>

            {/* Navigation Menu */}
            <div className="space-y-2 mb-6">
              <div className="text-red-500 font-medium text-sm mb-3">User Profile</div>

              <button className="w-full text-left px-3 py-2 text-gray-600 hover:bg-gray-50 rounded flex items-center">
                <Bell className="w-4 h-4 mr-3" />
                Notifications
                <span className="ml-auto text-red-500">*</span>
              </button>

              <button className="w-full text-left px-3 py-2 text-gray-600 hover:bg-gray-50 rounded flex items-center">
                <MessageSquare className="w-4 h-4 mr-3" />
                Chat
              </button>

              <button className="w-full text-left px-3 py-2 text-gray-600 hover:bg-gray-50 rounded flex items-center">
                <Palette className="w-4 h-4 mr-3" />
                Customize
              </button>
            </div>

            {/* Logout Button */}
            <Button
              onClick={() => setShowLogoutModal(true)}
              variant="destructive"
              className="w-full bg-red-500 hover:bg-red-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 pb-20 md:pb-6">
          <div className="max-w-8xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border-0">
              {/* Header */}
              <div className="p-4 lg:p-6 border-b-0">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
                  <div className="flex items-center space-x-3">
                    <Button onClick={() => setIsEditing(!isEditing)} className="bg-red-500 hover:bg-red-600 text-white">
                      <Edit className="w-4 h-4 mr-2" />
                      {isEditing ? "Cancel Edit" : "Edit"}
                    </Button>
                    <Button
                      onClick={() => window.history.back()}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </Button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-8 border-b mb-6">
                  <button
                    onClick={() => setActiveTab("personal")}
                    className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "personal"
                        ? "border-red-500 text-red-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Personal Info
                  </button>
                  <button
                    onClick={() => setActiveTab("company")}
                    className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "company"
                        ? "border-red-500 text-red-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Company Info
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 lg:p-6 pt-0">
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="mb-6 border-green-200 bg-green-50">
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                  </Alert>
                )}

                {activeTab === "personal" && (
                  <div className="space-y-6">
                    {/* Personal Info Fields */}
                    <div className="space-y-4">
                      <div className="flex sm:flex-row sm:items-center py-3 border-b border-gray-100">
                        <label className="text-sm font-medium text-gray-700 w-32 mb-1 sm:mb-0">First Name:</label>
                        {isEditing ? (
                          <Input
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleInputChange}
                            className="flex-1"
                          />
                        ) : (
                          <span className="text-gray-600 flex-1">{userData?.first_name || "Not provided"}</span>
                        )}
                      </div>

                      <div className="flex sm:flex-row sm:items-center py-3 border-b border-gray-100">
                        <label className="text-sm font-medium text-gray-700 w-32 mb-1 sm:mb-0">Middle Name:</label>
                        {isEditing ? (
                          <Input
                            name="middle_name"
                            value={formData.middle_name}
                            onChange={handleInputChange}
                            className="flex-1"
                          />
                        ) : (
                          <span className="text-gray-600 flex-1">{userData?.middle_name || "Not provided"}</span>
                        )}
                      </div>

                      <div className="flex sm:flex-row sm:items-center py-3 border-b border-gray-100">
                        <label className="text-sm font-medium text-gray-700 w-32 mb-1 sm:mb-0">Last Name:</label>
                        {isEditing ? (
                          <Input
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleInputChange}
                            className="flex-1"
                          />
                        ) : (
                          <span className="text-gray-600 flex-1">{userData?.last_name || "Not provided"}</span>
                        )}
                      </div>

                      <div className="flex sm:flex-row sm:items-center py-3 border-b border-gray-100">
                        <label className="text-sm font-medium text-gray-700 w-32 mb-1 sm:mb-0">Mobile Number:</label>
                        {isEditing ? (
                          <Input
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleInputChange}
                            className="flex-1"
                          />
                        ) : (
                          <span className="text-gray-600 flex-1">{userData?.phone_number || "Not provided"}</span>
                        )}
                      </div>

                      <div className="flex sm:flex-row sm:items-center py-3 border-b border-gray-100">
                        <label className="text-sm font-medium text-gray-700 w-32 mb-1 sm:mb-0">Gender:</label>
                        {isEditing ? (
                          <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleInputChange}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        ) : (
                          <span className="text-gray-600 flex-1">{userData?.gender || "Not provided"}</span>
                        )}
                      </div>

                      <div className="flex sm:flex-row sm:items-center py-3 border-b border-gray-100">
                        <label className="text-sm font-medium text-gray-700 w-32 mb-1 sm:mb-0">Email:</label>
                        <span className="text-gray-600 flex-1">{userData?.email || "Not provided"}</span>
                      </div>

                      <div className="flex sm:flex-row py-3">
                        <label className="text-sm font-medium text-gray-700 w-32 mb-1 sm:mb-0">About me:</label>
                        {isEditing ? (
                          <Textarea
                            name="about_me"
                            value={formData.about_me}
                            onChange={handleInputChange}
                            rows={3}
                            className="flex-1"
                            placeholder="Tell us about yourself..."
                          />
                        ) : (
                          <span className="text-gray-600 flex-1">
                            {userData?.about_me || "No description provided."}
                          </span>
                        )}
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4 border-t">
                        <Button onClick={() => setIsEditing(false)} variant="outline" className="w-full sm:w-auto">
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={saving}
                          className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "company" && (
                  <div className="space-y-6">
                    {/* Company Info Fields */}
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-gray-100">
                        <label className="text-sm font-medium text-gray-700 w-40 mb-1 sm:mb-0">Company Name:</label>
                        {isEditing ? (
                          <Input
                            name="name"
                            value={companyFormData.name}
                            onChange={handleCompanyInputChange}
                            className="flex-1"
                            placeholder="Enter company name"
                          />
                        ) : (
                          <span className="text-gray-600 flex-1">{companyData?.name || "Not provided"}</span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-gray-100">
                        <label className="text-sm font-medium text-gray-700 w-40 mb-1 sm:mb-0">Street Address:</label>
                        {isEditing ? (
                          <Input
                            name="address_street"
                            value={companyFormData.address_street}
                            onChange={handleCompanyInputChange}
                            className="flex-1"
                            placeholder="Enter street address"
                          />
                        ) : (
                          <span className="text-gray-600 flex-1">{companyData?.address?.street || "Not provided"}</span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-gray-100">
                        <label className="text-sm font-medium text-gray-700 w-40 mb-1 sm:mb-0">City:</label>
                        {isEditing ? (
                          <Input
                            name="address_city"
                            value={companyFormData.address_city}
                            onChange={handleCompanyInputChange}
                            className="flex-1"
                            placeholder="Enter city"
                          />
                        ) : (
                          <span className="text-gray-600 flex-1">{companyData?.address?.city || "Not provided"}</span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-gray-100">
                        <label className="text-sm font-medium text-gray-700 w-40 mb-1 sm:mb-0">Province:</label>
                        {isEditing ? (
                          <Input
                            name="address_province"
                            value={companyFormData.address_province}
                            onChange={handleCompanyInputChange}
                            className="flex-1"
                            placeholder="Enter province"
                          />
                        ) : (
                          <span className="text-gray-600 flex-1">
                            {companyData?.address?.province || "Not provided"}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center py-3">
                        <label className="text-sm font-medium text-gray-700 w-40 mb-1 sm:mb-0">Website:</label>
                        {isEditing ? (
                          <Input
                            name="website"
                            value={companyFormData.website}
                            onChange={handleCompanyInputChange}
                            className="flex-1"
                            placeholder="https://www.example.com"
                          />
                        ) : (
                          <span className="text-gray-600 flex-1">{companyData?.website || "Not provided"}</span>
                        )}
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4 border-t">
                        <Button onClick={() => setIsEditing(false)} variant="outline" className="w-full sm:w-auto">
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={saving}
                          className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Logout</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLogoutModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Are you sure you want to logout? You will need to sign in again to access your account.
              </p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowLogoutModal(false)}
                  disabled={loggingOut}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto"
                >
                  {loggingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Logging out...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation - only visible on mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40 md:hidden">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors text-gray-600 hover:text-red-500 hover:bg-gray-50"
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            onClick={() => (window.location.href = "/dashboard/products")}
            className="flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors text-gray-600 hover:text-red-500 hover:bg-gray-50"
          >
            <Package className="w-6 h-6" />
            <span className="text-xs font-medium">Products</span>
          </button>
          <button
            onClick={() => (window.location.href = "/dashboard/orders")}
            className="flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors text-gray-600 hover:text-red-500 hover:bg-gray-50"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xs font-medium">Orders</span>
          </button>
          <button className="flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors text-red-500 bg-red-50">
            <Users className="w-6 h-6" />
            <span className="text-xs font-medium">Account</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
