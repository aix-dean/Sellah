"use client"

import { DialogFooter } from "@/components/ui/dialog"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Edit3, ImageIcon, Palette, Trash2, Plus } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

import ApplicationTabs from "@/components/ApplicationTabs"

interface Product {
  id: string
  name: string
  description?: string
  image?: string
  features?: string[]
  company_id: string
  slug?: string
  [key: string]: any
}

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
    applicationTabs?: {
      tabs: { id: string; label: string; enabled: boolean }[]
      activeTabColor: string
      inactiveTabColor: string
      activeTextColor: string
      inactiveTextColor: string
    }
    aboutUs?: {
      title: string
      subtitle: string
      description: string
      contactPhone: string
      ctaButton: string
      backgroundColor: string
      textColor: string
      subtitleColor: string
      buttonBackgroundColor: string
      buttonTextColor: string
      image: string
    }
    whyUs?: {
      bulletPoints: string[]
      videoUrl: string
    }
    footer?: {
      title: string
      subtitle: string
      buttonText: string
      backgroundColor: string // Default slate-900
      textColor: string // Default white text
      aboutUs: {
        title: string
        links: string[]
      }
      address: {
        title: string
        lines: string[]
      }
      followUs: {
        title: string
        socialLinks: { name: string; url: string; icon: string }[]
      }
      copyright: string
      sectionTitleColor?: string
    }
    ourTechnology?: {
      mainTitle: string
      subtitle: string
      technologies?: { name: string; image: string }[]
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
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
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

  const [showApplicationTabsDialog, setShowApplicationTabsDialog] = useState(false)
  const [applicationTabsDialogTab, setApplicationTabsDialogTab] = useState("manage")
  const [applicationTabsConfig, setApplicationTabsConfig] = useState({
    tabs: [
      { id: "Indoor", label: "Indoor", enabled: true },
      { id: "Outdoor", label: "Outdoor", enabled: true },
      { id: "Rental", label: "Rental", enabled: true },
      { id: "Sports", label: "Sports", enabled: true },
      { id: "Lighting", label: "Lighting", enabled: true },
    ],
    activeTabColor: "#3b82f6",
    inactiveTabColor: "#ffffff",
    activeTextColor: "#ffffff",
    inactiveTextColor: "#374151",
    content: {
      Indoor: {
        title: "Indoor",
        description:
          "From control rooms to governments to retail, Unilumin LED display presents exceptional images in mission-critical places and indoor commercial space.",
        applications: [
          { name: "Broadcast Room", image: "" },
          { name: "Education & Medical", image: "" },
          { name: "Control Room", image: "" },
          { name: "Corporate", image: "" },
          { name: "Hospitality", image: "" },
          { name: "Retail", image: "" },
        ],
        image: "",
      },
      Outdoor: {
        title: "Outdoor",
        description:
          "Weather-resistant LED displays designed for outdoor advertising, digital billboards, and large-scale installations with high brightness and durability.",
        applications: [
          { name: "Digital Billboards", image: "" },
          { name: "Stadium Displays", image: "" },
          { name: "Transportation Hubs", image: "" },
          { name: "Outdoor Advertising", image: "" },
          { name: "Public Information", image: "" },
          { name: "Event Venues", image: "" },
        ],
        image: "",
      },
      Rental: {
        title: "Rental",
        description:
          "Portable and modular LED display solutions perfect for events, concerts, trade shows, and temporary installations with quick setup and breakdown.",
        applications: [
          { name: "Concerts & Events", image: "" },
          { name: "Trade Shows", image: "" },
          { name: "Corporate Events", image: "" },
          { name: "Weddings", image: "" },
          { name: "Conferences", image: "" },
          { name: "Stage Backdrops", image: "" },
        ],
        image: "",
      },
      Sports: {
        title: "Sports",
        description:
          "High-performance LED displays for sports venues, stadiums, and arenas with fast refresh rates and excellent visibility for live events.",
        applications: [
          { name: "Stadium Scoreboards", image: "" },
          { name: "Perimeter Displays", image: "" },
          { name: "Video Walls", image: "" },
          { name: "Sports Bars", image: "" },
          { name: "Training Facilities", image: "" },
          { name: "Broadcasting", image: "" },
        ],
        image: "",
      },
      Lighting: {
        title: "Lighting",
        description:
          "Energy-efficient LED lighting solutions for commercial, industrial, and residential applications with smart controls and long lifespan.",
        applications: [
          { name: "Street Lighting", image: "" },
          { name: "Industrial Lighting", image: "" },
          { name: "Architectural Lighting", image: "" },
          { name: "Landscape Lighting", image: "" },
          { name: "Emergency Lighting", image: "" },
          { name: "Smart City Solutions", image: "" },
        ],
        image: "",
      },
    },
  })
  const [selectedTabForContent, setSelectedTabForContent] = useState("Indoor")

  const [aboutUsDialogOpen, setAboutUsDialogOpen] = useState(false)
  const [aboutUsConfig, setAboutUsConfig] = useState({
    subtitle: "Consectetur Adipiscing Elit",
    description:
      "Professional LED solutions for businesses worldwide. Quality, innovation, and reliability in every product.",
    contactPhone: "+63 (2) 8123-4567",
    ctaButton: "Get To Know Us",
    backgroundColor: "#111827", // gray-900
    textColor: "#ffffff",
    subtitleColor: "#d1d5db", // gray-300
    buttonBackgroundColor: "#ffffff",
    buttonTextColor: "#111827",
    image: "/placeholder.svg?height=600&width=800",
  })

  const [aboutUsSaving, setAboutUsSaving] = useState(false)

  const [whyUsDialog, setWhyUsDialog] = useState(false)
  const [whyUsConfig, setWhyUsConfig] = useState({
    bulletPoints: [
      "We create LED displays with a focus on quality and usability.",
      "Our products are conceived, designed, tested, and supported in-house to ensure quality control.",
      "We provide world-class support with our five-year product warranty, 10-year parts availability guarantee, and white glove service style.",
      "Since our founding, our company has relied on a tireless work ethic to outperform the competition.",
      "Thousands of businesses nationwide have trusted us as their LED display manufacturer.",
    ],
    videoUrl: "",
  })
  const [whyUsLoading, setWhyUsLoading] = useState(false)

  const [footerDialog, setFooterDialog] = useState(false)
  const [footerConfig, setFooterConfig] = useState({
    title: "How Can We Help You?",
    subtitle: "Feel free to let us know.",
    buttonText: "contact us",
    backgroundColor: "#0f172a", // Default slate-900
    textColor: "#ffffff", // Default white text
    aboutUs: {
      title: "About Us",
      links: ["About Unilumin", "Joint-Stock Company", "U-Green"],
    },
    address: {
      title: "Address",
      lines: [
        "No. 18 Haoye Road, Fuhai Sub-district, Bao'an District",
        "Shenzhen, Guangdong Province",
        "sales@unilumin.com",
        "+86-755-29019999",
      ],
    },
    followUs: {
      title: "Follow Us",
      socialLinks: [
        { name: "Twitter", url: "#", icon: "twitter" },
        { name: "YouTube", url: "#", icon: "youtube" },
        { name: "LinkedIn", url: "#", icon: "linkedin" },
        { name: "Pinterest", url: "#", icon: "pinterest" },
        { name: "TikTok", url: "#", icon: "tiktok" },
      ],
    },
    copyright: "copyright © 2025 DOS",
  })
  const [footerLoading, setFooterLoading] = useState(false)

  const handleFooterClick = () => {
    // Load existing config from database
    const existingConfig = companyData?.web_config?.footer || {}
    setFooterConfig({
      title: existingConfig.title || "How Can We Help You?",
      subtitle: existingConfig.subtitle || "Feel free to let us know.",
      buttonText: existingConfig.buttonText || "contact us",
      backgroundColor: existingConfig.backgroundColor || companyData?.theme?.footerBackgroundColor || "#0f172a",
      textColor: existingConfig.textColor || companyData?.theme?.footerTextColor || "#ffffff",
      aboutUs: {
        title: existingConfig.aboutUs?.title || "About Us",
        links: existingConfig.aboutUs?.links || ["About Unilumin", "Joint-Stock Company", "U-Green"],
      },
      address: {
        title: existingConfig.address?.title || "Address",
        lines: existingConfig.address?.lines || [
          "No. 18 Haoye Road, Fuhai Sub-district, Bao'an District",
          "Shenzhen, Guangdong Province",
          "sales@unilumin.com",
          "+86-755-29019999",
        ],
      },
      followUs: {
        title: existingConfig.followUs?.title || "Follow Us",
        socialLinks: existingConfig.followUs?.socialLinks || [
          { name: "Twitter", url: "#", icon: "twitter" },
          { name: "YouTube", url: "#", icon: "youtube" },
          { name: "LinkedIn", url: "#", icon: "linkedin" },
          { name: "Pinterest", url: "#", icon: "pinterest" },
          { name: "TikTok", url: "#", icon: "tiktok" },
        ],
      },
      copyright: existingConfig.copyright || "copyright © 2025 DOS",
      sectionTitleColor: existingConfig.sectionTitleColor || existingConfig.textColor,
    })
    setFooterDialog(true)
  }

  const handleFooterSave = async () => {
    if (!slug) return

    try {
      setFooterLoading(true)
      const docRef = doc(db, "companies", slug)

      await updateDoc(docRef, {
        "web_config.footer": footerConfig,
      })

      // Update local state
      setCompanyData((prevData) => {
        if (!prevData) return prevData
        return {
          ...prevData,
          web_config: {
            ...prevData.web_config,
            footer: footerConfig,
          },
        }
      })

      toast({
        title: "Footer Section Updated",
        description: "Your changes have been saved successfully.",
      })
      setFooterDialog(false)
    } catch (error) {
      console.error("Error saving footer section:", error)
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFooterLoading(false)
    }
  }

  const addAboutUsLink = () => {
    setFooterConfig((prev) => ({
      ...prev,
      aboutUs: {
        ...prev.aboutUs,
        links: [...(prev.aboutUs?.links || []), "New link"],
      },
    }))
  }

  const removeAboutUsLink = (index: number) => {
    setFooterConfig((prev) => ({
      ...prev,
      aboutUs: {
        ...prev.aboutUs,
        links: (prev.aboutUs?.links || []).filter((_, i) => i !== index),
      },
    }))
  }

  const updateAboutUsLink = (index: number, value: string) => {
    setFooterConfig((prev) => ({
      ...prev,
      aboutUs: {
        ...prev.aboutUs,
        links: (prev.aboutUs?.links || []).map((link, i) => (i === index ? value : link)),
      },
    }))
  }

  const addAddressLine = () => {
    setFooterConfig((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        lines: [...(prev.address?.lines || []), "New address line"],
      },
    }))
  }

  const removeAddressLine = (index: number) => {
    setFooterConfig((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        lines: (prev.address?.lines || []).filter((_, i) => i !== index),
      },
    }))
  }

  const updateAddressLine = (index: number, value: string) => {
    setFooterConfig((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        lines: (prev.address?.lines || []).map((line, i) => (i === index ? value : line)),
      },
    }))
  }

  const addSocialLink = () => {
    setFooterConfig((prev) => ({
      ...prev,
      followUs: {
        ...prev.followUs,
        socialLinks: [...(prev.followUs?.socialLinks || []), { name: "New Platform", url: "#", icon: "twitter" }],
      },
    }))
  }

  const removeSocialLink = (index: number) => {
    setFooterConfig((prev) => ({
      ...prev,
      followUs: {
        ...prev.followUs,
        socialLinks: (prev.followUs?.socialLinks || []).filter((_, i) => i !== index),
      },
    }))
  }

  const updateSocialLink = (index: number, field: string, value: string) => {
    setFooterConfig((prev) => ({
      ...prev,
      followUs: {
        ...prev.followUs,
        socialLinks: (prev.followUs?.socialLinks || []).map((link, i) =>
          i === index ? { ...link, [field]: value } : link,
        ),
      },
    }))
  }

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

  const fetchCompanyProducts = async (companyId: string) => {
    try {
      setProductsLoading(true)
      console.log("[v0] Fetching products for company ID:", companyId)

      const productsRef = collection(db, "products")
      const productsQuery = query(productsRef, where("company_id", "==", companyId))
      const productsSnapshot = await getDocs(productsQuery)

      const companyProducts = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        slug:
          doc.data().slug ||
          doc
            .data()
            .name?.toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, ""),
        description: doc.data().description || `Professional ${doc.data().name} solution`,
        features: doc.data().features || doc.data().key_features || [],
      })) as Product[]

      console.log("[v0] Fetched products:", companyProducts)
      setProducts(companyProducts)

      if (companyProducts.length === 0) {
        console.log("[v0] No products found for company, showing fallback message")
      }
    } catch (error) {
      console.error("[v0] Error fetching company products:", error)
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProductsLoading(false)
    }
  }

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

          await fetchCompanyProducts(slug)
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

      setCompanyData((prev) =>
        prev
          ? {
              ...prev,
              web_config: {
                ...prev.web_config,
                theme: {
                  ...prev.web_config?.theme,
                  headerColor: headerColor,
                  navColor: navColor,
                },
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
    setNavColor(companyData?.web_config?.theme?.navColor || "#ffffff")
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
      console.log("[v0] Download URL:",:", downloadURL)

      // Update the company's web_config with the video URL\
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

  const handleApplicationTabsClick = () => {
    // Load existing config from database
    const existingConfig = companyData?.web_config?.applicationTabs
    if (existingConfig) {
      setApplicationTabsConfig(existingConfig)
    }
    setShowApplicationTabsDialog(true)
  }

  const saveApplicationTabsConfig = async () => {
    try {
      const docRef = doc(db, "companies", slug)
      await updateDoc(docRef, {
        "web_config.applicationTabs": applicationTabsConfig,
      })
      setShowApplicationTabsDialog(false)
      // Refresh company data
      const updatedDoc = await getDoc(docRef)
      if (updatedDoc.exists()) {
        setCompanyData(updatedDoc.data())
      }
    } catch (error) {
      console.error("Error saving application tabs config:", error)
    }
  }

  const addNewTab = () => {
    const newTab = {
      id: `Tab${Date.now()}`,
      label: "New Tab",
      enabled: true,
    }
    setApplicationTabsConfig((prev) => ({
      ...prev,
      tabs: [...prev.tabs, newTab],
    }))
  }

  const removeTab = (tabId: string) => {
    setApplicationTabsConfig((prev) => ({
      ...prev,
      tabs: prev.tabs.filter((tab) => tab.id !== tabId),
    }))
  }

  const updateTab = (tabId: string, updates: Partial<{ label: string; enabled: boolean }>) => {
    setApplicationTabsConfig((prev) => ({
      ...prev,
      tabs: prev.tabs.map((tab) => (tab.id === tabId ? { ...tab, ...updates } : tab)),
    }))
  }

  const updateTabContent = (tabId: string, field: string, value: any) => {
    setApplicationTabsConfig((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        [tabId]: {
          ...prev.content[tabId],
          [field]: value,
        },
      },
    }))
  }

  const addApplication = (tabId: string) => {
    const currentApplications = applicationTabsConfig.content[tabId]?.applications || []
    updateTabContent(tabId, "applications", [...currentApplications, { name: "New Application", image: "" }])
  }

  const removeApplication = (tabId: string, index: number) => {
    const currentApplications = applicationTabsConfig.content[tabId]?.applications || []
    const updatedApplications = currentApplications.filter((_, i) => i !== index)
    updateTabContent(tabId, "applications", updatedApplications)
  }

  const updateApplication = (tabId: string, index: number, field: string, value: string) => {
    const currentApplications = applicationTabsConfig.content[tabId]?.applications || []
    const updatedApplications = [...currentApplications]
    updatedApplications[index] = { ...updatedApplications[index], [field]: value }
    updateTabContent(tabId, "applications", updatedApplications)
  }

  const handleApplicationImageUpload = async (tabId: string, appIndex: number, file: File) => {
    try {
      const fileName = `${Date.now()}_${file.name}`
      const path = `application-images/${companyData?.id}/${tabId}/${fileName}`
      const storageRef = ref(storage, path)

      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)

      updateApplication(tabId, appIndex, "image", downloadURL)
    } catch (error) {
      console.error("Error uploading application image:", error)
    }
  }

  const handleTabContentImageUpload = async (tabId: string, file: File) => {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        updateTabContent(tabId, "image", data.url)
      }
    } catch (error) {
      console.error("Error uploading image:", error)
    }
  }

  const updateRecentWorksItem = (index: number, key: string, value: any) => {
    setRecentWorksItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)))
  }

  const handleAboutUsClick = () => {
    // Load existing config from database
    const existingConfig = companyData?.web_config?.aboutUs
    if (existingConfig) {
      setAboutUsConfig(existingConfig)
    }
    setAboutUsDialogOpen(true)
  }

  const handleAboutUsSave = async () => {
    try {
      setAboutUsSaving(true)
      const updatedWebConfig = {
        ...companyData?.web_config,
        aboutUs: aboutUsConfig,
      }

      await updateDoc(doc(db, "companies", slug), {
        web_config: updatedWebConfig,
      })

      setCompanyData((prev) => ({
        ...prev,
        web_config: updatedWebConfig,
      }))

      setAboutUsDialogOpen(false)
    } catch (error) {
      console.error("Error saving About Us config:", error)
      alert("Failed to save changes. Please try again.")
    } finally {
      setAboutUsSaving(false)
    }
  }

  const handleAboutUsImageUpload = async (file: File) => {
    try {
      const storageRef = ref(storage, `about-us-images/${slug}/${Date.now()}_${file.name}`)
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)

      setAboutUsConfig((prev) => ({
        ...prev,
        image: downloadURL,
      }))
    } catch (error) {
      console.error("Error uploading About Us image:", error)
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

  const updateBulletPoint = (index: number, value: string) => {
    setWhyUsConfig((prev) => ({
      ...prev,
      bulletPoints: prev.bulletPoints.map((point, i) => (i === index ? value : point)),
    }))
  }

  const removeBulletPoint = (index: number) => {
    setWhyUsConfig((prev) => ({
      ...prev,
      bulletPoints: prev.bulletPoints.filter((_, i) => i !== index),
    }))
  }

  const addBulletPoint = () => {
    setWhyUsConfig((prev) => ({
      ...prev,
      bulletPoints: [...prev.bulletPoints, "New bullet point"],
    }))
  }

  const handleWhyUsVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("video/")) {
      try {
        const fileName = `${Date.now()}_${file.name}`
        const path = `why-us-videos/${slug}/${fileName}`
        const storageRef = ref(storage, path)

        const snapshot = await uploadBytes(storageRef, file)
        const downloadURL = await getDownloadURL(snapshot.ref)

        setWhyUsConfig((prev) => ({ ...prev, videoUrl: downloadURL }))
      } catch (error) {
        console.error("Error uploading Why Us video:", error)
      }
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid video file.",
        variant: "destructive",
      })
    }
  }

  const handleWhyUsSave = async () => {
    try {
      setWhyUsLoading(true)
      const updatedWebConfig = {
        ...companyData?.web_config,
        whyUs: whyUsConfig,
      }

      await updateDoc(doc(db, "companies", slug), {
        web_config: updatedWebConfig,
      })

      setCompanyData((prev) => ({
        ...prev,
        web_config: updatedWebConfig,
      }))

      setWhyUsDialog(false)
    } catch (error) {
      console.error("Error saving Why Us config:", error)
      alert("Failed to save changes. Please try again.")
    } finally {
      setWhyUsLoading(false)
    }
  }

  const handleWhyUsClick = () => {
    // Load existing config from database
    const existingConfig = companyData?.web_config?.whyUs
    if (existingConfig) {
      setWhyUsConfig(existingConfig)
    } else {
      setWhyUsConfig({
        bulletPoints: [
          "We create LED displays with a focus on quality and usability.",
          "Our products are conceived, designed, tested, and supported in-house to ensure quality control.",
          "We provide world-class support with our five-year product warranty, 10-year parts availability guarantee, and white glove service style.",
          "Since our founding, our company has relied on a tireless work ethic to outperform the competition.",
          "Thousands of businesses nationwide have trusted us as their LED display manufacturer.",
        ],
        videoUrl: "",
      })
    }
    setWhyUsDialog(true)
  }

  // const handleFeaturedProductsClick = () => {
  //   // TODO: Implement featured products edit functionality
  //   alert("Featured Products Section Edit Functionality Coming Soon!")
  // }

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

        {/* Our Technology Section */}
        <section id="our-technology" className="w-full" style={{ backgroundColor: theme.backgroundColor }}>
          <div className="w-full">
            <div className="text-center py-16 px-4">
              <EditableElement
                content={{
                  type: "heading",
                  content: companyData?.web_config?.ourTechnology?.mainTitle || "Our Technology, Your Way",
                  section: "ourTechnology",
                  field: "mainTitle",
                }}
              >
                <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: theme.textColor }}>
                  {companyData?.web_config?.ourTechnology?.mainTitle || "Our Technology, Your Way"}
                </h2>
              </EditableElement>

              <EditableElement
                content={{
                  type: "description",
                  content:
                    companyData?.web_config?.ourTechnology?.subtitle ||
                    "Digital Products for Any Space, Any Application",
                  section: "ourTechnology",
                  field: "subtitle",
                }}
              >
                <p className="text-xl md:text-2xl max-w-3xl mx-auto" style={{ color: theme.secondaryColor }}>
                  {companyData?.web_config?.ourTechnology?.subtitle ||
                    "Digital Products for Any Space, Any Application"}
                </p>
              </EditableElement>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 px-4">
              {productsLoading
                ? // Show loading placeholders
                  Array.from({ length: 12 }).map((_, index) => (
                    <div key={index} className="relative aspect-square overflow-hidden group cursor-pointer">
                      <div className="w-full h-full bg-gray-200 animate-pulse"></div>
                      <div className="absolute inset-0 bg-black/40"></div>
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="w-20 h-4 bg-gray-300 animate-pulse rounded"></div>
                      </div>
                    </div>
                  ))
                : products.length > 0
                  ? // Show real products data
                    products
                      .slice(0, 12)
                      .map((product, index) => (
                        <EditableElement
                          key={product.id}
                          content={{
                            type: "technology-card",
                            content: product.name,
                            section: "ourTechnology",
                            field: `technology_${index}`,
                          }}
                        >
                          <div className="relative aspect-square overflow-hidden group cursor-pointer hover:scale-105 transition-transform duration-300">
                            <img
                              src={
                                product.media?.[0]?.url ||
                                product.photo_urls?.[0] ||
                                `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(product.name) || "/placeholder.svg"}`
                              }
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300"></div>
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                              <h3 className="text-white font-semibold text-center text-sm md:text-base leading-tight">
                                {product.name}
                              </h3>
                            </div>
                          </div>
                        </EditableElement>
                      ))
                  : // Show fallback placeholders when no products
                    [
                      { name: "Indoor LCD", image: "/placeholder.svg?height=400&width=400&text=Indoor+LCD" },
                      {
                        name: "Digital Billboards",
                        image: "/placeholder.svg?height=400&width=400&text=Digital+Billboards",
                      },
                      { name: "LED Signs", image: "/placeholder.svg?height=400&width=400&text=LED+Signs" },
                      { name: "Scoreboards", image: "/placeholder.svg?height=400&width=400&text=Scoreboards" },
                      { name: "Video Walls", image: "/placeholder.svg?height=400&width=400&text=Video+Walls" },
                      {
                        name: "Software & Controllers",
                        image: "/placeholder.svg?height=400&width=400&text=Software+Controllers",
                      },
                      {
                        name: "ITS Dynamic Message Displays",
                        image: "/placeholder.svg?height=400&width=400&text=ITS+Dynamic+Message",
                      },
                      {
                        name: "Digital Street Furniture",
                        image: "/placeholder.svg?height=400&width=400&text=Digital+Street+Furniture",
                      },
                      {
                        name: "Digit & Price Display",
                        image: "/placeholder.svg?height=400&width=400&text=Digit+Price+Display",
                      },
                      { name: "Video Displays", image: "/placeholder.svg?height=400&width=400&text=Video+Displays" },
                      { name: "Sound Systems", image: "/placeholder.svg?height=400&width=400&text=Sound+Systems" },
                      {
                        name: "Freeform Elements",
                        image: "/placeholder.svg?height=400&width=400&text=Freeform+Elements",
                      },
                    ].map((tech, index) => (
                      <EditableElement
                        key={tech.name}
                        content={{
                          type: "technology-card",
                          content: tech.name,
                          section: "ourTechnology",
                          field: `technology_${index}`,
                        }}
                      >
                        <div className="relative aspect-square overflow-hidden group cursor-pointer hover:scale-105 transition-transform duration-300">
                          <img
                            src={companyData?.web_config?.ourTechnology?.technologies?.[index]?.image || tech.image}
                            alt={tech.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300"></div>
                          <div className="absolute inset-0 flex items-center justify-center p-4">
                            <h3 className="text-white font-semibold text-center text-sm md:text-base leading-tight">
                              {companyData?.web_config?.ourTechnology?.technologies?.[index]?.name || tech.name}
                            </h3>
                          </div>
                        </div>
                      </EditableElement>
                    ))}
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

            <div
              className="relative group cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50 rounded transition-all"
              onClick={(e) => {
                e.stopPropagation()
                handleApplicationTabsClick()
              }}
            >
              <ApplicationTabs
                theme={theme}
                config={companyData?.web_config?.applicationTabs || applicationTabsConfig}
                content={companyData?.web_config?.applicationTabs?.content}
              />
              <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-blue-500 text-white p-1 rounded-bl text-xs flex items-center gap-1">
                  <Edit3 className="w-3 h-3" />
                  Edit Tabs
                </div>
              </div>
            </div>
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


        {/* Footer Section */}
        <footer className="bg-gray-900 text-white py-16">
          <Dialog open={footerDialog} onOpenChange={setFooterDialog}>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
              <DialogHeader className="pb-6">
                <DialogTitle className="text-2xl font-bold">Edit Footer Section</DialogTitle>
                <p className="text-gray-600 mt-2">
                  Customize your footer content, contact information, and social media links
                </p>
              </DialogHeader>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column - Main Content */}
                <div className="xl:col-span-2 space-y-6">
                  {/* Header Section */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900">Header Content</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                        <input
                          type="text"
                          value={footerConfig.title}
                          onChange={(e) => setFooterConfig((prev) => ({ ...prev, title: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter footer title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                        <input
                          type="text"
                          value={footerConfig.subtitle}
                          onChange={(e) => setFooterConfig((prev) => ({ ...prev, subtitle: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter footer subtitle"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
                        <input
                          type="text"
                          value={footerConfig.buttonText}
                          onChange={(e) => setFooterConfig((prev) => ({ ...prev, buttonText: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter button text"
                        />
                      </div>

                      {/* Color Controls */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={footerConfig.backgroundColor}
                              onChange={(e) =>
                                setFooterConfig((prev) => ({ ...prev, backgroundColor: e.target.value }))
                              }
                              className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={footerConfig.backgroundColor}
                              onChange={(e) =>
                                setFooterConfig((prev) => ({ ...prev, backgroundColor: e.target.value }))
                              }
                              className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="#ffffff"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={footerConfig.textColor}
                              onChange={(e) => setFooterConfig((prev) => ({ ...prev, textColor: e.target.value }))}
                              className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={footerConfig.textColor}
                              onChange={(e) => setFooterConfig((prev) => ({ ...prev, textColor: e.target.value }))}
                              className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="#ffffff"
                            />
                          </div>
                        </div>
                      </div>

                      {/*  Added section title color control */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Section Title Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={footerConfig.sectionTitleColor || footerConfig.textColor}
                            onChange={(e) =>
                              setFooterConfig((prev) => ({ ...prev, sectionTitleColor: e.target.value }))
                            }
                            className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={footerConfig.sectionTitleColor || footerConfig.textColor}
                            onChange={(e) =>
                              setFooterConfig((prev) => ({ ...prev, sectionTitleColor: e.target.value }))
                            }
                            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* About Us Section */}
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">About Us Section</h3>
                      <span className="text-sm text-gray-500">{footerConfig.aboutUs?.links?.length || 0} links</span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Section Title</label>
                        <input
                          type="text"
                          value={footerConfig.aboutUs.title}
                          onChange={(e) =>
                            setFooterConfig((prev) => ({
                              ...prev,
                              aboutUs: { ...prev.aboutUs, title: e.target.value },
                            }))
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter section title"
                        />
                      </div>
                      <div className="space-y-3">
                        {(footerConfig.aboutUs?.links || []).map((link, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <input
                              type="text"
                              value={link}
                              onChange={(e) => updateAboutUsLink(index, e.target.value)}
                              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter link text"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAboutUsLink(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={addAboutUsLink}
                          className="w-full border-dashed bg-transparent"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Link
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">Address Section</h3>
                      <span className="text-sm text-gray-500">{footerConfig.address?.lines?.length || 0} lines</span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Section Title</label>
                        <input
                          type="text"
                          value={footerConfig.address.title}
                          onChange={(e) =>
                            setFooterConfig((prev) => ({
                              ...prev,
                              address: { ...prev.address, title: e.target.value },
                            }))
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter section title"
                        />
                      </div>
                      <div className="space-y-3">
                        {(footerConfig.address?.lines || []).map((line, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <input
                              type="text"
                              value={line}
                              onChange={(e) => updateAddressLine(index, e.target.value)}
                              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter address line"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAddressLine(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={addAddressLine}
                          className="w-full border-dashed bg-transparent"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Address Line
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Social Media Section */}
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">Social Media Section</h3>
                      <span className="text-sm text-gray-500">
                        {footerConfig.followUs?.socialLinks?.length || 0} links
                      </span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Section Title</label>
                        <input
                          type="text"
                          value={footerConfig.followUs.title}
                          onChange={(e) =>
                            setFooterConfig((prev) => ({
                              ...prev,
                              followUs: { ...prev.followUs, title: e.target.value },
                            }))
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter section title"
                        />
                      </div>
                      <div className="space-y-3">
                        {footerConfig.followUs.socialLinks.map((social, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                            <div className="flex-1 grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={social.name}
                                onChange={(e) => updateSocialLink(index, "name", e.target.value)}
                                className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Platform name"
                              />
                              <input
                                type="text"
                                value={social.url}
                                onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                                className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="URL"
                              />
                            </div>
                            <select
                              value={social.icon}
                              onChange={(e) => updateSocialLink(index, "icon", e.target.value)}
                              className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="twitter">Twitter</option>
                              <option value="youtube">YouTube</option>
                              <option value="linkedin">LinkedIn</option>
                              <option value="pinterest">Pinterest</option>
                              <option value="tiktok">TikTok</option>
                              <option value="facebook">Facebook</option>
                              <option value="instagram">Instagram</option>
                            </select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSocialLink(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={addSocialLink}
                          className="w-full border-dashed bg-transparent"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Social Link
                        </Button>
                      </div>
                    </div>

                    {/* Copyright Section */}
                    <div className="border-t pt-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Copyright Text</label>
                        <input
                          type="text"
                          value={footerConfig.copyright}
                          onChange={(e) => setFooterConfig((prev) => ({ ...prev, copyright: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter copyright text"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Live Preview */}
                <div className="space-y-6">
                  <div className="sticky top-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Live Preview</h3>
                    <div
                      className="border-2 border-gray-200 rounded-xl overflow-hidden"
                      style={{
                        backgroundColor: footerConfig.backgroundColor,
                        color: footerConfig.textColor,
                      }}
                    >
                      <div className="py-8 text-center px-4">
                        <h2 className="text-2xl font-bold mb-2">{footerConfig.title}</h2>
                        <p className="mb-4 text-sm opacity-75">{footerConfig.subtitle}</p>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors">
                          {footerConfig.buttonText}
                        </button>
                      </div>

                      <div className="border-t border-opacity-20 p-4" style={{ borderColor: footerConfig.textColor }}>
                        <div className="grid grid-cols-1 gap-4 mb-4 text-xs">
                          {/* About Us Preview */}
                          <div>
                            {/*  Applied section title color to preview */}
                            <h3
                              className="font-semibold mb-2"
                              style={{ color: footerConfig.sectionTitleColor || footerConfig.textColor }}
                            >
                              {footerConfig.aboutUs.title}
                            </h3>
                            <div className="opacity-75 space-y-1">
                              {footerConfig.aboutUs.links.map((link, index) => (
                                <p key={index}>{link}</p>
                              ))}
                            </div>
                          </div>

                          {/* Address Preview */}
                          <div>
                            {/*  Applied section title color to preview */}
                            <h3
                              className="font-semibold mb-2"
                              style={{ color: footerConfig.sectionTitleColor || footerConfig.textColor }}
                            >
                              {footerConfig.address.title}
                            </h3>
                            <div className="opacity-75 space-y-1">
                              {footerConfig.address.lines.map((line, index) => (
                                <p key={index}>{line}</p>
                              ))}
                            </div>
                          </div>

                          {/* Social Media Preview */}
                          <div>
                            {/*  Applied section title color to preview */}
                            <h3
                              className="font-semibold mb-2"
                              style={{ color: footerConfig.sectionTitleColor || footerConfig.textColor }}
                            >
                              {footerConfig.followUs.title}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {footerConfig.followUs.socialLinks.map((social, index) => (
                                <div
                                  key={index}
                                  className="w-5 h-5 opacity-60 rounded"
                                  style={{ backgroundColor: footerConfig.textColor }}
                                ></div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div
                          className="border-t border-opacity-20 pt-4 text-center"
                          style={{ borderColor: footerConfig.textColor }}
                        >
                          <p className="opacity-75 text-xs">{footerConfig.copyright}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-6 border-t">
                <Button variant="outline" onClick={() => setFooterDialog(false)} className="px-6">
                  Cancel
                </Button>
                <Button onClick={handleFooterSave} disabled={footerLoading} className="px-6">
                  {footerLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div
            className="relative group cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50 rounded-lg transition-all"
            onClick={handleFooterClick}
            style={{
              backgroundColor:
                companyData?.web_config?.footer?.backgroundColor ||
                companyData?.theme?.footerBackgroundColor ||
                "#0f172a",
              color: companyData?.web_config?.footer?.textColor || companyData?.theme?.footerTextColor || "#ffffff",
            }}
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <div className="bg-blue-500 text-white px-3 py-1 rounded text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                Edit Footer Section
              </div>
            </div>

            <div className="py-16 text-center">
              <h2 className="text-4xl lg:text-5xl font-bold mb-4">
                {companyData?.web_config?.footer?.title || "How Can We Help You?"}
              </h2>

              <p className="text-lg mb-8 opacity-75">
                {companyData?.web_config?.footer?.subtitle || "Feel free to let us know."}
              </p>

              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
                {companyData?.web_config?.footer?.buttonText || "contact us"}
              </button>
            </div>

            <div className="border-t border-slate-800 py-8">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                  {/* About Us Section */}
                  <div className="text-left">
                    {/*  Applied section title color to live footer */}
                    <h3
                      className="font-semibold mb-4"
                      style={{
                        color:
                          companyData?.web_config?.footer?.sectionTitleColor ||
                          companyData?.web_config?.footer?.textColor ||
                          "#ffffff",
                      }}
                    >
                      {companyData?.web_config?.footer?.aboutUs?.title || "About Us"}
                    </h3>
                    <div
                      className="space-y-2"
                      style={{ color: companyData?.web_config?.footer?.textColor || "#ffffff" }}
                    >
                      {(
                        companyData?.web_config?.footer?.aboutUs?.links || [
                          "About Display Options Solution",
                          "Careers",
                          "News & Events",
                          "Investor Relations",
                        ]
                      ).map((link, index) => (
                        <p key={index} className="opacity-75 hover:opacity-100 cursor-pointer transition-opacity">
                          {link}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="text-left">
                    {/*  Applied section title color to live footer */}
                    <h3
                      className="font-semibold mb-4"
                      style={{
                        color:
                          companyData?.web_config?.footer?.sectionTitleColor ||
                          companyData?.web_config?.footer?.textColor ||
                          "#ffffff",
                      }}
                    >
                      {companyData?.web_config?.footer?.address?.title || "Address"}
                    </h3>
                    <div
                      className="space-y-2"
                      style={{ color: companyData?.web_config?.footer?.textColor || "#ffffff" }}
                    >
                      {(
                        companyData?.web_config?.footer?.address?.lines || [
                          "No. 18 Haoye Road, Fuhai Sub-district, Bao'an District",
                          "Shenzhen, Guangdong Province",
                          "sales@unilumin.com",
                          "+86-755-29019999",
                        ]
                      ).map((line, index) => (
                        <p key={index} className="opacity-75">
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Follow Us Section */}
                  <div className="text-left">
                    {/*  Applied section title color to live footer */}
                    <h3
                      className="font-semibold mb-4"
                      style={{
                        color:
                          companyData?.web_config?.footer?.sectionTitleColor ||
                          companyData?.web_config?.footer?.textColor ||
                          "#ffffff",
                      }}
                    >
                      {companyData?.web_config?.footer?.followUs?.title || "Follow Us"}
                    </h3>
                    <div className="flex space-x-4">
                      {(
                        companyData?.web_config?.footer?.followUs?.socialLinks || [
                          { name: "Twitter", url: "#", icon: "twitter" },
                          { name: "YouTube", url: "#", icon: "youtube" },
                          { name: "LinkedIn", url: "#", icon: "linkedin" },
                          { name: "Pinterest", url: "#", icon: "pinterest" },
                          { name: "TikTok", url: "#", icon: "tiktok" },
                        ]
                      ).map((social, index) => (
                        <a key={index} href={social.url} className="text-gray-400 hover:text-white transition-colors">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            {social.icon === "twitter" && (
                              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-1.98.366 4.924 4.924 0 004.6 3.417A9.867 9.867 0 010 19.54a13.94 13.94 0 007.548 2.212c9.142 0 14.307-7.721 13.995-14.646A10.025 10.025 0 0024 4.59z" />\
