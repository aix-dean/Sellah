"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Edit3, Save, Upload, ImageIcon, Palette, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

import ApplicationTabs from "@/components/ApplicationTabs"

interface CompanyData {
  name: string
  description: string
  logo?: string
  theme?: {
    primaryColor: string
    secondaryColor: string
    accentColor: string
    buttonColor: string
    buttonTextColor: string
    headerColor: string
    backgroundColor: string
    textColor: string
    footerBackgroundColor: string
    footerTextColor: string
    navColor?: string
  }
  web_config?: {
    theme?: {
      headerColor: string
      navColor?: string
    }
    heroVideoUrl?: string
    heroContent?: {
      mainHeading: string
      subtitle: string
      mainHeadingColor: string
      subtitleColor: string
      buttonColor: string
      buttonTextColor: string
      categoryButtonColor: string
      categoryButtonTextColor: string
    }
    applications?: {
      section_description: string
    }
    recentWorks?: {
      backgroundImage: string
      sectionTitle: string
      projectTitle: string
      projectDescription: string
    }
  }
}

interface EditableContent {
  type: "text" | "heading" | "description" | "button"
  content: string
  section: string
  field: string
}

export default function WebsiteEditPage() {
  const params = useParams()
  const slug = params.slug as string
  const { toast } = useToast()

  const [companyData, setCompanyData] = useState<CompanyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editDialog, setEditDialog] = useState<{
    open: boolean
    content: EditableContent | null
  }>({ open: false, content: null })
  const [editValue, setEditValue] = useState("")
  const [logoDialog, setLogoDialog] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [headerColorDialog, setHeaderColorDialog] = useState(false)
  const [headerColor, setHeaderColor] = useState("#1f2937")
  const [headerColorSaving, setHeaderColorSaving] = useState(false)
  const [navColorDialog, setNavColorDialog] = useState(false)
  const [navColor, setNavColor] = useState("#ffffff")
  const [navColorSaving, setNavColorSaving] = useState(false)
  const [heroVideoDialog, setHeroVideoDialog] = useState(false)
  const [heroVideoFile, setHeroVideoFile] = useState<File | null>(null)
  const [heroVideoUploading, setHeroVideoUploading] = useState(false)
  const [heroVideoUrl, setHeroVideoUrl] = useState<string>("")
  const [heroEditDialog, setHeroEditDialog] = useState(false)
  const [heroEditData, setHeroEditData] = useState({
    mainHeading: "Professional LED Solutions",
    subtitle: "Premium LED displays, lighting, and holographic solutions by DOS",
    mainHeadingColor: "#ffffff",
    subtitleColor: "#ffffff",
    buttonColor: "#000000",
    buttonTextColor: "#ffffff",
    categoryButtonColor: "#ffffff20",
    categoryButtonTextColor: "#ffffff",
  })
  const [heroEditSaving, setHeroEditSaving] = useState(false)
  const [recentWorksDialog, setRecentWorksDialog] = useState(false)
  const [recentWorksItems, setRecentWorksItems] = useState([
    {
      id: 1,
      backgroundImage: "/placeholder.svg?height=720&width=1280",
      sectionTitle: "Our Recent Works",
      projectTitle: "Comcast Lobby",
      projectDescription:
        "Comcast lobby project built one of the world's most iconic LED walls and it is a major tourist attraction in Philadelphia. The update of the Unilumin's LED wall and the re-rendering of the content have attracted a lot of attention.",
    },
  ])
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [recentWorksImageFile, setRecentWorksImageFile] = useState<File | null>(null)
  const [recentWorksUploading, setRecentWorksUploading] = useState(false)

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [autoSwipeInterval, setAutoSwipeInterval] = useState<NodeJS.Timeout | null>(null)

  const [carouselNavColors, setCarouselNavColors] = useState({
    buttonColor: "#2563eb", // blue-600
    buttonHoverColor: "#1d4ed8", // blue-700
    iconColor: "#ffffff", // white
    iconHoverColor: "#ffffff", // white
  })

  useEffect(() => {
    const recentWorksItems = companyData?.web_config?.recentWorksItems || [{ id: 1 }]
    if (recentWorksItems.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlideIndex((prev) => (prev + 1) % recentWorksItems.length)
      }, 8000)

      setAutoSwipeInterval(interval)
      return () => clearInterval(interval)
    }
  }, [companyData?.web_config?.recentWorksItems])

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!slug) {
        setLoading(false)
        return
      }

      try {
        console.log("[v0] Fetching company data for slug:", slug)
        const docRef = doc(db, "companies", slug)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data() as CompanyData
          console.log("[v0] Company data loaded:", data)
          setCompanyData(data)
        } else {
          console.log("[v0] No company found with slug:", slug)
          setCompanyData(null)
        }
      } catch (error) {
        console.error("[v0] Error fetching company data:", error)
        toast({
          title: "Error",
          description: "Failed to load company data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCompanyData()
  }, [slug, toast])

  useEffect(() => {
    if (companyData?.web_config?.theme) {
      setHeaderColor(companyData.web_config.theme.headerColor || "#1f2937")
      setNavColor(companyData.web_config.theme.navColor || "#ffffff")
    }
  }, [companyData])

  useEffect(() => {
    if (companyData) {
      if (companyData.web_config?.recentWorksSettings?.carouselNavColors) {
        setCarouselNavColors(companyData.web_config.recentWorksSettings.carouselNavColors)
      }
    }
  }, [companyData])

  const handleElementClick = (content: EditableContent) => {
    setEditValue(content.content)
    setEditDialog({ open: true, content })
  }

  const handleSaveEdit = async () => {
    if (!editDialog.content || !slug) return

    try {
      console.log("[v0] Saving edit with data:", {
        slug,
        section: editDialog.content.section,
        field: editDialog.content.field,
        editValue,
        fullPath: `web_config.${editDialog.content.section}.${editDialog.content.field}`,
      })

      const docRef = doc(db, "companies", slug)
      const updateData = {
        [`web_config.${editDialog.content.section}.${editDialog.content.field}`]: editValue,
      }

      console.log("[v0] Update data:", updateData)

      await updateDoc(docRef, updateData)

      setCompanyData((prevData) => {
        if (!prevData) return prevData

        const newData = { ...prevData }

        // Create nested structure if it doesn't exist
        if (!newData.web_config) newData.web_config = {}
        if (!newData.web_config[editDialog.content.section]) {
          newData.web_config[editDialog.content.section] = {}
        }

        // Update the specific field
        newData.web_config[editDialog.content.section][editDialog.content.field] = editValue

        console.log("[v0] Updated local state:", newData)
        return newData
      })

      console.log("[v0] Save successful")

      toast({
        title: "Content Updated",
        description: "Your changes have been saved successfully.",
      })
      setEditDialog({ open: false, content: null })
    } catch (error) {
      console.error("[v0] Error saving content:", error)
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleLogoUpload = async () => {
    if (!logoFile || !slug) return

    setLogoUploading(true)
    try {
      // Upload file to Firebase Storage
      const logoRef = ref(storage, `companies/${slug}/logo/${logoFile.name}`)
      await uploadBytes(logoRef, logoFile)
      const logoURL = await getDownloadURL(logoRef)

      // Update company document with new logo URL
      await updateDoc(doc(db, "companies", slug), {
        logo: logoURL,
      })

      // Update local state
      setCompanyData((prev) => (prev ? { ...prev, logo: logoURL } : null))

      toast({
        title: "Logo Updated",
        description: "Your company logo has been updated successfully.",
      })

      setLogoDialog(false)
      setLogoFile(null)
    } catch (error) {
      console.error("Error uploading logo:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLogoUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setLogoFile(file)
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid image file.",
        variant: "destructive",
      })
    }
  }

  const handleSaveHeaderColor = async () => {
    if (!slug) return

    setHeaderColorSaving(true)
    try {
      // Update company document with new header color and nav color in web_config
      await updateDoc(doc(db, "companies", slug), {
        "web_config.theme.headerColor": headerColor,
        "web_config.theme.navColor": navColor,
      })

      // Update local state
      setCompanyData((prev) =>
        prev
          ? {
              ...prev,
              theme: {
                ...prev.theme,
                headerColor: headerColor,
                navColor: navColor,
              },
            }
          : null,
      )

      toast({
        title: "Colors Updated",
        description: "Your header and navigation colors have been updated successfully.",
      })

      setHeaderColorDialog(false)
    } catch (error) {
      console.error("Error updating colors:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update colors. Please try again.",
        variant: "destructive",
      })
    } finally {
      setHeaderColorSaving(false)
    }
  }

  const handleSaveNavColor = async () => {
    if (!slug) return

    setNavColorSaving(true)
    try {
      // Update company document with new nav color in web_config
      await updateDoc(doc(db, "companies", slug), {
        "web_config.theme.navColor": navColor,
      })

      // Update local state
      setCompanyData((prev) =>
        prev
          ? {
              ...prev,
              theme: {
                ...prev.theme,
                navColor: navColor,
              },
            }
          : null,
      )

      toast({
        title: "Nav Color Updated",
        description: "Your navigation text color has been updated successfully.",
      })

      setNavColorDialog(false)
    } catch (error) {
      console.error("Error updating nav color:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update navigation text color. Please try again.",
        variant: "destructive",
      })
    } finally {
      setNavColorSaving(false)
    }
  }

  const handleHeaderClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setHeaderColor(companyData?.web_config?.theme?.headerColor || "#1f2937")
    setHeaderColorDialog(true)
  }

  const handleNavClick = (e: React.MouseEvent) => {
    // Only trigger if clicking on the nav container itself, not the buttons
    if (e.target === e.currentTarget) {
      e.stopPropagation()
      setNavColor(companyData?.web_config?.theme?.navColor || "#ffffff")
      setNavColorDialog(true)
    }
  }

  const handleHeroClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setHeroEditDialog(true)
    // Load current values from companyData
    if (companyData?.web_config) {
      setHeroEditData({
        mainHeading: companyData.web_config.heroContent?.mainHeading || "Professional LED Solutions",
        subtitle:
          companyData.web_config.heroContent?.subtitle ||
          "Premium LED displays, lighting, and holographic solutions by DOS",
        mainHeadingColor: companyData.web_config.heroContent?.mainHeadingColor || "#ffffff",
        subtitleColor: companyData.web_config.heroContent?.subtitleColor || "#ffffff",
        buttonColor: companyData.web_config.heroContent?.buttonColor || "#000000",
        buttonTextColor: companyData.web_config.heroContent?.buttonTextColor || "#ffffff",
        categoryButtonColor: companyData.web_config.heroContent?.categoryButtonColor || "#ffffff20",
        categoryButtonTextColor: companyData.web_config.heroContent?.categoryButtonTextColor || "#ffffff",
      })
    }
  }

  const handleSaveHeroEdit = async () => {
    if (!slug) {
      console.log("[v0] No company ID found in slug parameter")
      return
    }

    setHeroEditSaving(true)
    try {
      console.log("[v0] Saving hero edit data:", heroEditData)
      console.log("[v0] Company ID from slug:", slug)

      const companyRef = doc(db, "companies", slug)
      await updateDoc(companyRef, {
        "web_config.heroContent": heroEditData,
      })

      console.log("[v0] Successfully saved to Firebase")

      // Update local state
      setCompanyData((prev) =>
        prev
          ? {
              ...prev,
              web_config: {
                ...prev.web_config,
                heroContent: heroEditData,
              },
            }
          : null,
      )

      console.log("[v0] Updated local state")

      setHeroEditDialog(false)
      toast({
        title: "Success",
        description: "Hero section updated successfully!",
      })
    } catch (error) {
      console.error("[v0] Error saving hero edit:", error)
      toast({
        title: "Error",
        description: "Failed to save hero section changes.",
        variant: "destructive",
      })
    } finally {
      setHeroEditSaving(false)
    }
  }

  const handleVideoUpload = async () => {
    console.log("[v0] Upload button clicked")
    console.log("[v0] heroVideoFile:", heroVideoFile)
    console.log("[v0] companyData:", companyData)
    console.log("[v0] companyData.id:", companyData?.id || slug)

    if (!heroVideoFile || !companyData) {
      console.log("[v0] Upload cancelled - missing file or company data")
      toast({
        title: "Error",
        description: "Please select a video file and ensure company data is loaded.",
        variant: "destructive",
      })
      return
    }

    setHeroVideoUploading(true)

    try {
      console.log("[v0] Starting upload process...")

      const companyId = slug
      const fileName = `hero-videos/${companyId}/${Date.now()}-${heroVideoFile.name}`
      const videoRef = ref(storage, fileName)

      console.log("[v0] Uploading to:", fileName)

      // Upload the file
      const snapshot = await uploadBytes(videoRef, heroVideoFile)
      console.log("[v0] Upload completed, getting download URL...")

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref)
      console.log("[v0] Download URL:", downloadURL)

      // Update the company's web_config with the video URL
      const companyDocRef = doc(db, "companies", companyId)
      await updateDoc(companyDocRef, {
        "web_config.heroVideoUrl": downloadURL,
      })

      console.log("[v0] Database updated successfully")

      // Update local state
      setCompanyData((prev) =>
        prev
          ? {
              ...prev,
              web_config: {
                ...prev.web_config,
                heroVideoUrl: downloadURL,
              },
            }
          : null,
      )

      // Close dialog and reset state
      setHeroVideoDialog(false)
      setHeroVideoFile(null)

      toast({
        title: "Success",
        description: "Hero background video uploaded successfully!",
      })
    } catch (error) {
      console.error("[v0] Upload error:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      })
    } finally {
      setHeroVideoUploading(false)
    }
  }

  const handleRecentWorksClick = () => {
    const savedItems = companyData?.web_config?.recentWorksItems || [
      {
        id: 1,
        backgroundImage: "/placeholder.svg?height=720&width=1280",
        sectionTitle: "Our Recent Works",
        projectTitle: "Comcast Lobby",
        projectDescription:
          "Comcast lobby project built one of the world's most iconic LED walls and it is a major tourist attraction in Philadelphia. The update of the Unilumin's LED wall and the re-rendering of the content have attracted a lot of attention.",
      },
    ]
    setRecentWorksItems(savedItems)
    setCurrentItemIndex(0)
    setRecentWorksDialog(true)
  }

  const addRecentWorksItem = () => {
    const newItem = {
      id: Date.now(),
      backgroundImage: "/placeholder.svg?height=720&width=1280",
      sectionTitle: "Our Recent Works",
      projectTitle: "New Project",
      projectDescription: "Enter project description here...",
    }
    setRecentWorksItems([...recentWorksItems, newItem])
    setCurrentItemIndex(recentWorksItems.length)
  }

  const removeRecentWorksItem = (index: number) => {
    if (recentWorksItems.length > 1) {
      const newItems = recentWorksItems.filter((_, i) => i !== index)
      setRecentWorksItems(newItems)
      setCurrentItemIndex(Math.min(currentItemIndex, newItems.length - 1))
    }
  }

  const handleRecentWorksImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]
    if (file && (file.type.startsWith("image/") || file.type.startsWith("video/"))) {
      setRecentWorksImageFile(file)
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid image or video file.",
        variant: "destructive",
      })
    }
  }

  const handleSaveRecentWorks = async () => {
    try {
      setRecentWorksUploading(true)
      console.log("[v0] Saving recent works items:", recentWorksItems)

      const updatedItems = [...recentWorksItems]

      // Upload new image/video if selected
      if (recentWorksImageFile) {
        console.log("[v0] Uploading new background media")
        const mediaRef = ref(storage, `companies/${slug}/recent-works/${Date.now()}-${recentWorksImageFile.name}`)
        await uploadBytes(mediaRef, recentWorksImageFile)
        const backgroundMediaUrl = await getDownloadURL(mediaRef)
        console.log("[v0] Media uploaded:", backgroundMediaUrl)

        const isVideo = recentWorksImageFile.type.startsWith("video/")
        updatedItems[currentItemIndex] = {
          ...updatedItems[currentItemIndex],
          backgroundImage: backgroundMediaUrl,
          mediaType: isVideo ? "video" : "image",
        }
      }

      const updateData = {
        ...companyData,
        web_config: {
          ...companyData.web_config,
          recentWorksItems: recentWorksItems,
          recentWorksSettings: {
            ...companyData.web_config?.recentWorksSettings,
            carouselNavColors: carouselNavColors,
          },
        },
      }

      // Update Firebase
      const docRef = doc(db, "companies", slug)
      await updateDoc(docRef, {
        "web_config.recentWorksItems": updatedItems,
        "web_config.recentWorksSettings.carouselNavColors": carouselNavColors,
      })

      // Update local state
      setCompanyData((prev) =>
        prev
          ? {
              ...prev,
              web_config: {
                ...prev.web_config,
                recentWorksItems: updatedItems,
              },
            }
          : null,
      )

      toast({
        title: "Success",
        description: "Recent works section updated successfully",
      })

      setRecentWorksDialog(false)
      setRecentWorksImageFile(null)
      console.log("[v0] Recent works save successful")
    } catch (error) {
      console.error("[v0] Error saving recent works:", error)
      toast({
        title: "Error",
        description: "Failed to update recent works section",
        variant: "destructive",
      })
    } finally {
      setRecentWorksUploading(false)
    }
  }

  const EditableElement = ({
    children,
    content,
    className = "",
  }: {
    children: React.ReactNode
    content: EditableContent
    className?: string
  }) => (
    <div
      className={`relative group cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50 rounded transition-all ${className}`}
      onClick={(e) => {
        e.stopPropagation()
        handleElementClick(content)
      }}
    >
      {children}
      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-blue-500 text-white p-1 rounded-bl text-xs flex items-center gap-1">
          <Edit3 className="w-3 h-3" />
          Edit
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!companyData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Company Not Found</h1>
          <p className="text-gray-600">The requested company could not be found.</p>
        </div>
      </div>
    )
  }

  const theme = companyData.theme || {
    primaryColor: "#3b82f6",
    secondaryColor: "#64748b",
    accentColor: "#f59e0b",
    buttonColor: "#3b82f6",
    buttonTextColor: "#ffffff",
    headerColor: "#1f2937",
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    footerBackgroundColor: "#1f2937",
    footerTextColor: "#ffffff",
    navColor: "#ffffff",
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.backgroundColor }}>
      {/* Edit Mode Header */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/website">
              <Button variant="ghost" size="sm" className="text-white hover:bg-blue-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5" />
              <span className="font-medium">Edit Mode - Click elements to edit</span>
            </div>
          </div>
          <Link href={`/website/${slug}`} target="_blank">
            <Button variant="ghost" size="sm" className="text-white hover:bg-blue-700">
              Preview Live Site
            </Button>
          </Link>
        </div>
      </div>

      {/* Website Content - Exact copy of website page with edit functionality */}
      <div className="min-h-screen">
        {/* Header */}
        <header
          className="sticky top-16 z-40 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
          style={{
            backgroundColor: headerColor,
          }}
          onClick={handleHeaderClick}
        >
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
            <div className="bg-blue-500 text-white p-1 rounded text-xs flex items-center gap-1">
              <Palette className="w-3 h-3" />
              Edit Color
            </div>
          </div>

          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <div
                  className="relative group cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50 rounded transition-all p-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLogoDialog(true)
                  }}
                >
                  {companyData?.logo ? (
                    <img src={companyData.logo || "/placeholder.svg"} alt={companyData.name} className="h-8 w-auto" />
                  ) : (
                    <div className="text-xl font-bold">{companyData?.name}</div>
                  )}
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-blue-500 text-white p-1 rounded-bl text-xs flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      Logo
                    </div>
                  </div>
                </div>
              </div>

              <nav className="hidden md:flex items-center space-x-8 relative group" onClick={handleNavClick}>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                  <div className="bg-blue-500 text-white p-1 rounded text-xs flex items-center gap-1 whitespace-nowrap">
                    <Palette className="w-3 h-3" />
                    Click empty space to edit nav color
                  </div>
                </div>
                <button
                  className="transition-colors hover:opacity-80 cursor-pointer"
                  style={{ color: navColor }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Home
                </button>
                <button
                  className="transition-colors hover:opacity-80 cursor-pointer"
                  style={{ color: navColor }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Application
                </button>
                <button
                  className="transition-colors hover:opacity-80 cursor-pointer"
                  style={{ color: navColor }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Recent Works
                </button>
                <button
                  className="transition-colors hover:opacity-80 cursor-pointer"
                  style={{ color: navColor }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Products
                </button>
                <button
                  className="transition-colors hover:opacity-80 cursor-pointer"
                  style={{ color: navColor }}
                  onClick={(e) => e.stopPropagation()}
                >
                  About Us
                </button>
                <button
                  className="transition-colors hover:opacity-80 cursor-pointer"
                  style={{ color: navColor }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Why Us
                </button>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section
          id="home"
          className="relative h-screen flex items-center justify-center cursor-pointer"
          onClick={handleHeroClick}
          style={{
            backgroundImage: !companyData?.web_config?.heroVideoUrl
              ? "url('/placeholder.svg?height=1080&width=1920')"
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {companyData?.web_config?.heroVideoUrl && (
            <video
              autoPlay
              muted
              loop
              className="absolute inset-0 w-full h-full object-cover"
              src={companyData.web_config.heroVideoUrl}
            />
          )}
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
            <h1
              className="text-5xl md:text-6xl font-bold mb-6"
              style={{ color: companyData?.web_config?.heroContent?.mainHeadingColor || "#ffffff" }}
            >
              {companyData?.web_config?.heroContent?.mainHeading || "Professional LED Solutions"}
            </h1>

            <p
              className="text-xl md:text-2xl mb-8"
              style={{ color: companyData?.web_config?.heroContent?.subtitleColor || "#ffffff" }}
            >
              {companyData?.web_config?.heroContent?.subtitle ||
                "Premium LED displays, lighting, and holographic solutions by DOS"}
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {["LED Posters", "LED Walls", "Floodlights", "Hologram Fans"].map((item) => (
                <EditableElement
                  key={item}
                  content={{
                    type: "button",
                    content: item,
                    section: "hero",
                    field: `category_${item.toLowerCase().replace(" ", "_")}`,
                  }}
                >
                  <Badge
                    variant="secondary"
                    className="text-sm px-4 py-2 backdrop-blur-sm border-white/30"
                    style={{
                      backgroundColor:
                        companyData?.web_config?.heroContent?.categoryButtonColor || "rgba(255, 255, 255, 0.2)",
                      color: companyData?.web_config?.heroContent?.categoryButtonTextColor || "#ffffff",
                    }}
                  >
                    {item}
                  </Badge>
                </EditableElement>
              ))}
            </div>

            <EditableElement
              content={{
                type: "button",
                content: "View Products",
                section: "hero",
                field: "cta_button",
              }}
            >
              <Button
                size="lg"
                style={{
                  backgroundColor: companyData?.web_config?.heroContent?.buttonColor || "#000000",
                  borderColor: companyData?.web_config?.heroContent?.buttonColor || "#000000",
                  color: companyData?.web_config?.heroContent?.buttonTextColor || "#ffffff",
                }}
                className="hover:opacity-90 transition-opacity shadow-lg"
              >
                View Products
              </Button>
            </EditableElement>
          </div>

          {/* Scroll Down Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 animate-bounce cursor-pointer">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </section>

        {/* Applications Section */}
        <section id="applications" className="py-20" style={{ backgroundColor: theme.backgroundColor }}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4" style={{ color: theme.textColor }}>
                Application
              </h2>

              <EditableElement
                content={{
                  type: "description",
                  content:
                    companyData?.web_config?.applications?.section_description ||
                    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                  section: "applications",
                  field: "section_description",
                }}
              >
                <p className="text-lg max-w-2xl mx-auto" style={{ color: theme.secondaryColor }}>
                  {companyData?.web_config?.applications?.section_description ||
                    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}
                </p>
              </EditableElement>
            </div>

            <ApplicationTabs theme={theme} />
          </div>
        </section>

        {/* Recent Works Section */}
        <section
          id="recent-works"
          className="w-full aspect-video relative overflow-hidden cursor-pointer"
          onClick={handleRecentWorksClick}
          onMouseEnter={() => setCurrentSlideIndex(currentSlideIndex)}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent z-20"></div>
          {/* <img
            src={
              companyData?.web_config?.recentWorksItems?.[currentSlideIndex]?.backgroundImage ||
              "/placeholder.svg?height=720&width=1280" ||
              "/placeholder.svg" ||
              "/placeholder.svg" ||
              "/placeholder.svg" ||
              "/placeholder.svg" ||
              "/placeholder.svg" ||
              "/placeholder.svg" ||
              "/placeholder.svg" ||
              "/placeholder.svg" ||
              "/placeholder.svg" ||
              "/placeholder.svg" ||
              "/placeholder.svg" ||
              "/placeholder.svg"
             || "/placeholder.svg"}
            alt="Recent Works Background"
            className="w-full h-full object-cover transition-all duration-500"
          /> */}
          {/* Preview either image or video based on media type */}
          {companyData?.web_config?.recentWorksItems?.[currentSlideIndex]?.mediaType === "video" ? (
            <video
              src={
                companyData?.web_config?.recentWorksItems?.[currentSlideIndex]?.backgroundImage || "/placeholder.svg"
              }
              className="w-full h-full object-cover transition-all duration-500"
              muted
              loop
              autoPlay
            />
          ) : (
            <img
              src={
                companyData?.web_config?.recentWorksItems?.[currentSlideIndex]?.backgroundImage || "/placeholder.svg"
              }
              alt="Recent Works Background"
              className="w-full h-full object-cover transition-all duration-500"
            />
          )}

          <div className="absolute inset-0 z-30 flex items-end">
            <div className="p-8 lg:p-16 max-w-2xl">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 transition-all duration-500">
                {companyData?.web_config?.recentWorksItems?.[currentSlideIndex]?.sectionTitle || "Our Recent Works"}
              </h2>

              <h3 className="text-2xl lg:text-3xl font-semibold text-white mb-6 transition-all duration-500">
                {companyData?.web_config?.recentWorksItems?.[currentSlideIndex]?.projectTitle || "Comcast Lobby"}
              </h3>

              <p className="text-lg text-white/90 leading-relaxed transition-all duration-500">
                {companyData?.web_config?.recentWorksItems?.[currentSlideIndex]?.projectDescription ||
                  "Comcast lobby project built one of the world's most iconic LED walls and it is a major tourist attraction in Philadelphia. The update of the Unilumin's LED wall and the re-rendering of the content have attracted a lot of attention."}
              </p>
            </div>
          </div>

          <div className="absolute bottom-8 right-8 z-30 flex items-center space-x-4">
            <div className="flex space-x-2">
              {(companyData?.web_config?.recentWorksItems || [{ id: 1 }]).map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentSlideIndex ? "bg-white" : "bg-white/50"
                  }`}
                ></div>
              ))}
            </div>
            <div className="flex space-x-2">
              <button
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: carouselNavColors.buttonColor,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = carouselNavColors.buttonHoverColor
                  const svg = e.currentTarget.querySelector("svg")
                  if (svg) svg.style.color = carouselNavColors.iconHoverColor
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = carouselNavColors.buttonColor
                  const svg = e.currentTarget.querySelector("svg")
                  if (svg) svg.style.color = carouselNavColors.iconColor
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (autoSwipeInterval) {
                    clearInterval(autoSwipeInterval)
                    setAutoSwipeInterval(null)
                  }
                  const itemsLength = (companyData?.web_config?.recentWorksItems || [{ id: 1 }]).length
                  setCurrentSlideIndex((prev) => (prev - 1 + itemsLength) % itemsLength)
                }}
              >
                <svg
                  className="w-5 h-5 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: carouselNavColors.iconColor }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: carouselNavColors.buttonColor,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = carouselNavColors.buttonHoverColor
                  const svg = e.currentTarget.querySelector("svg")
                  if (svg) svg.style.color = carouselNavColors.iconHoverColor
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = carouselNavColors.buttonColor
                  const svg = e.currentTarget.querySelector("svg")
                  if (svg) svg.style.color = carouselNavColors.iconColor
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (autoSwipeInterval) {
                    clearInterval(autoSwipeInterval)
                    setAutoSwipeInterval(null)
                  }
                  const itemsLength = (companyData?.web_config?.recentWorksItems || [{ id: 1 }]).length
                  setCurrentSlideIndex((prev) => (prev + 1) % itemsLength)
                }}
              >
                <svg
                  className="w-5 h-5 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: carouselNavColors.iconColor }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section id="products" className="py-16 bg-white">
          <div className="w-full">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-gray-900">Featured Products</h2>

              <EditableElement
                content={{
                  type: "description",
                  content:
                    companyData?.web_config?.products?.section_description ||
                    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                  section: "products",
                  field: "section_description",
                }}
              >
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  {companyData?.web_config?.products?.section_description ||
                    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}
                </p>
              </EditableElement>
            </div>

            <div className="flex flex-col lg:flex-row min-h-[600px]">
              <div className="w-full lg:w-1/2 flex items-center p-8 lg:p-16">
                <div className="max-w-xl">
                  <EditableElement
                    content={{
                      type: "heading",
                      content: "Classic Products",
                      section: "products",
                      field: "product_title",
                    }}
                  >
                    <h3 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">Classic Products</h3>
                  </EditableElement>

                  <EditableElement
                    content={{
                      type: "description",
                      content:
                        "LED signage that provides exceptional image with robust product quality to empower businesses to reach a new level.",
                      section: "products",
                      field: "product_description",
                    }}
                  >
                    <p className="text-lg text-gray-600 mb-8">
                      LED signage that provides exceptional image with robust product quality to empower businesses to
                      reach a new level.
                    </p>
                  </EditableElement>

                  <EditableElement
                    content={{
                      type: "button",
                      content: "View More",
                      section: "products",
                      field: "view_more_button",
                    }}
                  >
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold transition-colors mb-8">
                      View More
                    </button>
                  </EditableElement>

                  <div className="flex gap-4">
                    {[
                      { name: "Umate LM", active: false },
                      { name: "Uslimiii", active: false },
                      { name: "Uslim S2", active: false },
                      { name: "Usign", active: true },
                    ].map((product, index) => (
                      <div key={index} className="text-center">
                        <div
                          className={`w-16 h-12 rounded-lg mb-2 flex items-center justify-center ${
                            product.active ? "bg-blue-600" : "bg-gray-200"
                          }`}
                        >
                          <img
                            src="/placeholder.svg?height=48&width=64"
                            alt={product.name}
                            className="w-8 h-8 object-cover"
                          />
                        </div>
                        <span className="text-xs text-gray-600">{product.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-1/2 relative p-8 lg:p-16">
                <div className="w-1/2 mx-auto aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden mb-6 flex items-center justify-center">
                  <img
                    src="/placeholder.svg?height=400&width=400"
                    alt="LED Display Modules"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-4">
                  <EditableElement
                    content={{
                      type: "heading",
                      content: "Designed for Outdoor Digital Signage Market P6/9/10",
                      section: "products",
                      field: "product_specs_title",
                    }}
                  >
                    <h4 className="text-xl font-semibold text-gray-900">
                      Designed for Outdoor Digital Signage Market P6/9/10
                    </h4>
                  </EditableElement>

                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 bg-gray-900 rounded-full mt-2 flex-shrink-0"></span>
                      <span>1x1ft metric size is optimal for signages and billboards</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 bg-gray-900 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Triple Protection design makes module and PDU IP69K</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 bg-gray-900 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Fanless Design, no noise and fewer risks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 bg-gray-900 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Low Power consumption: 545W/SQM @850nits</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 bg-gray-900 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Flawless Display: 7680Hz refresh rate, 16bit, calibrated</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section id="about-us" className="bg-background">
          <div className="w-full">
            <div className="flex flex-col lg:flex-row min-h-[600px]">
              <div className="w-full lg:w-1/2 bg-gray-900 text-white flex items-center p-8 lg:p-16">
                <div className="max-w-xl">
                  <EditableElement
                    content={{
                      type: "heading",
                      content: "About Us",
                      section: "about-us",
                      field: "section_title",
                    }}
                  >
                    <h2 className="text-4xl lg:text-5xl font-bold mb-4">About Us</h2>
                  </EditableElement>

                  <EditableElement
                    content={{
                      type: "heading",
                      content: "Consectetur Adipiscing Elit",
                      section: "about-us",
                      field: "section_subtitle",
                    }}
                  >
                    <h3 className="text-xl lg:text-2xl mb-8 text-gray-300">Consectetur Adipiscing Elit</h3>
                  </EditableElement>

                  <EditableElement
                    content={{
                      type: "description",
                      content:
                        "Professional LED solutions for businesses worldwide. Quality, innovation, and reliability in every product.",
                      section: "about-us",
                      field: "section_description",
                    }}
                  >
                    <p className="mb-8 text-sm leading-relaxed">
                      Professional LED solutions for businesses worldwide. Quality, innovation, and reliability in every
                      product.
                    </p>
                  </EditableElement>

                  <div className="mb-8">
                    <h3 className="font-semibold mb-2 text-sm">Contact Us</h3>
                    <EditableElement
                      content={{
                        type: "text",
                        content: "+63 (2) 8123-4567",
                        section: "about-us",
                        field: "contact_phone",
                      }}
                    >
                      <p className="text-sm">📞 +63 (2) 8123-4567</p>
                    </EditableElement>
                  </div>

                  <EditableElement
                    content={{
                      type: "button",
                      content: "Get To Know Us",
                      section: "about-us",
                      field: "cta_button",
                    }}
                  >
                    <button className="bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                      Get To Know Us
                    </button>
                  </EditableElement>
                </div>
              </div>

              <div className="w-full lg:w-1/2 relative">
                <img
                  src="/placeholder.svg?height=600&width=800"
                  alt="LED displays and audiovisual systems showcase"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Why Us Section */}
        <section id="why-us" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="w-full lg:w-1/2">
                <EditableElement
                  content={{
                    type: "heading",
                    content: `WHY ${companyData?.name?.toUpperCase() || "CHOOSE US"}?`,
                    section: "why-us",
                    field: "section_title",
                  }}
                >
                  <h2 className="text-4xl lg:text-5xl font-bold text-black mb-8">
                    WHY {companyData?.name?.toUpperCase() || "CHOOSE US"}?
                  </h2>
                </EditableElement>

                <div className="space-y-6">
                  {[
                    "We create LED displays with a focus on quality and usability.",
                    "Our products are conceived, designed, tested, and supported in-house to ensure quality control.",
                    `${companyData?.name || "We"} provide world-class support with our five-year product warranty, 10-year parts availability guarantee, and white glove service style.`,
                    "Since our founding, our company has relied on a tireless work ethic to outperform the competition.",
                    `Thousands of businesses nationwide have trusted ${companyData?.name || "us"} as their LED display manufacturer.`,
                  ].map((text, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <EditableElement
                        content={{
                          type: "text",
                          content: text,
                          section: "why-us",
                          field: `benefit_${index + 1}`,
                        }}
                      >
                        <p
                          className="text-lg text-gray-800"
                          dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }}
                        />
                      </EditableElement>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full lg:w-1/2">
                <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
                  <img
                    src="/placeholder.svg?height=400&width=600"
                    alt="Company facility aerial view"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center hover:bg-red-700 transition-colors shadow-lg">
                      <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Section */}
        <footer className="bg-slate-900 text-white">
          <div className="py-16 text-center">
            <EditableElement
              content={{
                type: "heading",
                content: "How Can We Help You?",
                section: "footer",
                field: "cta_title",
              }}
            >
              <h2 className="text-4xl lg:text-5xl font-bold mb-4">How Can We Help You?</h2>
            </EditableElement>

            <EditableElement
              content={{
                type: "text",
                content: "Feel free to let us know.",
                section: "footer",
                field: "cta_subtitle",
              }}
            >
              <p className="text-lg mb-8 text-gray-300">Feel free to let us know.</p>
            </EditableElement>

            <EditableElement
              content={{
                type: "button",
                content: "contact us",
                section: "footer",
                field: "cta_button",
              }}
            >
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
                contact us
              </button>
            </EditableElement>
          </div>

          <div className="border-t border-slate-800 py-8">
            <div className="container mx-auto px-4 text-center">
              <EditableElement
                content={{
                  type: "text",
                  content: `© 2024 ${companyData?.name || "Company"}. All rights reserved.`,
                  section: "footer",
                  field: "copyright",
                }}
              >
                <p className="text-gray-400">© 2024 {companyData?.name || "Company"}. All rights reserved.</p>
              </EditableElement>
            </div>
          </div>
        </footer>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, content: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5" />
              Edit Content
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Content Type: {editDialog.content?.type}</Label>
            </div>
            <div>
              <Label htmlFor="edit-content">Content</Label>
              {editDialog.content?.type === "description" ? (
                <Textarea id="edit-content" value={editValue} onChange={(e) => setEditValue(e.target.value)} rows={4} />
              ) : (
                <Input id="edit-content" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, content: null })}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logo Upload Dialog */}
      <Dialog open={logoDialog} onOpenChange={setLogoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Upload Company Logo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="logo-upload">Select Logo Image</Label>
              <Input id="logo-upload" type="file" accept="image/*" onChange={handleFileChange} className="mt-2" />
              {logoFile && <p className="text-sm text-gray-600 mt-2">Selected: {logoFile.name}</p>}
            </div>

            {logoFile && (
              <div className="border rounded-lg p-4">
                <Label>Preview:</Label>
                <div className="mt-2 flex items-center justify-center bg-gray-50 rounded-lg p-4">
                  <img
                    src={URL.createObjectURL(logoFile) || "/placeholder.svg"}
                    alt="Logo preview"
                    className="max-h-20 max-w-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setLogoDialog(false)
                setLogoFile(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogoUpload}
              disabled={!logoFile || logoUploading}
              className="flex items-center gap-2"
            >
              {logoUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Logo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header Color Dialog */}
      <Dialog open={headerColorDialog} onOpenChange={setHeaderColorDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Edit Header & Navigation Colors
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="header-color">Header Color</Label>
              <div className="flex gap-3 mt-2">
                <Input
                  id="header-color"
                  type="color"
                  value={headerColor}
                  onChange={(e) => setHeaderColor(e.target.value)}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={headerColor}
                  onChange={(e) => setHeaderColor(e.target.value)}
                  placeholder="#1f2937"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="nav-color">Navigation Text Color</Label>
              <div className="flex gap-3 mt-2">
                <Input
                  id="nav-color"
                  type="color"
                  value={navColor}
                  onChange={(e) => setNavColor(e.target.value)}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={navColor}
                  onChange={(e) => setNavColor(e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <Label>Preview:</Label>
              <div
                className="mt-2 h-20 rounded-lg flex flex-col items-center justify-center font-medium"
                style={{ backgroundColor: headerColor }}
              >
                <div className="text-white text-sm mb-2">Header Preview</div>
                <div className="flex gap-4 text-sm" style={{ color: navColor }}>
                  <span>Home</span>
                  <span>Application</span>
                  <span>Recent Works</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setHeaderColorDialog(false)
                setHeaderColor(companyData?.web_config?.theme?.headerColor || "#1f2937")
                setNavColor(companyData?.web_config?.theme?.navColor || "#ffffff")
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveHeaderColor} disabled={headerColorSaving} className="flex items-center gap-2">
              {headerColorSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Colors
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nav Color Dialog */}
      <Dialog open={navColorDialog} onOpenChange={setNavColorDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Edit Navigation Color
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="nav-color">Navigation Text Color</Label>
              <div className="flex gap-3 mt-2">
                <Input
                  id="nav-color"
                  type="color"
                  value={navColor}
                  onChange={(e) => setNavColor(e.target.value)}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={navColor}
                  onChange={(e) => setNavColor(e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <Label>Preview:</Label>
              <div
                className="mt-2 h-16 rounded-lg flex items-center justify-center font-medium space-x-4"
                style={{ backgroundColor: headerColor }}
              >
                <span style={{ color: navColor }}>Home</span>
                <span style={{ color: navColor }}>Application</span>
                <span style={{ color: navColor }}>Recent Works</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNavColorDialog(false)
                setNavColor(companyData?.web_config?.theme?.navColor || "#ffffff")
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveNavColor} disabled={navColorSaving} className="flex items-center gap-2">
              {navColorSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Color
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hero Video Upload Dialog */}
      <Dialog open={heroVideoDialog} onOpenChange={setHeroVideoDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Hero Background Video
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Video File</label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setHeroVideoFile(e.target.files?.[0] || null)}
                className="w-full p-2 border rounded-md"
              />
            </div>

            {heroVideoFile && <div className="text-sm text-gray-600">Selected: {heroVideoFile.name}</div>}

            {companyData?.web_config?.heroVideoUrl && (
              <div>
                <label className="block text-sm font-medium mb-2">Current Video Preview:</label>
                <video
                  controls
                  className="w-full h-32 object-cover rounded-md"
                  src={companyData.web_config.heroVideoUrl}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setHeroVideoDialog(false)
                setHeroVideoFile(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleVideoUpload} disabled={!heroVideoFile || heroVideoUploading}>
              {heroVideoUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Video
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hero Video Upload Dialog */}
      <Dialog open={heroEditDialog} onOpenChange={setHeroEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5" />
              Edit Hero Section
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Content Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Content</h3>

              <div>
                <Label htmlFor="main-heading">Main Heading</Label>
                <Input
                  id="main-heading"
                  value={heroEditData.mainHeading}
                  onChange={(e) => setHeroEditData((prev) => ({ ...prev, mainHeading: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Textarea
                  id="subtitle"
                  value={heroEditData.subtitle}
                  onChange={(e) => setHeroEditData((prev) => ({ ...prev, subtitle: e.target.value }))}
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Text Colors Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Text Colors</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="main-heading-color">Main Heading Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="main-heading-color"
                      type="color"
                      value={heroEditData.mainHeadingColor}
                      onChange={(e) => setHeroEditData((prev) => ({ ...prev, mainHeadingColor: e.target.value }))}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={heroEditData.mainHeadingColor}
                      onChange={(e) => setHeroEditData((prev) => ({ ...prev, mainHeadingColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="subtitle-color">Subtitle Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="subtitle-color"
                      type="color"
                      value={heroEditData.subtitleColor}
                      onChange={(e) => setHeroEditData((prev) => ({ ...prev, subtitleColor: e.target.value }))}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={heroEditData.subtitleColor}
                      onChange={(e) => setHeroEditData((prev) => ({ ...prev, subtitleColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Button Styling Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Main Button Styling</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="button-color">Button Background</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="button-color"
                      type="color"
                      value={heroEditData.buttonColor}
                      onChange={(e) => setHeroEditData((prev) => ({ ...prev, buttonColor: e.target.value }))}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={heroEditData.buttonColor}
                      onChange={(e) => setHeroEditData((prev) => ({ ...prev, buttonColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="button-text-color">Button Text Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="button-text-color"
                      type="color"
                      value={heroEditData.buttonTextColor}
                      onChange={(e) => setHeroEditData((prev) => ({ ...prev, buttonTextColor: e.target.value }))}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={heroEditData.buttonTextColor}
                      onChange={(e) => setHeroEditData((prev) => ({ ...prev, buttonTextColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Category Buttons Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Category Buttons Styling</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category-button-color">Category Button Background</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="category-button-color"
                      type="color"
                      value={heroEditData.categoryButtonColor.replace("20", "")}
                      onChange={(e) =>
                        setHeroEditData((prev) => ({ ...prev, categoryButtonColor: e.target.value + "20" }))
                      }
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={heroEditData.categoryButtonColor}
                      onChange={(e) => setHeroEditData((prev) => ({ ...prev, categoryButtonColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category-button-text-color">Category Button Text</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="category-button-text-color"
                      type="color"
                      value={heroEditData.categoryButtonTextColor}
                      onChange={(e) =>
                        setHeroEditData((prev) => ({ ...prev, categoryButtonTextColor: e.target.value }))
                      }
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={heroEditData.categoryButtonTextColor}
                      onChange={(e) =>
                        setHeroEditData((prev) => ({ ...prev, categoryButtonTextColor: e.target.value }))
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div className="border rounded-lg p-4 bg-gray-900">
              <Label>Preview:</Label>
              <div className="mt-2 text-center space-y-4">
                <h1 className="text-3xl font-bold" style={{ color: heroEditData.mainHeadingColor }}>
                  {heroEditData.mainHeading}
                </h1>
                <p className="text-lg" style={{ color: heroEditData.subtitleColor }}>
                  {heroEditData.subtitle}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {["LED Posters", "LED Walls"].map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1 rounded-full text-sm"
                      style={{
                        backgroundColor: heroEditData.categoryButtonColor,
                        color: heroEditData.categoryButtonTextColor,
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <Button
                  style={{
                    backgroundColor: heroEditData.buttonColor,
                    color: heroEditData.buttonTextColor,
                  }}
                >
                  View Products
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setHeroEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveHeroEdit} disabled={heroEditSaving} className="flex items-center gap-2">
              {heroEditSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={recentWorksDialog} onOpenChange={setRecentWorksDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Recent Works Section</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Item Navigation */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">
                  Item {currentItemIndex + 1} of {recentWorksItems.length}
                </span>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentItemIndex(Math.max(0, currentItemIndex - 1))}
                    disabled={currentItemIndex === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentItemIndex(Math.min(recentWorksItems.length - 1, currentItemIndex + 1))}
                    disabled={currentItemIndex === recentWorksItems.length - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={addRecentWorksItem}>
                  Add Item
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeRecentWorksItem(currentItemIndex)}
                  disabled={recentWorksItems.length <= 1}
                >
                  Remove Item
                </Button>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold mb-4">Carousel Navigation Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="buttonColor" className="text-sm font-medium">
                    Button Color
                  </Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="color"
                      id="buttonColor"
                      value={carouselNavColors.buttonColor}
                      onChange={(e) =>
                        setCarouselNavColors((prev) => ({
                          ...prev,
                          buttonColor: e.target.value,
                        }))
                      }
                      className="w-12 h-8 rounded border"
                    />
                    <Input
                      value={carouselNavColors.buttonColor}
                      onChange={(e) =>
                        setCarouselNavColors((prev) => ({
                          ...prev,
                          buttonColor: e.target.value,
                        }))
                      }
                      className="flex-1"
                      placeholder="#2563eb"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="buttonHoverColor" className="text-sm font-medium">
                    Button Hover Color
                  </Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="color"
                      id="buttonHoverColor"
                      value={carouselNavColors.buttonHoverColor}
                      onChange={(e) =>
                        setCarouselNavColors((prev) => ({
                          ...prev,
                          buttonHoverColor: e.target.value,
                        }))
                      }
                      className="w-12 h-8 rounded border"
                    />
                    <Input
                      value={carouselNavColors.buttonHoverColor}
                      onChange={(e) =>
                        setCarouselNavColors((prev) => ({
                          ...prev,
                          buttonHoverColor: e.target.value,
                        }))
                      }
                      className="flex-1"
                      placeholder="#1d4ed8"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="iconColor" className="text-sm font-medium">
                    Icon Color
                  </Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="color"
                      id="iconColor"
                      value={carouselNavColors.iconColor}
                      onChange={(e) =>
                        setCarouselNavColors((prev) => ({
                          ...prev,
                          iconColor: e.target.value,
                        }))
                      }
                      className="w-12 h-8 rounded border"
                    />
                    <Input
                      value={carouselNavColors.iconColor}
                      onChange={(e) =>
                        setCarouselNavColors((prev) => ({
                          ...prev,
                          iconColor: e.target.value,
                        }))
                      }
                      className="flex-1"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="iconHoverColor" className="text-sm font-medium">
                    Icon Hover Color
                  </Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="color"
                      id="iconHoverColor"
                      value={carouselNavColors.iconHoverColor}
                      onChange={(e) =>
                        setCarouselNavColors((prev) => ({
                          ...prev,
                          iconHoverColor: e.target.value,
                        }))
                      }
                      className="w-12 h-8 rounded border"
                    />
                    <Input
                      value={carouselNavColors.iconHoverColor}
                      onChange={(e) =>
                        setCarouselNavColors((prev) => ({
                          ...prev,
                          iconHoverColor: e.target.value,
                        }))
                      }
                      className="flex-1"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>

              {/* Preview of navigation buttons */}
              <div className="mt-4">
                <Label className="text-sm font-medium mb-2 block">Preview</Label>
                <div className="flex space-x-2 p-4 bg-gray-900 rounded-lg w-fit">
                  <button
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                    style={{ backgroundColor: carouselNavColors.buttonColor }}
                  >
                    <svg
                      className="w-5 h-5 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: carouselNavColors.iconColor }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                    style={{ backgroundColor: carouselNavColors.buttonColor }}
                  >
                    <svg
                      className="w-5 h-5 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: carouselNavColors.iconColor }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {recentWorksItems.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Form Fields */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="backgroundImage" className="text-sm font-medium">
                      Background Media
                    </Label>
                    <Input
                      id="backgroundImage"
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => handleRecentWorksImageUpload(e, currentItemIndex)}
                      className="mt-1"
                    />
                    {recentWorksItems[currentItemIndex]?.backgroundImage && (
                      <div className="mt-2 relative">
                        {recentWorksItems[currentItemIndex]?.mediaType === "video" ? (
                          <video
                            src={recentWorksItems[currentItemIndex].backgroundImage || "/placeholder.svg"}
                            className="w-full h-32 object-cover rounded border"
                            muted
                            loop
                            autoPlay
                          />
                        ) : (
                          <img
                            src={recentWorksItems[currentItemIndex].backgroundImage || "/placeholder.svg"}
                            alt="Background preview"
                            className="w-full h-32 object-cover rounded border"
                          />
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
                          <span className="text-white text-sm">Click to edit media and text</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="sectionTitle" className="text-sm font-medium">
                      Section Title
                    </Label>
                    <Input
                      id="sectionTitle"
                      value={recentWorksItems[currentItemIndex]?.sectionTitle || ""}
                      onChange={(e) => updateRecentWorksItem(currentItemIndex, "sectionTitle", e.target.value)}
                      placeholder="Our Recent Works"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="projectTitle" className="text-sm font-medium">
                      Project Title
                    </Label>
                    <Input
                      id="projectTitle"
                      value={recentWorksItems[currentItemIndex]?.projectTitle || ""}
                      onChange={(e) => updateRecentWorksItem(currentItemIndex, "projectTitle", e.target.value)}
                      placeholder="Comcast Lobbys"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="projectDescription" className="text-sm font-medium">
                      Project Description
                    </Label>
                    <Textarea
                      id="projectDescription"
                      value={recentWorksItems[currentItemIndex]?.projectDescription || ""}
                      onChange={(e) => updateRecentWorksItem(currentItemIndex, "projectDescription", e.target.value)}
                      placeholder="Comcast lobby project built one of the world's most iconic LED walls and it is a major tourist attraction in Philadelphia. The update of the Unilimint's LED wall and the re-rendering of the content have attracted a lot of attention."
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Right Column - Preview */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Preview</Label>
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <div className="relative h-48 bg-gray-200">
                      {recentWorksItems[currentItemIndex]?.backgroundImage ? (
                        recentWorksItems[currentItemIndex]?.mediaType === "video" ? (
                          <video
                            src={recentWorksItems[currentItemIndex].backgroundImage || "/placeholder.svg"}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            autoPlay
                          />
                        ) : (
                          <img
                            src={recentWorksItems[currentItemIndex].backgroundImage || "/placeholder.svg"}
                            alt="Background"
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-500">No media selected</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-end p-4">
                        <h3 className="text-white text-xl font-bold mb-2">
                          {recentWorksItems[currentItemIndex]?.sectionTitle || "Our Recent Works"}
                        </h3>
                        <h4 className="text-white text-lg font-semibold mb-1">
                          {recentWorksItems[currentItemIndex]?.projectTitle || "Project Title"}
                        </h4>
                        <p className="text-white text-sm line-clamp-3">
                          {recentWorksItems[currentItemIndex]?.projectDescription ||
                            "Project description will appear here..."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRecentWorksDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRecentWorks} disabled={recentWorksUploading}>
              {recentWorksUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  function updateRecentWorksItem(index: number, key: string, value: any) {
    const newItems = [...recentWorksItems]
    newItems[index] = { ...newItems[index], [key]: value }
    setRecentWorksItems(newItems)
  }
}
