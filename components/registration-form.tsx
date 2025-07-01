"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Eye, EyeOff, ArrowLeft, ArrowRight, CheckCircle, Mail, Loader2 } from "lucide-react"
import { registerUser, type RegistrationData } from "@/lib/auth"
import Link from "next/link"

export default function RegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [licenseKey, setLicenseKey] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<RegistrationData>({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
    companyName: "",
    phoneNumber: "",
    street: "",
    city: "",
    province: "",
  })

  const [confirmPassword, setConfirmPassword] = useState("")

  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handlePhoneChange = (value: string) => {
    // Remove any non-digit characters
    const digits = value.replace(/\D/g, "")

    // Ensure it starts with 9 and limit to 10 digits
    if (digits.length === 0 || digits[0] === "9") {
      const limitedDigits = digits.slice(0, 10)
      handleInputChange("phoneNumber", limitedDigits)
    }
  }

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required"
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required"
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required"
    } else if (formData.phoneNumber.length !== 10) {
      newErrors.phoneNumber = "Phone number must be exactly 10 digits"
    } else if (!formData.phoneNumber.startsWith("9")) {
      newErrors.phoneNumber = "Phone number must start with 9"
    }

    if (!formData.street.trim()) {
      newErrors.street = "Street address is required"
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required"
    }

    if (!formData.province.trim()) {
      newErrors.province = "Province is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2)
    }
  }

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep2()) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      // Add +63 prefix to phone number
      const registrationData = {
        ...formData,
        phoneNumber: `+63${formData.phoneNumber}`,
      }

      const result = await registerUser(registrationData)

      if (result.success) {
        setLicenseKey(result.licenseKey || "")
        setRegistrationComplete(true)
      } else {
        setErrors({ submit: result.error || "Registration failed. Please try again." })
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      setErrors({ submit: error.message || "Registration failed. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  if (registrationComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">Registration Successful!</CardTitle>
            <CardDescription>
              Your account has been created successfully. Please check your email to verify your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Your License Key:</h3>
              <code className="bg-white px-3 py-2 rounded border text-sm font-mono block text-center break-all">
                {licenseKey}
              </code>
              <p className="text-xs text-blue-700 mt-2">
                Please save this license key. You'll need it for your account.
              </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-2 mb-2">
                <Mail className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-900">Email Verification Required</h3>
              </div>
              <p className="text-sm text-yellow-800">
                We've sent a verification email to <strong>{formData.email}</strong>. Please click the verification link
                in your email before signing in.
              </p>
            </div>

            <Link href="/login" className="w-full">
              <Button className="w-full bg-red-500 hover:bg-red-600">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-xl text-red-500">SELLAH</span>
          </div>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            Step {currentStep} of 2: {currentStep === 1 ? "Personal Information" : "Company Details"}
          </CardDescription>
          <Progress value={(currentStep / 2) * 100} className="mt-4" />
        </CardHeader>

        <CardContent>
          <form
            onSubmit={
              currentStep === 2
                ? handleSubmit
                : (e) => {
                    e.preventDefault()
                    handleNext()
                  }
            }
          >
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className={errors.firstName ? "border-red-500" : ""}
                      placeholder="John"
                    />
                    {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className={errors.lastName ? "border-red-500" : ""}
                      placeholder="Doe"
                    />
                    {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    type="text"
                    value={formData.middleName}
                    onChange={(e) => handleInputChange("middleName", e.target.value)}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={errors.email ? "border-red-500" : ""}
                    placeholder="john@example.com"
                  />
                  {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>}
                </div>

                <Button type="submit" className="w-full bg-red-500 hover:bg-red-600">
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    className={errors.companyName ? "border-red-500" : ""}
                    placeholder="Your Company Name"
                  />
                  {errors.companyName && <p className="text-sm text-red-500 mt-1">{errors.companyName}</p>}
                </div>

                <div>
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <div className="flex">
                    <div className="flex items-center px-3 bg-gray-100 border border-r-0 rounded-l-md">
                      <span className="text-sm font-medium">+63</span>
                    </div>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className={`rounded-l-none ${errors.phoneNumber ? "border-red-500" : ""}`}
                      placeholder="9XXXXXXXXX"
                      maxLength={10}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Must start with 9 and be 10 digits long</p>
                  {errors.phoneNumber && <p className="text-sm text-red-500 mt-1">{errors.phoneNumber}</p>}
                </div>

                <div>
                  <Label htmlFor="street">Street Address *</Label>
                  <Input
                    id="street"
                    type="text"
                    value={formData.street}
                    onChange={(e) => handleInputChange("street", e.target.value)}
                    className={errors.street ? "border-red-500" : ""}
                    placeholder="123 Main Street"
                  />
                  {errors.street && <p className="text-sm text-red-500 mt-1">{errors.street}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      className={errors.city ? "border-red-500" : ""}
                      placeholder="Manila"
                    />
                    {errors.city && <p className="text-sm text-red-500 mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <Label htmlFor="province">Province *</Label>
                    <Input
                      id="province"
                      type="text"
                      value={formData.province}
                      onChange={(e) => handleInputChange("province", e.target.value)}
                      className={errors.province ? "border-red-500" : ""}
                      placeholder="Metro Manila"
                    />
                    {errors.province && <p className="text-sm text-red-500 mt-1">{errors.province}</p>}
                  </div>
                </div>

                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">{errors.submit}</p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button type="button" variant="outline" onClick={handleBack} className="flex-1 bg-transparent">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1 bg-red-500 hover:bg-red-600">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-red-500 hover:text-red-600">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
