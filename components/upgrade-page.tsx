"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  User,
  Building2,
  Shield,
  FileText,
  Upload,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  X,
  Camera,
  Clock,
  AlertCircle,
  FileCheck,
} from "lucide-react"
import { useUserData } from "@/hooks/use-user-data"
import { useCompanyData } from "@/hooks/use-company-data"
import { useToast } from "@/hooks/use-toast"
import { useAnimatedSuccess } from "@/hooks/use-animated-success"
import { AnimatedSuccessMessage } from "./animated-success-message"
import { useRouter } from "next/navigation"
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"

interface FileUpload {
  file: File | null
  preview: string | null
  uploading: boolean
  uploaded: boolean
  url?: string
  fromPrevious?: boolean // Flag to indicate if this is from previous verification
}

interface FormData {
  // Personal Info
  firstName: string
  middleName: string
  lastName: string
  email: string
  phoneNumber: string

  // Company Info
  companyName: string
  street: string
  city: string
  province: string
  position: string

  // Identity Verification (only for UNKNOWN users)
  idType: string
  idFront: FileUpload
  idBack: FileUpload
  selfieWithId: FileUpload

  // Business Documents (for BASIC users)
  dtiSec: FileUpload
  bir: FileUpload
  businessPermit: FileUpload
}

interface UpgradeRequest {
  id: string
  status: "pending" | "approved" | "rejected"
  createdAt: any
  requestedStatus: string
  currentStatus: string
  identityVerification?: {
    idType: string
    idFrontUrl: string
    idBackUrl: string
    selfieWithIdUrl: string
  }
}

const ID_TYPES = [
  { value: "drivers_license", label: "Driver's License" },
  { value: "passport", label: "Passport" },
  { value: "national_id", label: "National ID (PhilID)" },
  { value: "voters_id", label: "Voter's ID" },
  { value: "postal_id", label: "Postal ID" },
  { value: "prc_id", label: "PRC ID" },
  { value: "sss_id", label: "SSS ID" },
  { value: "philhealth_id", label: "PhilHealth ID" },
  { value: "tin_id", label: "TIN ID" },
  { value: "senior_citizen_id", label: "Senior Citizen ID" },
  { value: "pwd_id", label: "PWD ID" },
]

export default function UpgradePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { showSuccessAnimation, successMessage, isSuccessVisible, showAnimatedSuccess } = useAnimatedSuccess()

  // User data
  const { currentUser, userData, loading: userLoading, error: userError } = useUserData()
  const { company, loading: companyLoading } = useCompanyData(userData?.company_id || null)

  // Pending request state
  const [pendingRequest, setPendingRequest] = useState<UpgradeRequest | null>(null)
  const [previousRequest, setPreviousRequest] = useState<UpgradeRequest | null>(null)
  const [checkingRequest, setCheckingRequest] = useState(true)
  const [showPendingDialog, setShowPendingDialog] = useState(false)

  // Stepper state
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Determine total steps based on user status
  // UNKNOWN → BASIC: 3 steps (Personal, Company, Identity)
  // BASIC → VERIFIED: 3 steps (Personal, Company, Business Documents)
  const totalSteps = 3

  // Form data state
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    companyName: "",
    street: "",
    city: "",
    province: "",
    position: "",
    idType: "",
    idFront: { file: null, preview: null, uploading: false, uploaded: false },
    idBack: { file: null, preview: null, uploading: false, uploaded: false },
    selfieWithId: { file: null, preview: null, uploading: false, uploaded: false },
    dtiSec: { file: null, preview: null, uploading: false, uploaded: false },
    bir: { file: null, preview: null, uploading: false, uploaded: false },
    businessPermit: { file: null, preview: null, uploading: false, uploaded: false },
  })

  // Check for existing upgrade requests
  useEffect(() => {
    const checkExistingRequests = async () => {
      if (!currentUser) {
        setCheckingRequest(false)
        return
      }

      try {
        const upgradeRequestsRef = collection(db, "upgrade_requests")

        // Check for pending requests
        const pendingQuery = query(
          upgradeRequestsRef,
          where("userId", "==", currentUser.uid),
          where("status", "==", "pending"),
          orderBy("createdAt", "desc"),
          limit(1),
        )

        const pendingSnapshot = await getDocs(pendingQuery)

        if (!pendingSnapshot.empty) {
          const doc = pendingSnapshot.docs[0]
          const requestData = doc.data()

          setPendingRequest({
            id: doc.id,
            status: requestData.status,
            createdAt: requestData.createdAt,
            requestedStatus: requestData.requestedStatus,
            currentStatus: requestData.currentStatus,
          })
          setShowPendingDialog(true)
          setCheckingRequest(false)
          return
        }

        // If upgrading to VERIFIED (from BASIC), check for previous approved request
        if (userData?.status === "BASIC") {
          const approvedQuery = query(
            upgradeRequestsRef,
            where("userId", "==", currentUser.uid),
            where("status", "==", "approved"),
            where("requestedStatus", "==", "BASIC"),
            orderBy("createdAt", "desc"),
            limit(1),
          )

          const approvedSnapshot = await getDocs(approvedQuery)

          if (!approvedSnapshot.empty) {
            const doc = approvedSnapshot.docs[0]
            const requestData = doc.data()

            setPreviousRequest({
              id: doc.id,
              status: requestData.status,
              createdAt: requestData.createdAt,
              requestedStatus: requestData.requestedStatus,
              currentStatus: requestData.currentStatus,
              identityVerification: requestData.identityVerification,
            })
          }
        }
      } catch (error) {
        console.error("Error checking existing requests:", error)
      } finally {
        setCheckingRequest(false)
      }
    }

    checkExistingRequests()
  }, [currentUser, userData?.status])

  // Auto-fill form data when user data loads
  useEffect(() => {
    if (userData) {
      setFormData((prev) => ({
        ...prev,
        firstName: userData.firstName || userData.first_name || "",
        middleName: userData.middleName || userData.middle_name || "",
        lastName: userData.lastName || userData.last_name || "",
        email: userData.email || "",
        phoneNumber: userData.phoneNumber || userData.phone_number || "",
      }))
    }
  }, [userData])

  useEffect(() => {
    if (company) {
      setFormData((prev) => ({
        ...prev,
        companyName: company.name || company.company_name || "",
        street: company.address?.street || company.address || "",
        city: company.address?.city || "",
        province: company.address?.province || company.state || "",
        position: company.position || userData?.position || "",
      }))
    }
  }, [company, userData])

  // Handle pending dialog close
  const handlePendingDialogClose = () => {
    setShowPendingDialog(false)
    router.push("/dashboard/account")
  }

  // File upload handler
  const handleFileUpload = async (
    fieldName: keyof FormData,
    file: File,
    maxSize: number = 5 * 1024 * 1024, // 5MB default
  ) => {
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `File size must be less than ${maxSize / (1024 * 1024)}MB`,
        variant: "destructive",
      })
      return
    }

    const preview = URL.createObjectURL(file)

    setFormData((prev) => ({
      ...prev,
      [fieldName]: {
        file,
        preview,
        uploading: false,
        uploaded: false,
        fromPrevious: false,
      },
    }))
  }

  // Remove file handler
  const handleRemoveFile = (fieldName: keyof FormData) => {
    const currentFile = formData[fieldName] as FileUpload
    if (currentFile.preview && !currentFile.fromPrevious) {
      URL.revokeObjectURL(currentFile.preview)
    }

    setFormData((prev) => ({
      ...prev,
      [fieldName]: {
        file: null,
        preview: null,
        uploading: false,
        uploaded: false,
        fromPrevious: false,
      },
    }))
  }

  // Upload file to Firebase Storage
  const uploadFileToStorage = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path)
    await uploadBytes(storageRef, file)
    return await getDownloadURL(storageRef)
  }

  // Step validation
  const validateStep = (step: number): boolean => {
    if (userData?.status === "BASIC") {
      // BASIC → VERIFIED: Personal, Company, Business Documents
      switch (step) {
        case 1: // Personal Info
          return !!(formData.firstName && formData.lastName && formData.email)
        case 2: // Company Info
          return !!formData.companyName
        case 3: // Business Documents
          return !!(formData.dtiSec.file && formData.bir.file && formData.businessPermit.file)
        default:
          return false
      }
    } else {
      // UNKNOWN → BASIC: Personal, Company, Identity
      switch (step) {
        case 1: // Personal Info
          return !!(formData.firstName && formData.lastName && formData.email)
        case 2: // Company Info
          return !!formData.companyName
        case 3: // Identity Verification
          return !!(
            formData.idType &&
            (formData.idFront.file || formData.idFront.fromPrevious) &&
            (formData.idBack.file || formData.idBack.fromPrevious) &&
            (formData.selfieWithId.file || formData.selfieWithId.fromPrevious)
          )
        default:
          return false
      }
    }
  }

  // Navigation handlers
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps))
    } else {
      toast({
        title: "Please complete all required fields",
        description: "Fill in all required information before proceeding.",
        variant: "destructive",
      })
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleCancel = () => {
    router.push("/dashboard/account")
  }

  // Submit handler
  const handleSubmit = async () => {
    if (!currentUser || !validateStep(currentStep)) {
      toast({
        title: "Please complete all required fields",
        description: "Fill in all required information before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Upload all files
      const uploads: Record<string, string> = {}

      if (userData?.status === "BASIC") {
        // BASIC → VERIFIED: Only upload business documents
        if (formData.dtiSec.file) {
          uploads.dtiSec = await uploadFileToStorage(
            formData.dtiSec.file,
            `upgrade_requests/${currentUser.uid}/dti_sec_${Date.now()}`,
          )
        }
        if (formData.bir.file) {
          uploads.bir = await uploadFileToStorage(
            formData.bir.file,
            `upgrade_requests/${currentUser.uid}/bir_${Date.now()}`,
          )
        }
        if (formData.businessPermit.file) {
          uploads.businessPermit = await uploadFileToStorage(
            formData.businessPermit.file,
            `upgrade_requests/${currentUser.uid}/business_permit_${Date.now()}`,
          )
        }
      } else {
        // UNKNOWN → BASIC: Upload identity documents
        if (formData.idFront.file) {
          uploads.idFront = await uploadFileToStorage(
            formData.idFront.file,
            `upgrade_requests/${currentUser.uid}/id_front_${Date.now()}`,
          )
        }
        if (formData.idBack.file) {
          uploads.idBack = await uploadFileToStorage(
            formData.idBack.file,
            `upgrade_requests/${currentUser.uid}/id_back_${Date.now()}`,
          )
        }
        if (formData.selfieWithId.file) {
          uploads.selfieWithId = await uploadFileToStorage(
            formData.selfieWithId.file,
            `upgrade_requests/${currentUser.uid}/selfie_${Date.now()}`,
          )
        }
      }

      // Create upgrade request
      const upgradeRequest = {
        userId: currentUser.uid,
        currentStatus: userData?.status || "UNKNOWN",
        requestedStatus: userData?.status === "BASIC" ? "VERIFIED" : "BASIC",
        personalInfo: {
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
        },
        companyInfo: {
          companyName: formData.companyName,
          street: formData.street,
          city: formData.city,
          province: formData.province,
          position: formData.position,
        },
        ...(userData?.status === "BASIC"
          ? {
              // BASIC → VERIFIED: Include business documents and reference previous identity verification
              businessDocuments: {
                dtiSecUrl: uploads.dtiSec,
                birUrl: uploads.bir,
                businessPermitUrl: uploads.businessPermit,
              },
              identityVerificationReference: previousRequest?.id || null,
            }
          : {
              // UNKNOWN → BASIC: Include identity verification
              identityVerification: {
                idType: formData.idType,
                idFrontUrl: uploads.idFront,
                idBackUrl: uploads.idBack,
                selfieWithIdUrl: uploads.selfieWithId,
              },
            }),
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await addDoc(collection(db, "upgrade_requests"), upgradeRequest)

      showAnimatedSuccess("Upgrade request submitted successfully!")

      setTimeout(() => {
        router.push("/dashboard/account")
      }, 2000)
    } catch (error) {
      console.error("Error submitting upgrade request:", error)
      toast({
        title: "Submission Failed",
        description: "Failed to submit upgrade request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format date for display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return "Invalid Date"
    }
  }

  // File drop zone component
  const FileDropZone = ({
    fieldName,
    label,
    accept = "image/*",
    maxSize = 5 * 1024 * 1024,
    required = true,
  }: {
    fieldName: keyof FormData
    label: string
    accept?: string
    maxSize?: number
    required?: boolean
  }) => {
    const fileData = formData[fieldName] as FileUpload

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>

        {!fileData.file && !fileData.fromPrevious ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              accept={accept}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(fieldName, file, maxSize)
              }}
              className="hidden"
              id={`file-${fieldName}`}
            />
            <label htmlFor={`file-${fieldName}`} className="cursor-pointer">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500 mt-1">Max size: {maxSize / (1024 * 1024)}MB</p>
            </label>
          </div>
        ) : (
          <div
            className={`border rounded-lg p-4 ${fileData.fromPrevious ? "bg-blue-50 border-blue-200" : "bg-gray-50"}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {fileData.preview && (
                  <img
                    src={fileData.preview || "/placeholder.svg"}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">{fileData.file?.name || `${label} (Previous Verification)`}</p>
                    {fileData.fromPrevious && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                        <FileCheck className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {fileData.file
                      ? `${(fileData.file.size / 1024 / 1024).toFixed(2)} MB`
                      : "From previous verification"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(fieldName)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Step indicator
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step < currentStep
                ? "bg-green-500 text-white"
                : step === currentStep
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-600"
            }`}
          >
            {step < currentStep ? <CheckCircle className="w-4 h-4" /> : step}
          </div>
          {step < totalSteps && (
            <div className={`w-12 h-1 mx-2 ${step < currentStep ? "bg-green-500" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  )

  // Get step title and description
  const getStepInfo = (step: number) => {
    if (userData?.status === "BASIC") {
      // BASIC → VERIFIED
      const steps = [
        { title: "Personal Information", description: "Your personal details" },
        { title: "Company Information", description: "Your business details" },
        { title: "Business Documents", description: "Required business permits and certificates" },
      ]
      return steps[step - 1]
    } else {
      // UNKNOWN → BASIC
      const steps = [
        { title: "Personal Information", description: "Your personal details" },
        { title: "Company Information", description: "Your business details" },
        { title: "Identity Verification", description: "Verify your identity with valid ID" },
      ]
      return steps[step - 1]
    }
  }

  const loading = userLoading || companyLoading || checkingRequest

  if (userError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Error</h3>
          <p className="text-gray-500 mb-4">{userError}</p>
          <Button onClick={() => router.push("/login")}>Go to Login</Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading account information...</p>
        </div>
      </div>
    )
  }

  const currentStepInfo = getStepInfo(currentStep)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <AnimatedSuccessMessage show={showSuccessAnimation} message={successMessage} isVisible={isSuccessVisible} />

      {/* Pending Request Dialog */}
{showPendingDialog && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
      {/* Modal Header */}
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-orange-500" />
        <h2 className="text-lg font-semibold text-gray-900">
          Account Verification in Progress
        </h2>
      </div>

      {/* Alert Box */}
      <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200 mb-4">
        <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
        <div className="space-y-2">
          <p className="text-sm font-medium text-orange-800">
            Your account upgrade request is currently being reviewed.
          </p>
          <p className="text-sm text-orange-700">
            Please wait for our team to verify your documents. This process typically takes 1–3 business days.
          </p>
        </div>
      </div>

      {/* Request Info */}
      {pendingRequest && (
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex justify-between">
            <span>Request Status:</span>
            <span className="bg-orange-100 text-orange-800 rounded-full px-2 py-0.5 text-xs font-semibold">
              {pendingRequest.status.charAt(0).toUpperCase() + pendingRequest.status.slice(1)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Submitted:</span>
            <span>{formatDate(pendingRequest.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span>Upgrading to:</span>
            <span className="font-medium">{pendingRequest.requestedStatus}</span>
          </div>
        </div>
      )}

      {/* Modal Footer */}
      <div className="mt-6">
        <button
          onClick={handlePendingDialogClose}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Account
        </button>
      </div>
    </div>
  </div>
)}

      {/* Only show upgrade form if no pending request */}
      {!pendingRequest && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Account Upgrade</h1>
            <p className="text-gray-600 mt-2">
              {userData?.status === "BASIC"
                ? "Complete verification to become a verified seller"
                : "Upgrade your account to start selling"}
            </p>
            <Badge variant="secondary" className="mt-2">
              Current Status: {userData?.status || "UNKNOWN"}
            </Badge>
            {userData?.status === "BASIC" && (
              <div className="mt-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Shield className="w-3 h-3 mr-1" />
                  Identity already verified
                </Badge>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>
                Step {currentStep} of {totalSteps}
              </span>
              <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
            </div>
            <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
          </div>

          <StepIndicator />

          {/* Form Content */}
          <Card className="mb-8">
            <CardContent className="p-6">
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <User className="w-5 h-5 text-blue-500" />
                    <h2 className="text-xl font-semibold">{currentStepInfo.title}</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Enter your first name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="middleName">Middle Name</Label>
                      <Input
                        id="middleName"
                        value={formData.middleName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, middleName: e.target.value }))}
                        placeholder="Enter your middle name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Enter your last name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email address"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Company Information */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Building2 className="w-5 h-5 text-blue-500" />
                    <h2 className="text-xl font-semibold">{currentStepInfo.title}</h2>
                  </div>

                  <div>
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
                      placeholder="Enter your company name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={formData.street}
                      onChange={(e) => setFormData((prev) => ({ ...prev, street: e.target.value }))}
                      placeholder="Enter street address"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <Label htmlFor="province">Province</Label>
                      <Input
                        id="province"
                        value={formData.province}
                        onChange={(e) => setFormData((prev) => ({ ...prev, province: e.target.value }))}
                        placeholder="Enter province"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="position">Your Position</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
                      placeholder="Enter your position in the company"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Identity Verification (UNKNOWN users only) */}
              {currentStep === 3 && userData?.status !== "BASIC" && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Shield className="w-5 h-5 text-blue-500" />
                    <h2 className="text-xl font-semibold">{currentStepInfo.title}</h2>
                  </div>

                  <div>
                    <Label htmlFor="idType">ID Type *</Label>
                    <Select
                      value={formData.idType}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, idType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ID_TYPES.map((idType) => (
                          <SelectItem key={idType.value} value={idType.value}>
                            {idType.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FileDropZone fieldName="idFront" label="ID Front" accept="image/*" maxSize={5 * 1024 * 1024} />
                    <FileDropZone fieldName="idBack" label="ID Back" accept="image/*" maxSize={5 * 1024 * 1024} />
                  </div>

                  <FileDropZone
                    fieldName="selfieWithId"
                    label="Selfie with ID"
                    accept="image/*"
                    maxSize={5 * 1024 * 1024}
                  />

                  <Alert>
                    <Camera className="w-4 h-4" />
                    <AlertDescription>
                      Please ensure your ID is clearly visible and readable. For the selfie, hold your ID next to your
                      face so both are clearly visible.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Step 3: Business Documents (BASIC users only) */}
              {currentStep === 3 && userData?.status === "BASIC" && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <h2 className="text-xl font-semibold">{currentStepInfo.title}</h2>
                  </div>

                  <Alert className="border-green-200 bg-green-50">
                    <Shield className="w-4 h-4 text-green-500" />
                    <AlertDescription className="text-green-800">
                      Your identity has already been verified. Please upload your business documents to complete the
                      verification process.
                    </AlertDescription>
                  </Alert>

                  <FileDropZone
                    fieldName="dtiSec"
                    label="DTI/SEC Registration"
                    accept=".pdf,.jpg,.jpeg,.png"
                    maxSize={10 * 1024 * 1024}
                  />

                  <FileDropZone
                    fieldName="bir"
                    label="BIR Certificate"
                    accept=".pdf,.jpg,.jpeg,.png"
                    maxSize={10 * 1024 * 1024}
                  />

                  <FileDropZone
                    fieldName="businessPermit"
                    label="Mayor's Permit / Business Permit"
                    accept=".pdf,.jpg,.jpeg,.png"
                    maxSize={10 * 1024 * 1024}
                  />

                  <Alert>
                    <FileText className="w-4 h-4" />
                    <AlertDescription>
                      Please upload clear, readable copies of your business documents. PDF format is preferred for
                      documents.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <div>
              {currentStep === 1 ? (
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              ) : (
                <Button variant="outline" onClick={handlePrevious}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>

            <div>
              {currentStep === totalSteps ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !validateStep(currentStep)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!validateStep(currentStep)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
