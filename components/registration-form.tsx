"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  RefreshCw,
  Building2,
  User,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react"
import { completeRegistration, resendEmailVerification, checkEmailVerified } from "@/lib/auth"
import type { CompleteRegistrationData } from "@/lib/auth"
import { Label } from "@/components/ui/label"
import { fetchSignInMethodsForEmail } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"

type RegistrationStep = "personal" | "company" | "email-verification"

export default function RegistrationForm() {
  const router = useRouter()
  const [step, setStep] = useState<RegistrationStep>("personal")
  const [userData, setUserData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    phone_number: "",
    gender: "Male",
    email: "",
    password: "",
  })
  const [companyData, setCompanyData] = useState({
    name: "",
    address: {
      street: "",
      city: "",
      province: "",
      postal_code: "",
    },
    website: "",
  })
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendLoading, setResendLoading] = useState(false)
  const [checkingVerification, setCheckingVerification] = useState(false)
  const [registrationResult, setRegistrationResult] = useState<{
    userId: string
    companyId: string
    licenseId: string
    email: string
  } | null>(null)

  useEffect(() => {
    // Clear any logout flags when accessing registration
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("auth_logged_out")
      localStorage.removeItem("auth_logged_out")
      // Clear the logout cookie
      document.cookie = "auth_logged_out=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/"
    }
  }, [])

  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCompanyInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // Handle nested address fields
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1]
      setCompanyData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }))
    } else {
      setCompanyData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleGenderChange = (gender: string) => {
    setUserData((prev) => ({
      ...prev,
      gender,
    }))
  }

  const validatePersonalForm = (): string[] => {
    const errors: string[] = []

    if (!userData.first_name.trim()) errors.push("First name is required")
    if (!userData.last_name.trim()) errors.push("Last name is required")
    if (!userData.email.trim()) errors.push("Email is required")
    if (!userData.password.trim()) errors.push("Password is required")
    if (!userData.phone_number.trim()) errors.push("Phone number is required")

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (userData.email && !emailRegex.test(userData.email)) {
      errors.push("Please enter a valid email address")
    }

    // Password validation
    if (userData.password && userData.password.length < 6) {
      errors.push("Password must be at least 6 characters long")
    }

    if (userData.password !== confirmPassword) {
      errors.push("Passwords do not match")
    }

    // Phone number validation
    if (userData.phone_number && !/^\d{10}$/.test(userData.phone_number)) {
      errors.push("Phone number must be exactly 10 digits")
    }

    return errors
  }

  const validateCompanyForm = (): string[] => {
    const errors: string[] = []

    if (!companyData.name.trim()) errors.push("Company name is required")
    if (!companyData.address.city.trim()) errors.push("City is required")
    if (!companyData.address.province.trim()) errors.push("Province is required")

    // Website validation (if provided)
    if (companyData.website && companyData.website.trim()) {
      const urlRegex = /^https?:\/\/.+\..+/
      if (!urlRegex.test(companyData.website)) {
        errors.push("Please enter a valid website URL (include http:// or https://)")
      }
    }

    return errors
  }

  const handlePersonalNext = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const errors = validatePersonalForm()
      if (errors.length > 0) {
        setError(errors.join(", "))
        setLoading(false)
        return
      }

      // Check if email is already registered
      const signInMethods = await fetchSignInMethodsForEmail(auth, userData.email)
      if (signInMethods.length > 0) {
        setError("This email is already registered. Please use a different email or login to your existing account.")
        setLoading(false)
        return
      }

      // Email is not registered, proceed to next step
      setStep("company")
    } catch (error: any) {
      console.error("Error checking email:", error)
      if (error.code === "auth/invalid-email") {
        setError("Please enter a valid email address")
      } else {
        setError("Failed to verify email availability. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate both forms
    const personalErrors = validatePersonalForm()
    const companyErrors = validateCompanyForm()
    const allErrors = [...personalErrors, ...companyErrors]

    if (allErrors.length > 0) {
      setError(allErrors.join(", "))
      return
    }

    setLoading(true)

    try {
      const registrationData: CompleteRegistrationData = {
        userData,
        companyData: {
          ...companyData,
          business_type: "Other", // Default value for backend compatibility
        },
      }

      console.log("Submitting registration data:", registrationData)

      const result = await completeRegistration(registrationData)

      console.log("Registration result:", result)

      if (result.success && result.user) {
        setRegistrationResult({
          userId: result.user.uid,
          companyId: result.companyId || "",
          licenseId: result.licenseId || "",
          email: result.user.email || userData.email,
        })

        setStep("email-verification")
      } else {
        setError(result.error || result.message || "Registration failed. Please try again.")
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      setError(error.message || "Failed to complete registration. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResendEmail = async () => {
    setResendLoading(true)
    setError("")

    try {
      const result = await resendEmailVerification()
      if (result.success) {
        // Show success message briefly
        setError("") // Clear any existing errors
      } else {
        setError(result.error || result.message || "Failed to resend verification email")
      }
    } catch (error: any) {
      setError(error.message || "Failed to resend verification email")
    } finally {
      setResendLoading(false)
    }
  }

  const handleCheckVerification = async () => {
    setCheckingVerification(true)
    setError("")

    try {
      const isVerified = await checkEmailVerified()
      if (isVerified) {
        // Redirect to login
        router.push("/login?verified=true")
      } else {
        setError("Email not yet verified. Please check your inbox and click the verification link.")
      }
    } catch (error: any) {
      setError("Failed to check verification status. Please try again.")
    } finally {
      setCheckingVerification(false)
    }
  }

  if (step === "email-verification") {
    return (
      <div className="min-h-screen flex">
        <div className="hidden md:flex flex-1 bg-gradient-to-br from-orange-400 to-orange-500">
          <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Login-Q1uRkQ6tX8FmAEN0XCpOshfCn9X6qw.png" alt="Sellah Logo" className="w-full object-cover" />
        </div>
        <div className="flex-1 flex items-center justify-center bg-white p-8">
          <div className="w-full max-w-md text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-3xl font-bold text-red-500 mb-4">Registration Complete!</h1>
              <p className="text-gray-600 mb-4">Your account and company information have been successfully saved.</p>
              <p className="text-gray-600 mb-6">
                We've sent a verification link to <strong>{registrationResult?.email || userData.email}</strong>. Please
                check your email and click the verification link to activate your account.
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Didn't receive the email? Check your spam folder or click the button below to resend.
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <Button
                onClick={handleCheckVerification}
                className="w-full h-12 bg-green-500 hover:bg-green-600 text-white"
                disabled={checkingVerification}
              >
                {checkingVerification ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    I've Verified My Email
                  </>
                )}
              </Button>

              <Button
                onClick={handleResendEmail}
                variant="outline"
                className="w-full h-12 border-red-500 text-red-500 hover:bg-red-50 bg-transparent"
                disabled={resendLoading}
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>

              <Button
                onClick={() => router.push("/login")}
                variant="ghost"
                className="w-full h-12 text-gray-600 hover:text-gray-800"
              >
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === "company") {
    return (
      <div className="min-h-screen flex">
        {/* Left side - Sellah Branding */}
        <div className="hidden md:flex flex-1 bg-gradient-to-br from-orange-400 to-orange-500">
          <img src="/images/login-design.png" alt="Sellah Logo" className="w-full h-full object-cover" />
        </div>

        {/* Right side - Company Form */}
        <div className="flex-1 flex items-center justify-center bg-white p-4 md:p-8">
          <div className="w-full max-w-md px-4 md:px-0">
            <div className="flex items-center justify-between mb-6">
              <Button
                onClick={() => setStep("personal")}
                variant="ghost"
                className="p-0 h-auto text-gray-600 hover:text-gray-800"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Back
              </Button>

              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
              </div>
            </div>

            <div className="flex items-center mb-8">
              <Building2 className="w-8 h-8 text-red-500 mr-3" />
              <h1 className="text-3xl font-bold text-red-500">Company Information</h1>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleCompleteRegistration} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Company Name"
                  value={companyData.name}
                  onChange={handleCompanyInputChange}
                  className="h-12 border-gray-300 rounded-lg mt-1"
                  required
                />
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700">
                  Company Location <span className="text-red-500">*</span>
                </Label>

                <div>
                  <Input
                    type="text"
                    name="address.street"
                    placeholder="Street Address"
                    value={companyData.address.street}
                    onChange={handleCompanyInputChange}
                    className="h-12 border-gray-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="text"
                      name="address.city"
                      placeholder="City *"
                      value={companyData.address.city}
                      onChange={handleCompanyInputChange}
                      className="h-12 border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="text"
                      name="address.province"
                      placeholder="Province *"
                      value={companyData.address.province}
                      onChange={handleCompanyInputChange}
                      className="h-12 border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="website" className="text-sm font-medium text-gray-700">
                  Website (Optional)
                </Label>
                <Input
                  id="website"
                  type="url"
                  name="website"
                  placeholder="https://example.com"
                  value={companyData.website}
                  onChange={handleCompanyInputChange}
                  className="h-12 border-gray-300 rounded-lg mt-1"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg mt-6"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Complete Registration <ChevronRight className="w-5 h-5 ml-1" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Sellah Branding */}
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-orange-400 to-orange-500">
        <img src="/images/login-design.png" alt="Sellah Logo" className="w-full h-full object-cover" />
      </div>

      {/* Right side - Registration Form */}
      <div className="flex-1 flex items-center justify-center bg-white p-4 md:p-8">
        <div className="w-full max-w-md px-4 md:px-0">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="mb-6 p-0 h-auto text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>

          <div className="flex items-center mb-8">
            <User className="w-8 h-8 text-red-500 mr-3" />
            <h1 className="text-3xl font-bold text-red-500">Personal Information</h1>
          </div>

          <div className="flex items-center justify-end mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handlePersonalNext} className="space-y-4">
            <div>
              <Input
                type="text"
                name="first_name"
                placeholder="First Name"
                value={userData.first_name}
                onChange={handleUserInputChange}
                className="h-12 border-gray-300 rounded-lg"
                required
              />
            </div>

            <div>
              <Input
                type="text"
                name="middle_name"
                placeholder="Middle Name"
                value={userData.middle_name}
                onChange={handleUserInputChange}
                className="h-12 border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <Input
                type="text"
                name="last_name"
                placeholder="Last Name"
                value={userData.last_name}
                onChange={handleUserInputChange}
                className="h-12 border-gray-300 rounded-lg"
                required
              />
            </div>

            <div>
              <div className="relative">
                <div className="absolute left-0 top-0 h-12 flex justify-center items-center pl-3 w-12 border-r border-gray-300 bg-gray-50 rounded-l-lg">
                  <span className="text-gray-700 font-medium text-sm">+63</span>
                </div>
                <Input
                  type="text"
                  name="phone_number"
                  placeholder="9XX XXX XXXX"
                  value={userData.phone_number}
                  onChange={(e) => {
                    // Only allow numbers and limit to 10 digits
                    const value = e.target.value.replace(/\D/g, "").slice(0, 10)
                    setUserData((prev) => ({
                      ...prev,
                      phone_number: value,
                    }))
                  }}
                  className="h-12 border-gray-300 rounded-lg pl-16"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Enter your 10-digit phone number without the country code</p>
            </div>

            <div>
              <Input
                type="email"
                name="email"
                placeholder="Email"
                value={userData.email}
                onChange={handleUserInputChange}
                className="h-12 border-gray-300 rounded-lg"
                required
              />
            </div>

            <div>
              <Input
                type="password"
                name="password"
                placeholder="Password"
                value={userData.password}
                onChange={handleUserInputChange}
                className="h-12 border-gray-300 rounded-lg"
                required
              />
            </div>

            <div>
              <Input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 border-gray-300 rounded-lg"
                required
              />
            </div>

            {/* Gender Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Gender:</label>
              <div className="flex space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="Female"
                    checked={userData.gender === "Female"}
                    onChange={() => handleGenderChange("Female")}
                    className="w-4 h-4 text-red-500 border-gray-300 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Female</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="Male"
                    checked={userData.gender === "Male"}
                    onChange={() => handleGenderChange("Male")}
                    className="w-4 h-4 text-red-500 border-gray-300 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Male</span>
                </label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg mt-6"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Checking email...
                </>
              ) : (
                <>
                  Next <ChevronRight className="w-5 h-5 ml-1" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{" "}
            <button
              onClick={() => router.push("/login")}
              className="text-red-500 hover:text-red-600 font-medium underline"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
