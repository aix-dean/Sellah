"use client"

import { Eye, Edit3, Palette, Terminal, Copy, QrCode, Lock, ExternalLink } from "lucide-react"
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
import { useUserData } from "@/hooks/use-user-data"
import { useCompanyData } from "@/hooks/use-company-data"
import { useState } from "react"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function WebsitePage() {
  const { userData } = useUserData()
  const { company } = useCompanyData(userData?.company_id || null)
  const { toast } = useToast()
  const router = useRouter()

  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingTheme, setIsLoadingTheme] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false)
  const [pinInput, setPinInput] = useState("")
  const [confirmPinInput, setConfirmPinInput] = useState("") // Added confirm PIN input state
  const [isPinVerifying, setIsPinVerifying] = useState(false)
  const [isCreatingPin, setIsCreatingPin] = useState(false) // Added PIN creation mode state
  const [isCheckingPin, setIsCheckingPin] = useState(false) // Added PIN checking state

  const [themeColors, setThemeColors] = useState({
    primary: "#3b82f6",
    secondary: "#64748b",
    accent: "#f59e0b",
    button: "#3b82f6",
    buttonText: "#ffffff",
    header: "#1f2937",
    background: "#ffffff",
    text: "#1f2937",
    footerBackground: "#1f2937",
    footerText: "#ffffff",
  })

  const companyId = userData?.company_id || "company"
  const terminalPortalLink = "https://sellah.ph/website/ZxWUmoFXCLnTXJVAOaAA"

  const checkUserHasPin = async (): Promise<boolean> => {
    if (!userData?.uid) return false

    try {
      const userDocRef = doc(db, "iboard_users", userData.uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        const data = userDoc.data()
        return !!(data.pin && data.pin_enabled !== false)
      }
      return false
    } catch (error) {
      console.error("Error checking user PIN:", error)
      return false
    }
  }

  const createUserPin = async (pin: string): Promise<boolean> => {
    if (!userData?.uid) return false

    try {
      const userDocRef = doc(db, "iboard_users", userData.uid)
      await updateDoc(userDocRef, {
        pin: pin, // In production, this should be hashed
        pin_enabled: true,
        pin_created_at: new Date(),
        updated_at: new Date(),
      })
      return true
    } catch (error) {
      console.error("Error creating user PIN:", error)
      return false
    }
  }

  const verifyUserPin = async (pin: string): Promise<boolean> => {
    if (!userData?.uid) return false

    try {
      const userDocRef = doc(db, "iboard_users", userData.uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        const data = userDoc.data()
        return data.pin === pin && data.pin_enabled !== false
      }
      return false
    } catch (error) {
      console.error("Error verifying user PIN:", error)
      return false
    }
  }

  const handlePinSubmit = async () => {
    if (!pinInput.trim()) {
      toast({
        title: "PIN Required",
        description: isCreatingPin ? "Please enter a PIN to create" : "Please enter your PIN to continue",
        variant: "destructive",
      })
      return
    }

    if (isCreatingPin) {
      // PIN Creation Mode
      if (pinInput.length < 4) {
        toast({
          title: "PIN Too Short",
          description: "PIN must be at least 4 characters long",
          variant: "destructive",
        })
        return
      }

      if (!confirmPinInput.trim()) {
        toast({
          title: "Confirm PIN Required",
          description: "Please confirm your PIN",
          variant: "destructive",
        })
        return
      }

      if (pinInput !== confirmPinInput) {
        toast({
          title: "PINs Don't Match",
          description: "Please make sure both PINs match",
          variant: "destructive",
        })
        return
      }

      setIsPinVerifying(true)

      const success = await createUserPin(pinInput)

      if (success) {
        setIsPinDialogOpen(false)
        setPinInput("")
        setConfirmPinInput("")
        setIsCreatingPin(false)
        router.push(`/website/edit/${companyId}`)
        toast({
          title: "PIN Created Successfully",
          description: "Your PIN has been created. Redirecting to content editor...",
        })
      } else {
        toast({
          title: "Error Creating PIN",
          description: "Failed to create PIN. Please try again.",
          variant: "destructive",
        })
      }

      setIsPinVerifying(false)
    } else {
      // PIN Verification Mode
      setIsPinVerifying(true)

      const isValid = await verifyUserPin(pinInput)

      if (isValid) {
        setIsPinDialogOpen(false)
        setPinInput("")
        router.push(`/website/edit/${companyId}`)
        toast({
          title: "Access Granted",
          description: "Redirecting to content editor...",
        })
      } else {
        toast({
          title: "Invalid PIN",
          description: "Please check your PIN and try again",
          variant: "destructive",
        })
      }

      setIsPinVerifying(false)
    }
  }

  const handleEditContentClick = async () => {
    setIsCheckingPin(true)

    const hasPin = await checkUserHasPin()

    setIsCreatingPin(!hasPin)
    setIsPinDialogOpen(true)
    setPinInput("")
    setConfirmPinInput("")
    setIsCheckingPin(false)
  }

  const copyLinkToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(terminalPortalLink)
      toast({
        title: "Link Copied",
        description: "Terminal Portal link has been copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      })
    }
  }

  const generateQRCode = () => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(terminalPortalLink)}`
  }

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
        description: "Your terminal theme has been successfully updated",
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Terminal className="w-8 h-8 text-blue-600" />
                </div>
                Central Terminal
              </h1>
              <p className="text-gray-600 text-lg">Manage your online presence and terminal settings</p>
            </div>
          </div>

          {/* Website Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="hover:shadow-md transition-shadow border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-1.5 bg-green-100 rounded-md">
                    <Eye className="w-4 h-4 text-green-600" />
                  </div>
                  Terminal Status
                </CardTitle>
                <CardDescription className="text-sm">Your terminal is live and accessible</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-green-700">Active</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:bg-green-50 hover:border-green-200 bg-transparent"
                    onClick={() => router.push("/website/ZxWUmoFXCLnTXJVAOaAA")}
                  >
                    <ExternalLink className="w-3 h-3 mr-2" />
                    View Terminal
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-1.5 bg-purple-100 rounded-md">
                    <Edit3 className="w-4 h-4 text-purple-600" />
                  </div>
                  Content Editor
                </CardTitle>
                <CardDescription className="text-sm">Edit your terminal content</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full hover:bg-purple-50 hover:border-purple-200 bg-transparent"
                  onClick={handleEditContentClick}
                  disabled={isCheckingPin}
                >
                  <Lock className="w-3 h-3 mr-2" />
                  {isCheckingPin ? "Checking..." : "Edit Content"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Terminal Portal */}
          <Card className="shadow-sm border-0 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Terminal className="w-6 h-6 text-orange-600" />
                </div>
                Terminal Portal
              </CardTitle>
              <CardDescription>Access your terminal portal and share with others</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border max-w-md flex-shrink-0">
                  <div className="text-sm text-gray-600 break-all font-mono">{terminalPortalLink}</div>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={copyLinkToClipboard}
                    className="flex items-center gap-2 hover:bg-blue-50 bg-transparent"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowQRCode(!showQRCode)}
                    className="flex items-center gap-2 hover:bg-orange-50"
                  >
                    <QrCode className="w-4 h-4" />
                    {showQRCode ? "Hide QR Code" : "Show QR Code"}
                  </Button>
                </div>
              </div>
              {/* </CHANGE> */}
              {showQRCode && (
                <div className="flex justify-center pt-4">
                  <div className="p-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
                    <img
                      src={generateQRCode() || "/placeholder.svg"}
                      alt="Terminal Portal QR Code"
                      className="w-48 h-48 rounded-lg"
                    />
                    <p className="text-center text-sm text-gray-600 mt-3">Scan to access Terminal Portal</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-xl">Quick Actions</CardTitle>
              <CardDescription>Common terminal management tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={handleOpenThemeDialog}
                  className="flex items-center gap-2 h-11 hover:bg-purple-50 hover:border-purple-200 bg-transparent"
                >
                  <Palette className="w-4 h-4" />
                  Update Terminal Theme
                </Button>
                <Button variant="outline" className="opacity-50 cursor-not-allowed h-11 bg-transparent" disabled>
                  Manage Pages
                </Button>
                <Button variant="outline" className="opacity-50 cursor-not-allowed h-11 bg-transparent" disabled>
                  Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-600" />
              {isCreatingPin ? "Create PIN" : "Enter PIN to Continue"}
            </DialogTitle>
            <DialogDescription>
              {isCreatingPin
                ? "Create a secure PIN to protect access to your content editor."
                : "Please enter your PIN to access the content editor."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">{isCreatingPin ? "New PIN" : "PIN"}</Label>
              <Input
                id="pin"
                type="password"
                placeholder={isCreatingPin ? "Create a PIN (min 4 characters)" : "Enter your PIN"}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (!isCreatingPin || confirmPinInput)) {
                    handlePinSubmit()
                  }
                }}
                className="text-center text-lg tracking-widest"
                maxLength={6}
                autoFocus
              />
            </div>

            {isCreatingPin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPin">Confirm PIN</Label>
                <Input
                  id="confirmPin"
                  type="password"
                  placeholder="Confirm your PIN"
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handlePinSubmit()
                    }
                  }}
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPinDialogOpen(false)} disabled={isPinVerifying}>
              Cancel
            </Button>
            <Button
              onClick={handlePinSubmit}
              disabled={isPinVerifying || !pinInput.trim() || (isCreatingPin && !confirmPinInput.trim())}
            >
              {isPinVerifying
                ? isCreatingPin
                  ? "Creating..."
                  : "Verifying..."
                : isCreatingPin
                  ? "Create PIN"
                  : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Theme Dialog */}
      <Dialog open={isThemeDialogOpen} onOpenChange={setIsThemeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Update Terminal Theme
            </DialogTitle>
            <DialogDescription>
              Customize your terminal colors. Changes will be applied to your live terminal.
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
