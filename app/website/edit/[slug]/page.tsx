"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ArrowLeft, Edit3, ImageIcon, Palette, Loader2, Trash2, Plus } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

import ApplicationTabs from "@/components/ApplicationTabs"
import FeaturedProductsEditDialog from "@/components/featured-products-edit-dialog"

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

        {/* Featured Products Section */}
        <FeaturedProductsEditDialog>
          <section id="products" className="py-16 bg-white">
            <div className="w-full">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4 text-gray-900">Featured Products</h2>

                <div>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    {companyData?.web_config?.products?.section_description ||
                      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}
                  </p>
                </div>
              </div>

              {productsLoading ? (
                <div className="flex justify-center items-center min-h-[400px]">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading products...</span>
                </div>
              ) : products.length > 0 ? (
                <div className="flex flex-col lg:flex-row min-h-[600px]">
                  <div className="w-full lg:w-1/2 flex items-center p-8 lg:p-16">
                    <div className="w-full h-full flex flex-col justify-center space-y-8">
                      <div>
                        <div>
                          <h3 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">
                            {products[0]?.name || "Featured Product"}
                          </h3>
                        </div>

                        <div>
                          <p className="text-lg text-gray-600 mb-8">
                            {products[0]?.description || "Professional LED solution for your business needs."}
                          </p>
                        </div>

                        <div>
                          <button className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold mb-8">
                            View More
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-4 flex-wrap">
                        {products.slice(0, 4).map((product, index) => (
                          <div key={product.id} className="text-center">
                            <div
                              className={`w-20 h-16 rounded-lg mb-2 flex items-center justify-center ${
                                index === 0 ? "bg-blue-600" : "bg-gray-200"
                              }`}
                            >
                              {product.media?.[0]?.url ? (
                                <img
                                  src={product.media[0].url || "/placeholder.svg"}
                                  alt={product.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-300 rounded flex items-center justify-center">
                                  <span className="text-xs font-bold text-gray-600">{product.name.charAt(0)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="w-full lg:w-1/2 relative p-8 lg:p-16">
                    <div className="w-full mx-auto aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden mb-6 flex items-center justify-center">
                      {products[0]?.media?.[0]?.url ? (
                        <img
                          src={products[0].media[0].url || "/placeholder.svg"}
                          alt={products[0].name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src="/placeholder.svg?height=400&width=400"
                          alt="Product Display"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                  <div className="text-gray-400 mb-4">
                    <ImageIcon className="h-16 w-16 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
                    <p className="text-gray-500">
                      No products have been added for this company yet. Add products to display them here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </FeaturedProductsEditDialog>

        {/* About Us Section */}
        <section id="about-us" className="bg-background">
          <div className="w-full">
            <div
              className="flex flex-col lg:flex-row min-h-[600px] relative group cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50 rounded transition-all"
              onClick={handleAboutUsClick}
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <div className="bg-blue-500 text-white px-3 py-2 rounded flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  Edit About Us
                </div>
              </div>

              <div
                className="w-full lg:w-1/2 text-white flex items-center p-8 lg:p-16"
                style={{
                  backgroundColor: companyData?.web_config?.aboutUs?.backgroundColor || "#111827",
                  color: companyData?.web_config?.aboutUs?.textColor || "#ffffff",
                }}
              >
                <div className="max-w-xl">
                  <h2 className="text-4xl lg:text-5xl font-bold mb-4">
                    {/* Removed title from editable config, keeping it fixed as "About Us" */}About Us
                  </h2>

                  <h3
                    className="text-xl lg:text-2xl mb-8"
                    style={{ color: companyData?.web_config?.aboutUs?.subtitleColor || "#d1d5db" }}
                  >
                    {companyData?.web_config?.aboutUs?.subtitle || "Consectetur Adipiscing Elit"}
                  </h3>

                  <p className="mb-8 text-sm leading-relaxed">
                    {companyData?.web_config?.aboutUs?.description ||
                      "Professional LED solutions for businesses worldwide. Quality, innovation, and reliability in every product."}
                  </p>

                  <div className="mb-8">
                    <h3 className="font-semibold mb-2 text-sm">Contact Us</h3>
                    <p className="text-sm">{companyData?.web_config?.aboutUs?.contactPhone || "+63 (2) 8123-4567"}</p>
                  </div>

                  <Button
                    onClick={handleAboutUsSave}
                    disabled={aboutUsSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {aboutUsSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </div>

              <div className="w-full lg:w-1/2 relative">
                <img
                  src={companyData?.web_config?.aboutUs?.image || "/placeholder.svg?height=600&width=800"}
                  alt="About Us"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Why Us Section */}
        <section id="why-us" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <Dialog open={whyUsDialog} onOpenChange={setWhyUsDialog}>
              <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
                <DialogHeader className="pb-6">
                  <DialogTitle className="text-2xl font-bold">Edit Why Us Section</DialogTitle>
                  <p className="text-gray-600 mt-2">
                    Manage your bullet points and upload a video to showcase your company's strengths
                  </p>
                </DialogHeader>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Left Column - Bullet Points Management */}
                  <div className="xl:col-span-2 space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">Bullet Points</h3>
                        <span className="text-sm text-gray-500">{whyUsConfig.bulletPoints.length} points</span>
                      </div>

                      <div className="space-y-4">
                        {whyUsConfig.bulletPoints.map((point, index) => (
                          <div key={index} className="group relative">
                            <div className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-all duration-200 bg-white">
                              <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full font-semibold text-sm flex-shrink-0 mt-1">
                                {index + 1}
                              </div>
                              <textarea
                                value={point}
                                onChange={(e) => updateBulletPoint(index, e.target.value)}
                                className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800"
                                rows={3}
                                placeholder="Enter your bullet point text here..."
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeBulletPoint(index)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0"
                              >
                                <Trash2 className="w-5 h-5" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        <Button
                          variant="outline"
                          onClick={addBulletPoint}
                          className="w-full h-16 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-gray-600 hover:text-blue-600 bg-transparent"
                        >
                          <Plus className="w-5 h-5 mr-3" />
                          Add New Bullet Point
                        </Button>
                      </div>
                    </div>

                    {/* Video Upload Section */}
                    <div className="border-t pt-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">Video Content</h3>
                      <div className="space-y-4">
                        {!whyUsConfig.videoUrl ? (
                          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-200">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg
                                className="w-8 h-8 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Upload Your Video</h4>
                            <p className="text-gray-600 mb-4">
                              Add a compelling video to showcase your company's strengths
                            </p>
                            <label className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                              </svg>
                              Choose Video File
                              <input
                                type="file"
                                accept="video/*"
                                onChange={handleWhyUsVideoUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                        ) : (
                          <div className="relative rounded-xl overflow-hidden border-2 border-gray-200">
                            <video src={whyUsConfig.videoUrl} className="w-full h-48 object-cover" controls />
                            <div className="absolute top-3 right-3">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setWhyUsConfig((prev) => ({ ...prev, videoUrl: "" }))}
                                className="bg-red-500 hover:bg-red-600 text-white border-0"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove
                              </Button>
                            </div>
                            <div className="p-4 bg-white border-t">
                              <p className="text-sm text-gray-600">Video uploaded successfully</p>
                              <label className="inline-flex items-center mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer text-sm">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                  />
                                </svg>
                                Replace Video
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={handleWhyUsVideoUpload}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Live Preview */}
                  <div className="space-y-6">
                    <div className="sticky top-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Live Preview</h3>
                      <div className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50">
                        <h4 className="text-2xl font-bold text-black mb-6">
                          WHY {companyData?.name?.toUpperCase() || "CHOOSE US"}?
                        </h4>

                        <div className="space-y-4 mb-6">
                          {whyUsConfig.bulletPoints.map((point, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                              <p className="text-sm text-gray-800 leading-relaxed">{point}</p>
                            </div>
                          ))}
                        </div>

                        {whyUsConfig.videoUrl && (
                          <div className="aspect-video rounded-lg overflow-hidden bg-gray-200">
                            <video
                              src={whyUsConfig.videoUrl}
                              className="w-full h-full object-cover"
                              controls
                              autoPlay
                              muted
                              loop
                            />
                          </div>
                        )}

                        {!whyUsConfig.videoUrl && (
                          <div className="aspect-video rounded-lg bg-gray-200 flex items-center justify-center">
                            <div className="text-center text-gray-500">
                              <svg
                                className="w-12 h-12 mx-auto mb-2 opacity-50"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1}
                                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                              <p className="text-sm">Video will appear here</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-6 border-t">
                  <Button variant="outline" onClick={() => setWhyUsDialog(false)} className="px-6">
                    Cancel
                  </Button>
                  <Button onClick={handleWhyUsSave} disabled={whyUsLoading} className="px-6">
                    {whyUsLoading ? (
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
              className="flex flex-col lg:flex-row items-center gap-12 relative group cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50 rounded-lg p-4 transition-all"
              onClick={handleWhyUsClick}
            >
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <div className="bg-blue-500 text-white px-3 py-1 rounded text-sm flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  Edit Why Us Section
                </div>
              </div>

              <div className="w-full lg:w-1/2">
                <h2 className="text-4xl lg:text-5xl font-bold text-black mb-8">
                  WHY {companyData?.name?.toUpperCase() || "CHOOSE US"}?
                </h2>

                <div className="space-y-6">
                  {(
                    companyData?.web_config?.whyUs?.bulletPoints || [
                      "We create LED displays with a focus on quality and usability.",
                      "Our products are conceived, designed, tested, and supported in-house to ensure quality control.",
                      `${companyData?.name || "We"} provide world-class support with our five-year product warranty, 10-year parts availability guarantee, and white glove service style.`,
                      "Since our founding, our company has relied on a tireless work ethic to outperform the competition.",
                      `Thousands of businesses nationwide have trusted ${companyData?.name || "us"} as their LED display manufacturer.`,
                    ]
                  ).map((text, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p
                        className="text-lg text-gray-800"
                        dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full lg:w-1/2">
                <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
                  {companyData?.web_config?.whyUs?.videoUrl ? (
                    <video
                      src={companyData.web_config.whyUs.videoUrl}
                      className="w-full h-full object-cover"
                      controls
                      poster="/placeholder.svg?height=400&width=600"
                    />
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Section */}
        <footer className="bg-slate-900 text-white">
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
                              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                            )}
                            {social.icon === "youtube" && (
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            )}
                            {social.icon === "linkedin" && (
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            )}
                            {social.icon === "pinterest" && (
                              <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.347-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z" />
                            )}
                            {social.icon === "tiktok" && (
                              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                            )}\
                          </svg
