"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { User, Building2, Camera, Edit3, Save, X, CheckCircle, AlertCircle, Calendar, Hash,  ArrowLeft } from "lucide-react"
import { useUserData } from "@/hooks/use-user-data"
import { useCompanyData } from "@/hooks/use-company-data"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"


interface PersonalInfo {
  first_name: string
  middle_name: string
  last_name: string
  email: string
  phone_number: string
}

interface CompanyInfo {
  name: string
  position: string
  street: string
  city: string
  province: string
  phone: string
}

export default function AccountPage() {
  const { userData, loading, error } = useUserData()
  const { company, loading: companyLoading } = useCompanyData(userData?.company_id || null)
  const router = useRouter()

  // Personal info state
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone_number: "",
  })
  const [editingPersonal, setEditingPersonal] = useState(false)
  const [savingPersonal, setSavingPersonal] = useState(false)

  // Company info state
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: "",
    position: "",
    street: "",
    city: "",
    province: "",
    phone: "",
  })
  const [editingCompany, setEditingCompany] = useState(false)
  const [savingCompany, setSavingCompany] = useState(false)

  // Profile picture state
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Load user data when available
  useEffect(() => {
    if (userData) {
      setPersonalInfo({
        first_name: userData.first_name || "",
        middle_name: userData.middle_name || "",
        last_name: userData.last_name || "",
        email: userData.email || "",
        phone_number: userData.phone_number || "",
      })
    }
  }, [userData])

  // Load company data when available
  useEffect(() => {
    console.log("Company data:", company)
    if (company) {
      setCompanyInfo({
        name: company.name || "",
        street: company.address?.street || "",
        city: company.address?.city || "",
        province: company.address?.province || "",
        position: company.position || "",
      })
    }
  }, [company, userData])

  // Get status badge configuration
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return {
          label: "Verified",
          variant: "default" as const,
          className: "bg-green-500 hover:bg-green-600 text-white",
          icon: CheckCircle,
        }
      case "BASIC":
        return {
          label: "Basic",
          variant: "secondary" as const,
          className: "bg-blue-500 hover:bg-blue-600 text-white",
          icon: AlertCircle,
        }
      case "UNKNOWN":
      default:
        return {
          label: "Unknown",
          variant: "destructive" as const,
          className: "bg-gray-500 hover:bg-gray-600 text-white",
          icon: AlertCircle,
        }
    }
  }

  const handlePersonalSave = async () => {
    if (!userData?.uid) return

    setSavingPersonal(true)
    try {
      const userRef = doc(db, "iboard_users", userData.uid)
      await updateDoc(userRef, {
        first_name: personalInfo.first_name,
        middle_name: personalInfo.middle_name,
        last_name: personalInfo.last_name,
        updated_at: new Date(),
      })

      setEditingPersonal(false)
      toast({
        title: "Success",
        description: "Personal information updated successfully",
      })
    } catch (error) {
      console.error("Error updating personal info:", error)
      toast({
        title: "Error",
        description: "Failed to update personal information",
        variant: "destructive",
      })
    } finally {
      setSavingPersonal(false)
    }
  }

  const handleCompanySave = async () => {
    if (!userData?.uid || !userData?.company_id) return

    setSavingCompany(true)
    try {
      // Update company information
      const companyRef = doc(db, "companies", userData.company_id)
      await updateDoc(companyRef, {
        name: companyInfo.name,
        address: {
          street: companyInfo.street,
          city: companyInfo.city,
          province: companyInfo.province,
        },
        phone: companyInfo.phone,
        updated_at: new Date(),
      })

      // Update user position
      const userRef = doc(db, "iboard_users", userData.uid)
      await updateDoc(userRef, {
        position: companyInfo.position,
        updated_at: new Date(),
      })

      setEditingCompany(false)
      toast({
        title: "Success",
        description: "Company information updated successfully",
      })
    } catch (error) {
      console.error("Error updating company info:", error)
      toast({
        title: "Error",
        description: "Failed to update company information",
        variant: "destructive",
      })
    } finally {
      setSavingCompany(false)
    }
  }

  const handleUpgrade = () => {
    router.push("/dashboard/account/upgrade")
  }

  if (loading || companyLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading account information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Error loading account information</p>
          <p className="text-gray-600 text-sm mt-2">{error}</p>
        </div>
      </div>
    )
  }

  const statusBadge = getStatusBadge(userData?.status || "UNKNOWN")
  const StatusIcon = statusBadge.icon

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-1">Manage your personal and company information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                {/* Profile Picture */}
                <div className="relative">
                  <Avatar className="w-20 h-20 mx-auto">
                    <AvatarImage src={userData?.photo_url || "/placeholder.svg"} alt="Profile" />
                    <AvatarFallback className="text-lg">
                      {userData?.first_name?.[0]}
                      {userData?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute bottom-0 rounded-full w-6 h-6 p-1 bg-transparent"
                    disabled={uploadingPhoto}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>

                {/* User Name */}
                <div>
                  <h3 className="font-semibold text-lg">
                    {userData?.first_name} {userData?.last_name}
                  </h3>
                  <p className="text-gray-600 text-sm">{userData?.email}</p>
                </div>

                {/* Status Badge */}
                <div className="flex justify-center">
                  <Badge className={`${statusBadge.className} flex items-center gap-1`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusBadge.label}
                  </Badge>
                </div>

                {/* Email Verification */}
                {userData?.emailVerified && (
                  <div className="flex items-center justify-center gap-1 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Email Verified
                  </div>
                )}

                <Separator />

                {/* Account Info */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    <span>ID: {userData?.uid?.slice(-8)}</span>
                  </div>
                  {userData?.created_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Joined: {new Date(userData.created_at.seconds * 1000).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Upgrade Button */}
                {userData?.status !== "VERIFIED" && (
                  <Button onClick={handleUpgrade} className="w-full bg-red-500 hover:bg-red-600 text-white">
                    Upgrade Account
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Personal Information
              </TabsTrigger>
              <TabsTrigger value="company" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Company Information
              </TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Personal Information
                    </CardTitle>
                  </div>
                  {!editingPersonal ? (
                    <Button variant="outline" size="sm" onClick={() => setEditingPersonal(true)}>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingPersonal(false)
                          // Reset to original values
                          setPersonalInfo({
                            first_name: userData?.first_name || "",
                            middle_name: userData?.middle_name || "",
                            last_name: userData?.last_name || "",
                            email: userData?.email || "",
                            phone_number: userData?.phone_number || "",
                          })
                        }}
                        disabled={savingPersonal}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handlePersonalSave} disabled={savingPersonal}>
                        <Save className="w-4 h-4 mr-2" />
                        {savingPersonal ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name</Label>
                      {editingPersonal ? (
                        <Input
                          id="first_name"
                          value={personalInfo.first_name}
                          onChange={(e) => setPersonalInfo((prev) => ({ ...prev, first_name: e.target.value }))}
                          placeholder="Enter first name"
                        />
                      ) : (
                        <div className="mt-1 p-2 bg-gray-100 rounded-md min-h-[40px] flex items-center">
                          {personalInfo.first_name || "Not provided"}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="middle_name">Middle Name</Label>
                      {editingPersonal ? (
                        <Input
                          id="middle_name"
                          value={personalInfo.middle_name}
                          onChange={(e) => setPersonalInfo((prev) => ({ ...prev, middle_name: e.target.value }))}
                          placeholder="Enter middle name (optional)"
                        />
                      ) : (
                        <div className="mt-1 p-2 bg-gray-100 rounded-md min-h-[40px] flex items-center">
                          {personalInfo.middle_name || "Not provided"}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="last_name">Last Name</Label>
                      {editingPersonal ? (
                        <Input
                          id="last_name"
                          value={personalInfo.last_name}
                          onChange={(e) => setPersonalInfo((prev) => ({ ...prev, last_name: e.target.value }))}
                          placeholder="Enter last name"
                        />
                      ) : (
                        <div className="mt-1 p-2 bg-gray-100 rounded-md min-h-[40px] flex items-center">
                          {personalInfo.last_name || "Not provided"}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <div className="mt-1 p-2 bg-gray-100 rounded-md min-h-[40px] flex items-center justify-between">
                        <span>{personalInfo.email || "Not provided"}</span>
                        {userData?.emailVerified && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <div className="mt-1 p-2 bg-gray-100 rounded-md min-h-[40px] flex items-center">
                        {personalInfo.phone_number || "Not provided"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Company Information Tab */}
            <TabsContent value="company">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Company Information
                    </CardTitle>
                  </div>
                  {!editingCompany ? (
                    <Button variant="outline" size="sm" onClick={() => setEditingCompany(true)}>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingCompany(false)
                          // Reset to original values
                          if (company) {
                            setCompanyInfo({
                              name: company.name || "",
                              position: userData?.position || "",
                              street: company.address?.street || "",
                              city: company.address?.city || "",
                              province: company.address?.province || "",
                              phone: company.phone || "",
                            })
                          }
                        }}
                        disabled={savingCompany}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleCompanySave} disabled={savingCompany}>
                        <Save className="w-4 h-4 mr-2" />
                        {savingCompany ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company_name">Company Name</Label>
                      {editingCompany ? (
                        <Input
                          id="company_name"
                          value={companyInfo.name}
                          onChange={(e) => setCompanyInfo((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter company name"
                        />
                      ) : (
                        <div className="mt-1 p-2 bg-gray-100 rounded-md min-h-[40px] flex items-center">
                          {companyInfo.name || "Not provided"}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="position">Position</Label>
                      {editingCompany ? (
                        <Input
                          id="position"
                          value={companyInfo.position}
                          onChange={(e) => setCompanyInfo((prev) => ({ ...prev, position: e.target.value }))}
                          placeholder="Enter your position"
                        />
                      ) : (
                        <div className="mt-1 p-2 bg-gray-100 rounded-md min-h-[40px] flex items-center">
                          {companyInfo.position || "Not provided"}
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="street_address">Street Address</Label>
                      {editingCompany ? (
                        <Input
                          id="street_address"
                          value={companyInfo.street}
                          onChange={(e) => setCompanyInfo((prev) => ({ ...prev, street: e.target.value }))}
                          placeholder="Enter street address"
                        />
                      ) : (
                        <div className="mt-1 p-2 bg-gray-100 rounded-md min-h-[40px] flex items-center">
                          {companyInfo.street || "Not provided"}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="city">City</Label>
                      {editingCompany ? (
                        <Input
                          id="city"
                          value={companyInfo.city}
                          onChange={(e) => setCompanyInfo((prev) => ({ ...prev, city: e.target.value }))}
                          placeholder="Enter city"
                        />
                      ) : (
                        <div className="mt-1 p-2 bg-gray-100 rounded-md min-h-[40px] flex items-center">
                          {companyInfo.city || "Not provided"}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="province">Province</Label>
                      {editingCompany ? (
                        <Input
                          id="province"
                          value={companyInfo.province}
                          onChange={(e) => setCompanyInfo((prev) => ({ ...prev, province: e.target.value }))}
                          placeholder="Enter province"
                        />
                      ) : (
                        <div className="mt-1 p-2 bg-gray-100 rounded-md min-h-[40px] flex items-center">
                          {companyInfo.province || "Not provided"}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
