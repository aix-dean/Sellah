"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, User, Building2, Calendar, Shield, ArrowUp } from "lucide-react"
import { useUserData } from "@/hooks/use-user-data"
import { useCompanyData } from "@/hooks/use-company-data"
import { updateUserProfile, updateCompanyProfile, uploadProfileImage } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useAnimatedSuccess } from "@/hooks/use-animated-success"
import { AnimatedSuccessMessage } from "./animated-success-message"
import DashboardLayout from "./dashboard-layout"
import { useRouter } from "next/navigation"

export default function AccountPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { showSuccessAnimation, successMessage, isSuccessVisible, showAnimatedSuccess } = useAnimatedSuccess()

  // User data
  const { currentUser, userData, loading: userLoading, error: userError, refreshUserData } = useUserData()
  const {
    company,
    loading: companyLoading,
    error: companyError,
    refreshCompanyData,
  } = useCompanyData(userData?.company_id || null)

  // Form states
  const [personalForm, setPersonalForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  })

  const [companyForm, setCompanyForm] = useState({
    companyName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phoneNumber: "",
    email: "",
    website: "",
  })

  const [uploading, setUploading] = useState(false)
  const [updating, setUpdating] = useState({ personal: false, company: false })

  // Initialize forms when data loads
  useEffect(() => {
    if (userData) {
      setPersonalForm({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        phoneNumber: userData.phoneNumber || "",
      })
    }
  }, [userData])

  useEffect(() => {
    if (company) {
      setCompanyForm({
        companyName: company.companyName || "",
        address: company.address || "",
        city: company.city || "",
        state: company.state || "",
        zipCode: company.zipCode || "",
        phoneNumber: company.phoneNumber || "",
        email: company.email || "",
        website: company.website || "",
      })
    }
  }, [company])

  // Handle profile image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !currentUser) return

    setUploading(true)
    try {
      const imageUrl = await uploadProfileImage(currentUser.uid, file)
      await refreshUserData()
      showAnimatedSuccess("Profile picture updated successfully!")
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  // Handle personal info update
  const handlePersonalUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    setUpdating({ ...updating, personal: true })
    try {
      await updateUserProfile(currentUser.uid, personalForm)
      await refreshUserData()
      showAnimatedSuccess("Personal information updated successfully!")
    } catch (error) {
      console.error("Error updating personal info:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update personal information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating({ ...updating, personal: false })
    }
  }

  // Handle company info update
  const handleCompanyUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userData?.company_id) return

    setUpdating({ ...updating, company: true })
    try {
      await updateCompanyProfile(userData.company_id, companyForm)
      await refreshCompanyData()
      showAnimatedSuccess("Company information updated successfully!")
    } catch (error) {
      console.error("Error updating company info:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update company information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating({ ...updating, company: false })
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      VERIFIED: { label: "Verified", className: "bg-green-100 text-green-800" },
      INCOMPLETE: { label: "Incomplete", className: "bg-yellow-100 text-yellow-800" },
      UNKNOWN: { label: "Unknown", className: "bg-gray-100 text-gray-800" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: "bg-gray-100 text-gray-800",
    }

    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (error) {
      return "Invalid Date"
    }
  }

  const loading = userLoading || companyLoading

  if (userError) {
    return (
      <DashboardLayout activeItem="account">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Error</h3>
            <p className="text-gray-500 mb-4">{userError}</p>
            <Button onClick={() => (window.location.href = "/login")}>Go to Login</Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout activeItem="account">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading account information...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout activeItem="account">
      <div className="min-h-screen bg-gray-50">
        {/* Animated Success Message */}
        <AnimatedSuccessMessage show={showSuccessAnimation} message={successMessage} isVisible={isSuccessVisible} />

        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
                <p className="text-gray-500 mt-1">Manage your personal and business information</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar */}
              <div className="lg:col-span-1">
                <Card>
                  <CardContent className="p-6">
                    {/* Profile Section */}
                    <div className="text-center mb-6">
                      <div className="relative inline-block">
                        <Avatar className="w-20 h-20 mx-auto">
                          <AvatarImage
                            src={userData?.profileImageUrl || "/placeholder.svg"}
                            alt={userData?.firstName || "User"}
                          />
                          <AvatarFallback className="text-lg">
                            {userData?.firstName?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <label
                          htmlFor="profile-upload"
                          className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1.5 cursor-pointer hover:bg-blue-700 transition-colors"
                        >
                          <Camera className="w-3 h-3" />
                        </label>
                        <input
                          id="profile-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </div>
                      {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
                    </div>

                    <div className="text-center mb-6">
                      <h3 className="font-medium text-gray-900">
                        {userData?.firstName} {userData?.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">{userData?.email}</p>
                      <div className="mt-2">{getStatusBadge(userData?.status || "UNKNOWN")}</div>
                    </div>

                    <Separator className="my-4" />

                    {/* Account Actions */}
                    <div className="space-y-2">
                      {userData?.status === "UNKNOWN" && (
                        <Button
                          onClick={() => router.push("/dashboard/account/upgrade")}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <ArrowUp className="w-4 h-4 mr-2" />
                          Upgrade Account
                        </Button>
                      )}
                    </div>

                    <Separator className="my-4" />

                    {/* Account Info */}
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {formatDate(userData?.createdAt)}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Shield className="w-4 h-4" />
                        <span>Account ID: {userData?.uid?.slice(-8) || "N/A"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3">
                <Tabs defaultValue="personal" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="personal" className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Personal Info</span>
                    </TabsTrigger>
                    <TabsTrigger value="company" className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4" />
                      <span>Company Info</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Personal Information Tab */}
                  <TabsContent value="personal">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <User className="w-5 h-5" />
                          <span>Personal Information</span>
                        </CardTitle>
                        <CardDescription>Update your personal details and contact information.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handlePersonalUpdate} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="firstName">First Name</Label>
                              <Input
                                id="firstName"
                                value={personalForm.firstName}
                                onChange={(e) => setPersonalForm({ ...personalForm, firstName: e.target.value })}
                                placeholder="Enter your first name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="lastName">Last Name</Label>
                              <Input
                                id="lastName"
                                value={personalForm.lastName}
                                onChange={(e) => setPersonalForm({ ...personalForm, lastName: e.target.value })}
                                placeholder="Enter your last name"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              id="email"
                              type="email"
                              value={personalForm.email}
                              onChange={(e) => setPersonalForm({ ...personalForm, email: e.target.value })}
                              placeholder="Enter your email address"
                            />
                          </div>

                          <div>
                            <Label htmlFor="phoneNumber">Phone Number</Label>
                            <Input
                              id="phoneNumber"
                              value={personalForm.phoneNumber}
                              onChange={(e) => setPersonalForm({ ...personalForm, phoneNumber: e.target.value })}
                              placeholder="Enter your phone number"
                            />
                          </div>

                          <Button type="submit" disabled={updating.personal} className="w-full sm:w-auto">
                            {updating.personal ? "Updating..." : "Update Personal Info"}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Company Information Tab */}
                  <TabsContent value="company">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Building2 className="w-5 h-5" />
                          <span>Company Information</span>
                        </CardTitle>
                        <CardDescription>Manage your business details and contact information.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {companyError ? (
                          <div className="text-center py-8">
                            <p className="text-red-500 mb-4">Error loading company data: {companyError}</p>
                            <Button onClick={refreshCompanyData}>Retry</Button>
                          </div>
                        ) : (
                          <form onSubmit={handleCompanyUpdate} className="space-y-4">
                            <div>
                              <Label htmlFor="companyName">Company Name</Label>
                              <Input
                                id="companyName"
                                value={companyForm.companyName}
                                onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                                placeholder="Enter company name"
                              />
                            </div>

                            <div>
                              <Label htmlFor="address">Address</Label>
                              <Input
                                id="address"
                                value={companyForm.address}
                                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                                placeholder="Enter street address"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <Label htmlFor="city">City</Label>
                                <Input
                                  id="city"
                                  value={companyForm.city}
                                  onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                                  placeholder="Enter city"
                                />
                              </div>
                              <div>
                                <Label htmlFor="state">State</Label>
                                <Input
                                  id="state"
                                  value={companyForm.state}
                                  onChange={(e) => setCompanyForm({ ...companyForm, state: e.target.value })}
                                  placeholder="Enter state"
                                />
                              </div>
                              <div>
                                <Label htmlFor="zipCode">ZIP Code</Label>
                                <Input
                                  id="zipCode"
                                  value={companyForm.zipCode}
                                  onChange={(e) => setCompanyForm({ ...companyForm, zipCode: e.target.value })}
                                  placeholder="Enter ZIP code"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="companyPhone">Phone Number</Label>
                                <Input
                                  id="companyPhone"
                                  value={companyForm.phoneNumber}
                                  onChange={(e) => setCompanyForm({ ...companyForm, phoneNumber: e.target.value })}
                                  placeholder="Enter company phone"
                                />
                              </div>
                              <div>
                                <Label htmlFor="companyEmail">Email Address</Label>
                                <Input
                                  id="companyEmail"
                                  type="email"
                                  value={companyForm.email}
                                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                                  placeholder="Enter company email"
                                />
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="website">Website</Label>
                              <Input
                                id="website"
                                value={companyForm.website}
                                onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                                placeholder="Enter company website"
                              />
                            </div>

                            <Button type="submit" disabled={updating.company} className="w-full sm:w-auto">
                              {updating.company ? "Updating..." : "Update Company Info"}
                            </Button>
                          </form>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
