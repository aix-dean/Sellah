"use client"

import { Globe, Settings, Eye, Edit3, ExternalLink, ArrowLeft, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useUserData } from "@/hooks/use-user-data"
import { useCompanyData } from "@/hooks/use-company-data"
import { useState } from "react"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"

export default function WebsitePage() {
  const { userData } = useUserData()
  const { company } = useCompanyData(userData?.company_id || null)
  const { toast } = useToast()

  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingTheme, setIsLoadingTheme] = useState(false)
  const [themeColors, setThemeColors] = useState({
    primary: "#3b82f6",
    secondary: "#64748b",
    accent: "#f59e0b",
    button: "#3b82f6",
    buttonText: "#ffffff", // Added button text color
    header: "#1f2937",
    background: "#ffffff",
    text: "#1f2937",
    footerBackground: "#1f2937",
    footerText: "#ffffff",
  })

  const companyId = userData?.company_id || "company"

  const loadExistingTheme = async () => {
    if (!userData?.company_id) return

    setIsLoadingTheme(true)
    try {
      const companyDocRef = doc(db, "companies", userData.company_id)
      const companyDoc = await getDoc(companyDocRef)

      if (companyDoc.exists()) {
        const companyData = companyDoc.data()
        const theme = companyData.theme

        if (theme) {
          setThemeColors({
            primary: theme.primaryColor || "#3b82f6",
            secondary: theme.secondaryColor || "#64748b",
            accent: theme.accentColor || "#f59e0b",
            button: theme.buttonColor || "#3b82f6",
            buttonText: theme.buttonTextColor || "#ffffff",
            header: theme.headerColor || "#1f2937",
            background: theme.backgroundColor || "#ffffff",
            text: theme.textColor || "#1f2937",
            footerBackground: theme.footerBackgroundColor || "#1f2937",
            footerText: theme.footerTextColor || "#ffffff",
          })
        }
      }
    } catch (error) {
      console.error("Error loading existing theme:", error)
      toast({
        title: "Warning",
        description: "Could not load existing theme colors. Using defaults.",
        variant: "default",
      })
    } finally {
      setIsLoadingTheme(false)
    }
  }

  const handleOpenThemeDialog = () => {
    setIsThemeDialogOpen(true)
    loadExistingTheme()
  }

  const handleSaveTheme = async () => {
    if (!userData?.company_id) {
      toast({
        title: "Error",
        description: "Company information not found",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const companyDocRef = doc(db, "companies", userData.company_id)

      const themeData = {
        theme: {
          primaryColor: themeColors.primary,
          secondaryColor: themeColors.secondary,
          accentColor: themeColors.accent,
          buttonColor: themeColors.button,
          buttonTextColor: themeColors.buttonText,
          headerColor: themeColors.header,
          backgroundColor: themeColors.background,
          textColor: themeColors.text,
          footerBackgroundColor: themeColors.footerBackground,
          footerTextColor: themeColors.footerText,
        },
        updatedAt: new Date(),
      }

      await updateDoc(companyDocRef, themeData)

      toast({
        title: "Theme Updated",
        description: "Your website theme has been successfully updated",
      })

      setIsThemeDialogOpen(false)
    } catch (error) {
      console.error("Error saving theme:", error)
      toast({
        title: "Error",
        description: "Failed to update theme. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleColorChange = (colorKey: string, value: string) => {
    setThemeColors((prev) => ({
      ...prev,
      [colorKey]: value,
    }))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <Link href="/dashboard/products">
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Products
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Globe className="w-8 h-8 text-blue-500" />
              Website Management
            </h1>
            <p className="text-gray-600 mt-2">Manage your online presence and website settings</p>
          </div>
        </div>

        {/* Website Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-500" />
                Website Status
              </CardTitle>
              <CardDescription>Your website is live and accessible</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-500" />
                Configuration
              </CardTitle>
              <CardDescription>Customize your website settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-transparent opacity-50 cursor-not-allowed"
                disabled
              >
                Configure Settings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-purple-500" />
                Content Editor
              </CardTitle>
              <CardDescription>Edit your website content</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/website/edit/${companyId}`}>
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  Edit Content
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common website management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href={`/website/${companyId}`} target="_blank">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white w-full flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  View Website
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={handleOpenThemeDialog}
                className="flex items-center gap-2 bg-transparent"
              >
                <Palette className="w-4 h-4" />
                Update Theme
              </Button>
              <Button variant="outline" className="opacity-50 cursor-not-allowed bg-transparent" disabled>
                Manage Pages
              </Button>
              <Button variant="outline" className="opacity-50 cursor-not-allowed bg-transparent" disabled>
                Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isThemeDialogOpen} onOpenChange={setIsThemeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Update Website Theme
            </DialogTitle>
            <DialogDescription>
              Customize your website colors. Changes will be applied to your live website.
            </DialogDescription>
          </DialogHeader>

          {isLoadingTheme ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">Loading current theme...</span>
            </div>
          ) : (
            <div className="grid gap-6 py-4">
              <div className="grid gap-4">
                {/* Brand Colors Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 border-b pb-1">Brand Colors</h4>

                  <div className="grid gap-2">
                    <Label htmlFor="primary">Primary Color</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="primary"
                        type="color"
                        value={themeColors.primary}
                        onChange={(e) => handleColorChange("primary", e.target.value)}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        type="text"
                        value={themeColors.primary}
                        onChange={(e) => handleColorChange("primary", e.target.value)}
                        className="flex-1"
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="secondary">Secondary Color</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="secondary"
                        type="color"
                        value={themeColors.secondary}
                        onChange={(e) => handleColorChange("secondary", e.target.value)}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        type="text"
                        value={themeColors.secondary}
                        onChange={(e) => handleColorChange("secondary", e.target.value)}
                        className="flex-1"
                        placeholder="#64748b"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="accent">Accent Color</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="accent"
                        type="color"
                        value={themeColors.accent}
                        onChange={(e) => handleColorChange("accent", e.target.value)}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        type="text"
                        value={themeColors.accent}
                        onChange={(e) => handleColorChange("accent", e.target.value)}
                        className="flex-1"
                        placeholder="#f59e0b"
                      />
                    </div>
                  </div>
                </div>

                {/* Button Colors Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 border-b pb-1">Button Colors</h4>

                  <div className="grid gap-2">
                    <Label htmlFor="button">Button Color</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="button"
                        type="color"
                        value={themeColors.button}
                        onChange={(e) => handleColorChange("button", e.target.value)}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        type="text"
                        value={themeColors.button}
                        onChange={(e) => handleColorChange("button", e.target.value)}
                        className="flex-1"
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="buttonText">Button Text Color</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="buttonText"
                        type="color"
                        value={themeColors.buttonText}
                        onChange={(e) => handleColorChange("buttonText", e.target.value)}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        type="text"
                        value={themeColors.buttonText}
                        onChange={(e) => handleColorChange("buttonText", e.target.value)}
                        className="flex-1"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>

                {/* Layout Colors Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 border-b pb-1">Layout Colors</h4>

                  <div className="grid gap-2">
                    <Label htmlFor="header">Header Color</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="header"
                        type="color"
                        value={themeColors.header}
                        onChange={(e) => handleColorChange("header", e.target.value)}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        type="text"
                        value={themeColors.header}
                        onChange={(e) => handleColorChange("header", e.target.value)}
                        className="flex-1"
                        placeholder="#1f2937"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="footerBackground">Footer Background Color</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="footerBackground"
                        type="color"
                        value={themeColors.footerBackground}
                        onChange={(e) => handleColorChange("footerBackground", e.target.value)}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        type="text"
                        value={themeColors.footerBackground}
                        onChange={(e) => handleColorChange("footerBackground", e.target.value)}
                        className="flex-1"
                        placeholder="#1f2937"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="footerText">Footer Text Color</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="footerText"
                        type="color"
                        value={themeColors.footerText}
                        onChange={(e) => handleColorChange("footerText", e.target.value)}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        type="text"
                        value={themeColors.footerText}
                        onChange={(e) => handleColorChange("footerText", e.target.value)}
                        className="flex-1"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="background">Background Color</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="background"
                        type="color"
                        value={themeColors.background}
                        onChange={(e) => handleColorChange("background", e.target.value)}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        type="text"
                        value={themeColors.background}
                        onChange={(e) => handleColorChange("background", e.target.value)}
                        className="flex-1"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="text">Text Color</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="text"
                        type="color"
                        value={themeColors.text}
                        onChange={(e) => handleColorChange("text", e.target.value)}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        type="text"
                        value={themeColors.text}
                        onChange={(e) => handleColorChange("text", e.target.value)}
                        className="flex-1"
                        placeholder="#1f2937"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsThemeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTheme} disabled={isSaving || isLoadingTheme}>
              {isSaving ? "Saving..." : "Save Theme"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
