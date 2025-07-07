"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  Camera,
  X,
  CheckCircle,
  User,
  Phone,
  Mail,
  CreditCard,
  ArrowLeft,
  Info,
  FileImage,
  Shield,
} from "lucide-react"
import { useUserData } from "@/hooks/use-user-data"
import { useToast } from "@/hooks/use-toast"
import DashboardLayout from "./dashboard-layout"
import { useRouter } from "next/navigation"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage, db } from "@/lib/firebase"
import { doc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore"

const ID_TYPES = [
  "Driver's License",
  "Passport",
  "National ID",
  "State ID",
  "Military ID",
  "Voter's ID",
  "Professional License",
  "Other Government ID",
]

export default function UpgradePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentUser, userData, loading: userLoading, refreshUserData } = useUserData()

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    idType: "",
  })

  // File upload states
  const [frontIdFile, setFrontIdFile] = useState<File | null>(null)
  const [backIdFile, setBackIdFile] = useState<File | null>(null)
  const [frontIdPreview, setFrontIdPreview] = useState<string | null>(null)
  const [backIdPreview, setBackIdPreview] = useState<string | null>(null)
  const [uploadingFront, setUploadingFront] = useState(false)
  const [uploadingBack, setUploadingBack] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Pre-populate form with user data
  useEffect(() => {
    if (userData) {
      setFormData({
        firstName: userData.firstName || "",
        middleName: userData.middleName || "",
        lastName: userData.lastName || "",
        phoneNumber: userData.phoneNumber || "",
        email: userData.email || "",
        idType: "",
      })
    }
  }, [userData])

  // Handle file selection and preview
  const handleFileSelect = (file: File, type: "front" | "back") => {
    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive",
      })
      return
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const preview = e.target?.result as string
      if (type === "front") {
        setFrontIdFile(file)
        setFrontIdPreview(preview)
      } else {
        setBackIdFile(file)
        setBackIdPreview(preview)
      }
    }
    reader.readAsDataURL(file)
  }

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent, type: "front" | "back") => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file, type)
    }
  }

  // Remove file
  const removeFile = (type: "front" | "back") => {
    if (type === "front") {
      setFrontIdFile(null)
      setFrontIdPreview(null)
    } else {
      setBackIdFile(null)
      setBackIdPreview(null)
    }
  }

  // Upload file to Firebase Storage
  const uploadFile = async (file: File, type: "front" | "back"): Promise<string> => {
    if (!currentUser) throw new Error("No user authenticated")

    const fileName = `id-${type}-${Date.now()}-${file.name}`
    const storageRef = ref(storage, `user-documents/${currentUser.uid}/${fileName}`)

    const snapshot = await uploadBytes(storageRef, file)
    return await getDownloadURL(snapshot.ref)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser || !frontIdFile || !backIdFile) {
      toast({
        title: "Missing information",
        description: "Please fill all fields and upload both front and back of your ID.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      // Upload ID files
      setUploadingFront(true)
      const frontIdUrl = await uploadFile(frontIdFile, "front")
      setUploadingFront(false)

      setUploadingBack(true)
      const backIdUrl = await uploadFile(backIdFile, "back")
      setUploadingBack(false)

      // Create upgrade request document
      const upgradeRequest = {
        userId: currentUser.uid,
        ...formData,
        frontIdUrl,
        backIdUrl,
        status: "pending",
        submittedAt: serverTimestamp(),
        reviewedAt: null,
        reviewedBy: null,
        notes: "",
      }

      await addDoc(collection(db, "upgrade_requests"), upgradeRequest)

      // Update user status to INCOMPLETE
      const userRef = doc(db, "users", currentUser.uid)
      await updateDoc(userRef, {
        status: "INCOMPLETE",
        updatedAt: serverTimestamp(),
      })

      // Refresh user data
      await refreshUserData()

      // Show success modal
      setShowSuccessModal(true)
    } catch (error) {
      console.error("Error submitting upgrade request:", error)
      toast({
        title: "Submission failed",
        description: "Failed to submit upgrade request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
      setUploadingFront(false)
      setUploadingBack(false)
    }
  }

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false)
    router.push("/dashboard/account")
  }

  if (userLoading) {
    return (
      <DashboardLayout activeItem="account">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout activeItem="account">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  Account Upgrade
                </h1>
                <p className="text-gray-600 mt-1">Verify your identity to unlock full features</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <span className="text-sm font-medium text-blue-600">Identity Verification</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm">2</div>
                  <span className="text-sm">Review & Approval</span>
                </div>
              </div>
              <Progress value={50} className="h-2" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information Card */}
              <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-blue-100">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Personal Information</span>
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    Please provide your complete personal details
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="Enter your first name"
                        required
                        className="h-12 mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="middleName" className="text-sm font-medium text-gray-700">
                        Middle Name
                      </Label>
                      <Input
                        id="middleName"
                        value={formData.middleName}
                        onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                        placeholder="Enter your middle name"
                        className="h-12 mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                        Last Name *
                      </Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Enter your last name"
                        required
                        className="h-12 mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label
                        htmlFor="phoneNumber"
                        className="text-sm font-medium text-gray-700 flex items-center space-x-1"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Phone Number *</span>
                      </Label>
                      <Input
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        placeholder="Enter your phone number"
                        required
                        className="h-12 mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                        <Mail className="w-4 h-4" />
                        <span>Email Address *</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter your email address"
                        required
                        className="h-12 mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="idType" className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                      <CreditCard className="w-4 h-4" />
                      <span>Government ID Type *</span>
                    </Label>
                    <Select
                      value={formData.idType}
                      onValueChange={(value) => setFormData({ ...formData, idType: value })}
                    >
                      <SelectTrigger className="h-12 mt-1">
                        <SelectValue placeholder="Select your ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ID_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* ID Upload Guide */}
              <Alert className="border-amber-200 bg-amber-50">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <div className="space-y-2">
                    <p className="font-medium">ID Upload Guidelines:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Take clear, well-lit photos of both front and back of your ID</li>
                      <li>Ensure all text and details are clearly visible and readable</li>
                      <li>Avoid glare, shadows, or blurry images</li>
                      <li>Accepted formats: JPG, PNG, WEBP (max 10MB each)</li>
                      <li>Make sure the ID is not expired</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

              {/* ID Verification Card */}
              <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-green-100">
                <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Identity Verification</span>
                  </CardTitle>
                  <CardDescription className="text-green-100">
                    Upload clear photos of your government-issued ID
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Front ID Upload */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">Front of ID *</Label>
                      <div
                        className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 h-48 flex flex-col items-center justify-center ${
                          frontIdPreview
                            ? "border-green-300 bg-green-50"
                            : "border-gray-300 hover:border-green-400 hover:bg-green-50"
                        }`}
                        onDrop={(e) => handleDrop(e, "front")}
                        onDragOver={(e) => e.preventDefault()}
                      >
                        {frontIdPreview ? (
                          <div className="relative w-full h-full group">
                            <img
                              src={frontIdPreview || "/placeholder.svg"}
                              alt="Front ID Preview"
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 rounded-lg flex items-center justify-center">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeFile("front")}
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            {uploadingFront && (
                              <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg">
                                <div className="text-center">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                                  <p className="text-sm text-green-600">Uploading...</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center">
                            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-sm text-gray-600 mb-2">Drop your ID front image here</p>
                            <p className="text-xs text-gray-500 mb-4">or click to browse</p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileSelect(file, "front")
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="pointer-events-none bg-transparent"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Choose File
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Back ID Upload */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">Back of ID *</Label>
                      <div
                        className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 h-48 flex flex-col items-center justify-center ${
                          backIdPreview
                            ? "border-green-300 bg-green-50"
                            : "border-gray-300 hover:border-green-400 hover:bg-green-50"
                        }`}
                        onDrop={(e) => handleDrop(e, "back")}
                        onDragOver={(e) => e.preventDefault()}
                      >
                        {backIdPreview ? (
                          <div className="relative w-full h-full group">
                            <img
                              src={backIdPreview || "/placeholder.svg"}
                              alt="Back ID Preview"
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 rounded-lg flex items-center justify-center">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeFile("back")}
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            {uploadingBack && (
                              <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg">
                                <div className="text-center">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                                  <p className="text-sm text-green-600">Uploading...</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center">
                            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-sm text-gray-600 mb-2">Drop your ID back image here</p>
                            <p className="text-xs text-gray-500 mb-4">or click to browse</p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileSelect(file, "back")
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="pointer-events-none bg-transparent"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Choose File
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-center">
                <Button
                  type="submit"
                  disabled={
                    submitting ||
                    !frontIdFile ||
                    !backIdFile ||
                    !formData.firstName ||
                    !formData.lastName ||
                    !formData.email ||
                    !formData.phoneNumber ||
                    !formData.idType
                  }
                  className="px-12 py-3 h-12 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {submitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting Request...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <FileImage className="w-5 h-5" />
                      <span>Submit Upgrade Request</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Success Modal */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                Upgrade Request Submitted!
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-4 space-y-2">
                <p>Thank you for submitting your upgrade request.</p>
                <p className="font-medium">
                  Our verification team will review your documents and get back to you within
                  <span className="text-green-600 font-semibold"> 3 business days</span>.
                </p>
                <p className="text-sm">You'll receive an email notification once your account has been verified.</p>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center mt-6">
              <Button
                onClick={handleSuccessModalClose}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8"
              >
                Continue to Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
