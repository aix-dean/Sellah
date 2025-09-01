"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Menu, X, Zap, Monitor, Lightbulb, Box, RotateCcw, Volume2, VolumeX, ChevronDown } from "lucide-react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import ApplicationTabs from "@/components/ApplicationTabs" // Import ApplicationTabs component
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

export default function WebsitePage() {
  const params = useParams()
  const companySlug = params.slug as string
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [companyData, setCompanyData] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<any>(null)
  const [heroVideo, setHeroVideo] = useState<string | null>(null)
  const [isVideoMuted, setIsVideoMuted] = useState(true)
  const [heroContent, setHeroContent] = useState<any>(null)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [autoSwipeInterval, setAutoSwipeInterval] = useState<NodeJS.Timeout | null>(null)
  const [featuredProductsEditDialog, setFeaturedProductsEditDialog] = useState(false)
  const [featuredProductsEditData, setFeaturedProductsEditData] = useState({
    sectionTitle: "",
    sectionDescription: "",
    productTitle: "",
    productDescription: "",
    buttonText: "",
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
  })
  const [selectedProductIndex, setSelectedProductIndex] = useState(0)
  const [isProductBrief, setIsProductBrief] = useState(false)

  useEffect(() => {
    if (companySlug === "product-brief") {
      setIsProductBrief(true)
      setLoading(false)
      return
    } else {
      setIsProductBrief(false)
    }

    const fetchCompanyData = async () => {
      try {
        setLoading(true)

        const companyId = companySlug

        const companyDocRef = doc(db, "companies", companyId)
        const companyDoc = await getDoc(companyDocRef)

        if (companyDoc.exists()) {
          const companyInfo = { id: companyDoc.id, ...companyDoc.data() }
          setCompanyData(companyInfo)

          console.log("[v0] Company data:", companyInfo)
          console.log("[v0] ApplicationTabs config:", companyInfo?.web_config?.applicationTabs)
          console.log("[v0] ApplicationTabs content:", companyInfo?.web_config?.applicationTabs?.content)

          // Log specific Indoor tab data to see if applications have images
          const indoorContent = companyInfo?.web_config?.applicationTabs?.content?.Indoor
          console.log("[v0] Indoor content:", indoorContent)
          if (indoorContent?.applications) {
            console.log("[v0] Indoor applications:", indoorContent.applications)
            indoorContent.applications.forEach((app: any, index: number) => {
              console.log(`[v0] Application ${index}:`, app)
            })
          }

          console.log("[v0] Company data:", companyInfo)

          if (companyInfo.web_config?.heroContent) {
            console.log("[v0] Hero content found in web_config.heroContent:", companyInfo.web_config.heroContent)
            setHeroContent(companyInfo.web_config.heroContent)
          }

          let videoUrl = null

          if (companyInfo.web_config?.heroVideoUrl) {
            console.log("[v0] Hero video URL found in web_config.heroVideoUrl:", companyInfo.web_config.heroVideoUrl)
            videoUrl = companyInfo.web_config.heroVideoUrl
          }
          // Check company document for hero_video (existing behavior)
          else if (companyInfo.hero_video) {
            console.log("[v0] Hero video URL found in company document:", companyInfo.hero_video)
            videoUrl = companyInfo.hero_video
          } else {
            console.log("[v0] No hero video found in main document, checking website_config subcollection")

            try {
              const websiteConfigThemeRef = doc(db, "companies", companyId, "website_config", "theme")
              const websiteConfigThemeDoc = await getDoc(websiteConfigThemeRef)

              console.log("[v0] Checking companies/" + companyId + "/website_config/theme document...")

              if (websiteConfigThemeDoc.exists()) {
                const themeData = websiteConfigThemeDoc.data()
                console.log("[v0] Website config theme document found with data:", themeData)

                if (themeData.hero_video) {
                  console.log("[v0] Hero video URL found in website_config theme:", themeData.hero_video)
                  videoUrl = themeData.hero_video
                } else {
                  console.log("[v0] No hero_video field in website_config theme document")
                }
              } else {
                console.log("[v0] Website config theme document does not exist in subcollection")
              }

              // If still no video found, scan all documents in the website_config subcollection
              if (!videoUrl) {
                console.log("[v0] Scanning all website_config subcollection documents...")
                const websiteConfigCollection = collection(db, "companies", companyId, "website_config")
                const websiteConfigSnapshot = await getDocs(websiteConfigCollection)

                console.log(
                  "[v0] Found",
                  websiteConfigSnapshot.docs.length,
                  "documents in website_config subcollection",
                )

                websiteConfigSnapshot.docs.forEach((doc) => {
                  console.log("[v0] Website config subcollection document ID:", doc.id)
                  console.log("[v0] Website config subcollection document data:", doc.data())

                  const data = doc.data()
                  if (data.hero_video) {
                    console.log("[v0] Found hero_video in subcollection document", doc.id, ":", data.hero_video)
                    if (!videoUrl) {
                      videoUrl = data.hero_video
                      console.log("[v0] Using hero_video from subcollection document:", doc.id)
                    }
                  }

                  // Check nested theme object
                  if (data.theme && data.theme.hero_video) {
                    console.log(
                      "[v0] Found hero_video in theme of subcollection document",
                      doc.id,
                      ":",
                      data.theme.hero_video,
                    )
                    if (!videoUrl) {
                      videoUrl = data.theme.hero_video
                      console.log("[v0] Using hero_video from theme in subcollection document:", doc.id)
                    }
                  }
                })
              }
            } catch (configError) {
              console.error("[v0] Error fetching website config subcollection:", configError)
            }
          }

          if (videoUrl) {
            console.log("[v0] Final video URL found:", videoUrl)
            try {
              new URL(videoUrl)
              setHeroVideo(videoUrl)
              console.log("[v0] Hero video URL is valid and set:", videoUrl)
            } catch (error) {
              console.error("[v0] Invalid hero video URL format:", videoUrl, error)
              setHeroVideo(null) // Remove video on error
            }
          } else {
            console.log("[v0] No hero video found in any location")
            console.log("[v0] To add a hero video, add a 'hero_video' field to either:")
            console.log("[v0] 1. Your Firebase company document")
            console.log("[v0] 2. A 'website_config' collection with a document matching your company ID")
            console.log("[v0] 3. A 'website_config' collection with a 'theme' document")
            setHeroVideo(null)
          }

          await fetchThemeConfig(companyDoc.id)
          await fetchCompanyProducts(companyDoc.id)
        } else {
          console.error("Company not found with ID:", companyId)
          setCompanyData({
            name: "Company",
            business_type: "LED Solutions Provider",
          })
          setFallbackProducts()
        }
      } catch (error) {
        console.error("Error fetching company data:", error)
        setCompanyData({
          name: "Company",
          business_type: "LED Solutions Provider",
        })
        setFallbackProducts()
      } finally {
        setLoading(false)
      }
    }

    const fetchThemeConfig = async (companyId: string) => {
      try {
        console.log("[v0] Fetching theme config for company:", companyId)
        const companyDocRef = doc(db, "companies", companyId)
        const companyDoc = await getDoc(companyDocRef)

        let themeData = {}

        if (companyDoc.exists()) {
          const companyData = companyDoc.data()
          if (companyData.theme) {
            themeData = { ...companyData.theme }
            console.log("[v0] Found theme in main company document:", themeData)
          }

          if (companyData.web_config?.theme) {
            console.log("[v0] Found theme in web_config field:", companyData.web_config.theme)
            // Merge web_config theme data with main theme data, web_config takes precedence
            themeData = { ...themeData, ...companyData.web_config.theme }
            console.log("[v0] Merged theme data:", themeData)
          }
        }

        // Also check web_config.theme subcollection for updated theme data
        const webConfigThemeRef = doc(db, "companies", companyId, "web_config", "theme")
        const webConfigThemeDoc = await getDoc(webConfigThemeRef)

        if (webConfigThemeDoc.exists()) {
          const webConfigThemeData = webConfigThemeDoc.data()
          console.log("[v0] Found theme in web_config subcollection:", webConfigThemeData)
          // Merge web_config theme data with main theme data
          themeData = { ...themeData, ...webConfigThemeData }
          console.log("[v0] Final merged theme data:", themeData)
        } else {
          console.log("[v0] No web_config.theme document found in subcollection")
        }

        if (Object.keys(themeData).length > 0) {
          console.log("[v0] Setting theme state with:", themeData)
          setTheme(themeData)
          applyTheme(themeData)
        } else {
          console.log("[v0] No theme data found")
        }
      } catch (error) {
        console.error("[v0] Error fetching theme config:", error)
      }
    }

    const applyTheme = (themeData: any) => {
      if (!themeData) return

      const root = document.documentElement

      if (themeData.primaryColor) {
        root.style.setProperty("--primary", themeData.primaryColor)
        root.style.setProperty("--primary-foreground", "#ffffff")
        const hex = themeData.primaryColor.replace("#", "")
        const r = Number.parseInt(hex.substr(0, 2), 16)
        const g = Number.parseInt(hex.substr(2, 2), 16)
        const b = Number.parseInt(hex.substr(4, 2), 16)
        root.style.setProperty("--primary-rgb", `${r}, ${g}, ${b}`)
      }

      if (themeData.secondaryColor) {
        root.style.setProperty("--secondary", themeData.secondaryColor)
        root.style.setProperty("--secondary-foreground", "#ffffff")
      }

      if (themeData.accentColor) {
        root.style.setProperty("--accent", themeData.accentColor)
        root.style.setProperty("--accent-foreground", "#ffffff")
      }

      if (themeData.backgroundColor) {
        root.style.setProperty("--background", themeData.backgroundColor)
      }

      if (themeData.textColor) {
        root.style.setProperty("--foreground", themeData.textColor)
        root.style.setProperty("--muted-foreground", themeData.textColor + "80")
      }

      if (themeData.buttonColor) {
        root.style.setProperty("--button", themeData.buttonColor)
        root.style.setProperty("--button-foreground", themeData.buttonTextColor || "#ffffff")
      }

      if (themeData.headerColor) {
        root.style.setProperty("--header", themeData.headerColor)
        root.style.setProperty("--header-foreground", "#ffffff")
      }

      if (themeData.footerBackgroundColor) {
        root.style.setProperty("--footer", themeData.footerBackgroundColor)
        root.style.setProperty("--footer-foreground", themeData.footerTextColor || "#ffffff")
      }

      const primaryElements = document.querySelectorAll(".bg-primary, .text-primary, .border-primary")
      primaryElements.forEach((element) => {
        if (element.classList.contains("bg-primary")) {
          ;(element as HTMLElement).style.backgroundColor = themeData.primaryColor
        }
        if (element.classList.contains("text-primary")) {
          ;(element as HTMLElement).style.color = themeData.primaryColor
        }
        if (element.classList.contains("border-primary")) {
          ;(element as HTMLElement).style.borderColor = themeData.primaryColor
        }
      })

      const buttonElements = document.querySelectorAll("button, .btn")
      buttonElements.forEach((element) => {
        if (
          themeData.buttonColor &&
          !element.classList.contains("variant-ghost") &&
          !element.classList.contains("variant-outline")
        ) {
          ;(element as HTMLElement).style.backgroundColor = themeData.buttonColor
          ;(element as HTMLElement).style.borderColor = themeData.buttonColor
          ;(element as HTMLElement).style.color = themeData.buttonTextColor || "#ffffff"
        }
      })

      const headerElements = document.querySelectorAll("header, nav, .header-element")
      headerElements.forEach((element) => {
        if (themeData.headerColor) {
          ;(element as HTMLElement).style.backgroundColor = themeData.headerColor
        }
      })

      const footerElements = document.querySelectorAll("footer, .footer-element")
      footerElements.forEach((element) => {
        if (themeData.footerBackgroundColor) {
          ;(element as HTMLElement).style.backgroundColor = themeData.footerBackgroundColor
        }
        if (themeData.footerTextColor) {
          ;(element as HTMLElement).style.color = themeData.footerTextColor
        }
      })
    }

    const fetchCompanyProducts = async (companyId: string) => {
      try {
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
        }))

        console.log("Fetched products:", companyProducts)
        setProducts(companyProducts)

        if (companyProducts.length === 0) {
          console.log("No products found for company, showing fallback products")
          setFallbackProducts()
        }
      } catch (error) {
        console.error("Error fetching company products:", error)
        setFallbackProducts()
      }
    }

    const setFallbackProducts = () => {
      setProducts([
        {
          id: 1,
          name: "LED Poster",
          slug: "led-poster",
          icon: <Monitor className="h-8 w-8" />,
          description: "High-resolution LED posters for advertising and information display",
          features: ["4K Resolution", "Lightweight Design", "Easy Installation", "Remote Control"],
          specs: {
            Resolution: "3840 x 2160",
            Brightness: "2500 nits",
            "Viewing Angle": "160°",
            "Power Consumption": "150W",
            Weight: "15kg",
            Dimensions: "1920 x 1080mm",
          },
        },
        {
          id: 2,
          name: "LED Wall",
          slug: "led-wall",
          icon: <Box className="h-8 w-8" />,
          description: "Modular LED wall systems for large-scale displays and events",
          features: ["Modular Design", "Seamless Connection", "High Brightness", "Weather Resistant"],
          specs: {
            "Pixel Pitch": "2.5mm - 10mm",
            Brightness: "5000 nits",
            "Refresh Rate": "3840Hz",
            "Power Consumption": "800W/sqm",
            "Operating Temp": "-20°C to +60°C",
            "IP Rating": "IP65",
          },
        },
        {
          id: 3,
          name: "Floodlights",
          slug: "floodlights",
          icon: <Lightbulb className="h-8 w-8" />,
          description: "Energy-efficient LED floodlights for outdoor and industrial lighting",
          features: ["Energy Efficient", "Long Lifespan", "Weather Proof", "Adjustable Beam"],
          specs: {
            Power: "50W - 500W",
            "Luminous Flux": "15000 lm",
            "Color Temperature": "3000K - 6500K",
            "Beam Angle": "15° - 120°",
            Lifespan: "50,000 hours",
            "IP Rating": "IP66",
          },
        },
        {
          id: 4,
          name: "3D 4x4 Hologram Fan",
          slug: "3d-4x4-hologram-fan",
          icon: <Zap className="h-8 w-8" />,
          description: "Stunning 3D holographic displays with 4x4 fan configuration",
          features: ["3D Holographic Effect", "4x4 Configuration", "WiFi Control", "Custom Content"],
          specs: {
            "Fan Size": "65cm diameter",
            Resolution: "1024 x 1024",
            "Viewing Distance": "3-15 meters",
            Power: "25W per fan",
            Control: "WiFi/App",
            Content: "Video/Image/3D",
          },
        },
        {
          id: 5,
          name: "Back-to-Back Hologram Fan",
          slug: "back-to-back-hologram-fan",
          icon: <RotateCcw className="h-8 w-8" />,
          description: "Double-sided hologram fans for 360-degree viewing experience",
          features: ["360° Viewing", "Double-Sided Display", "Synchronized Content", "Remote Management"],
          specs: {
            "Fan Size": "65cm diameter",
            "Viewing Angle": "360°",
            Brightness: "2000 nits",
            Power: "50W total",
            Sync: "Multi-unit sync",
            Installation: "Ceiling/Floor mount",
          },
        },
      ])
    }

    if (companySlug) {
      fetchCompanyData()
    }
  }, [companySlug])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % 6)
    }, 8000)

    setAutoSwipeInterval(interval)
    return () => clearInterval(interval)
  }, [])

  if (isProductBrief) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Product Brief & Quotation Request</h1>
              <p className="text-gray-600">
                Please provide the following information to help us understand your requirements and provide an accurate
                quotation.
              </p>
            </div>

            <form className="space-y-8">
              {/* Company Information */}
              <div className="border-b border-gray-200 pb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Company Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Address</label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Project Details */}
              <div className="border-b border-gray-200 pb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Project Details</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Title *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Description *</label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Please describe your project requirements, goals, and any specific needs..."
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expected Budget Range</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select budget range</option>
                        <option value="under-10k">Under $10,000</option>
                        <option value="10k-25k">$10,000 - $25,000</option>
                        <option value="25k-50k">$25,000 - $50,000</option>
                        <option value="50k-100k">$50,000 - $100,000</option>
                        <option value="over-100k">Over $100,000</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Timeline *</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select timeline</option>
                        <option value="asap">ASAP</option>
                        <option value="1-month">Within 1 month</option>
                        <option value="2-3-months">2-3 months</option>
                        <option value="3-6-months">3-6 months</option>
                        <option value="6-months-plus">6+ months</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Requirements */}
              <div className="border-b border-gray-200 pb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Requirements</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Product Categories of Interest *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        "3D Hologram Fans",
                        "LED Displays",
                        "Digital Signage",
                        "Interactive Displays",
                        "Outdoor LED",
                        "Indoor LED",
                        "Rental LED",
                        "Transparent LED",
                        "Flexible LED",
                        "Other",
                      ].map((category) => (
                        <label key={category} className="flex items-center">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantity Required</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Installation Location</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select location type</option>
                        <option value="indoor">Indoor</option>
                        <option value="outdoor">Outdoor</option>
                        <option value="both">Both Indoor & Outdoor</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Technical Specifications & Requirements
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Please specify any technical requirements, dimensions, resolution, brightness, connectivity needs, etc..."
                    />
                  </div>
                </div>
              </div>

              {/* Additional Services */}
              <div className="border-b border-gray-200 pb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Additional Services</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "Installation Services",
                      "Content Creation",
                      "Training & Support",
                      "Maintenance Contract",
                      "Custom Software Development",
                      "System Integration",
                    ].map((service) => (
                      <label key={service} className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">{service}</span>
                      </label>
                    ))}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Comments or Special Requirements
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Any additional information that would help us provide a better quotation..."
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-8 py-3 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Submit Product Brief
                </button>
                <p className="text-sm text-gray-500 mt-3">
                  We'll review your requirements and get back to you within 24 hours with a detailed quotation.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  const getProductIcon = (product: any) => {
    if (product.icon) return product.icon

    const name = product.name?.toLowerCase() || ""
    if (name.includes("poster")) return <Monitor className="h-8 w-8" />
    if (name.includes("wall")) return <Box className="h-8 w-8" />
    if (name.includes("light")) return <Lightbulb className="h-8 w-8" />
    if (name.includes("hologram") || name.includes("fan")) return <Zap className="h-8 w-8" />
    return <Box className="h-8 w-8" />
  }

  const toggleVideoMute = () => {
    const video = document.querySelector("video") as HTMLVideoElement
    if (video) {
      video.muted = !video.muted
      setIsVideoMuted(video.muted)
    }
  }

  const handleFeaturedProductsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFeaturedProductsEditDialog(true)
    // Load current values from companyData
    if (companyData?.web_config) {
      setFeaturedProductsEditData({
        sectionTitle: companyData.web_config.products?.section_title || "Featured Products",
        sectionDescription:
          companyData.web_config.products?.section_description ||
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
        productTitle: companyData.web_config.products?.product_title || "Classic Products",
        productDescription:
          companyData.web_config.products?.product_description ||
          "LED signage that provides exceptional image with robust product quality",
        buttonText: companyData.web_config.products?.button_text || "View More",
        backgroundColor: companyData.web_config.products?.backgroundColor || "#ffffff",
        textColor: companyData.web_config.products?.textColor || "#1f2937",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading website...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/20"
        style={{
          backgroundColor: theme?.headerColor || theme?.primaryColor || "hsl(var(--background))",
          color: "#ffffff",
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              {companyData?.logo ? (
                <img
                  src={companyData.logo || "/placeholder.svg"}
                  alt={`${companyData.name} Logo`}
                  className="h-10 w-auto max-w-[200px] object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                    const textFallback = e.currentTarget.nextElementSibling as HTMLElement
                    if (textFallback) textFallback.style.display = "block"
                  }}
                />
              ) : null}
              <div className={`text-2xl font-bold ${companyData?.logo ? "hidden" : "block"} text-white`}>
                {companyData?.name || "Company"}
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => document.getElementById("home")?.scrollIntoView({ behavior: "smooth" })}
                className="transition-colors hover:opacity-80"
                style={{ color: theme?.navColor || "#ffffff" }}
              >
                Home
              </button>
              <button
                onClick={() => {
                  const element = document.getElementById("applications")
                  if (element) {
                    const elementPosition = element.offsetTop
                    const offsetPosition = elementPosition - 80
                    window.scrollTo({
                      top: offsetPosition,
                      behavior: "smooth",
                    })
                  }
                }}
                className="transition-colors hover:opacity-80"
                style={{ color: theme?.navColor || "#ffffff" }}
              >
                Application
              </button>
              <button
                onClick={() => {
                  const element = document.getElementById("recent-works")
                  if (element) {
                    const elementPosition = element.offsetTop
                    const offsetPosition = elementPosition - 80
                    window.scrollTo({
                      top: offsetPosition,
                    })
                  }
                }}
                className="transition-colors hover:opacity-80"
                style={{ color: theme?.navColor || "#ffffff" }}
              >
                Recent Works
              </button>
              <button
                onClick={() => {
                  const element = document.getElementById("products")
                  if (element) {
                    const elementPosition = element.offsetTop
                    const offsetPosition = elementPosition - 80
                    window.scrollTo({
                      top: offsetPosition,
                      behavior: "smooth",
                    })
                  }
                }}
                className="transition-colors hover:opacity-80"
                style={{ color: theme?.navColor || "#ffffff" }}
              >
                Products
              </button>
              <button
                onClick={() => {
                  const element = document.getElementById("about-us")
                  if (element) {
                    const elementPosition = element.offsetTop
                    const offsetPosition = elementPosition - 80
                    window.scrollTo({
                      top: offsetPosition,
                    })
                  }
                }}
                className="transition-colors hover:opacity-80"
                style={{ color: theme?.navColor || "#ffffff" }}
              >
                About Us
              </button>
              <button
                onClick={() => {
                  const element = document.getElementById("why-us")
                  if (element) {
                    const elementPosition = element.offsetTop
                    const offsetPosition = elementPosition - 80
                    window.scrollTo({
                      top: offsetPosition,
                    })
                  }
                }}
                className="transition-colors hover:opacity-80"
                style={{ color: theme?.navColor || "#ffffff" }}
              >
                Why Us
              </button>
            </nav>

            <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/20 py-4">
              <nav className="flex flex-col space-y-4">
                <button
                  onClick={() => {
                    document.getElementById("home")?.scrollIntoView({ behavior: "smooth" })
                    setMobileMenuOpen(false)
                  }}
                  className="transition-colors text-white/90 hover:text-white text-left"
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    const element = document.getElementById("applications")
                    if (element) {
                      const elementPosition = element.offsetTop
                      const offsetPosition = elementPosition - 80
                      window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth",
                      })
                    }
                    setMobileMenuOpen(false)
                  }}
                  className="transition-colors text-white/90 hover:text-white text-left"
                >
                  Application
                </button>
                <button
                  onClick={() => {
                    const element = document.getElementById("recent-works")
                    if (element) {
                      const elementPosition = element.offsetTop
                      const offsetPosition = elementPosition - 80
                      window.scrollTo({
                        top: offsetPosition,
                      })
                    }
                    setMobileMenuOpen(false)
                  }}
                  className="transition-colors text-white/90 hover:text-white text-left"
                >
                  Recent Works
                </button>
                <button
                  onClick={() => {
                    const element = document.getElementById("products")
                    if (element) {
                      const elementPosition = element.offsetTop
                      const offsetPosition = elementPosition - 80
                      window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth",
                      })
                    }
                    setMobileMenuOpen(false)
                  }}
                  className="transition-colors text-white/90 hover:text-white text-left"
                >
                  Products
                </button>
                <button
                  onClick={() => {
                    const element = document.getElementById("about-us")
                    if (element) {
                      const elementPosition = element.offsetTop
                      const offsetPosition = elementPosition - 80
                      window.scrollTo({
                        top: offsetPosition,
                      })
                    }
                    setMobileMenuOpen(false)
                  }}
                  className="transition-colors text-white/90 hover:text-white text-left"
                >
                  About Us
                </button>
                <button
                  onClick={() => {
                    const element = document.getElementById("why-us")
                    if (element) {
                      const elementPosition = element.offsetTop
                      const offsetPosition = elementPosition - 80
                      window.scrollTo({
                        top: offsetPosition,
                      })
                    }
                    setMobileMenuOpen(false)
                  }}
                  className="transition-colors text-white/90 hover:text-white text-left"
                >
                  Why Us
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      <div>
        <section
          id="home"
          className="relative bg-gradient-to-br from-primary/5 to-primary/10 w-full h-screen flex items-center justify-center overflow-hidden"
          style={
            theme?.primaryColor
              ? {
                  background: `linear-gradient(to bottom right, ${theme.primaryColor}0D, ${theme.primaryColor}1A)`,
                }
              : {}
          }
        >
          {heroVideo && (
            <>
              <video
                autoPlay
                muted={isVideoMuted}
                loop
                playsInline
                preload="metadata"
                crossOrigin="anonymous"
                className="absolute inset-0 w-full h-full object-cover z-0"
                onLoadStart={() => console.log("[v0] Video load started:", heroVideo)}
                onCanPlay={() => console.log("[v0] Video can play")}
                onPlay={() => console.log("[v0] Video started playing")}
                onError={(e) => {
                  console.error("[v0] Video error:", e)
                  console.error("[v0] Video URL:", heroVideo)
                  console.error("[v0] Make sure the video URL is accessible and in a supported format (MP4, WebM)")
                  setHeroVideo(null) // Remove video on error
                }}
                onLoadedData={() => console.log("[v0] Video data loaded successfully")}
                style={{ display: heroVideo ? "block" : "none" }}
              >
                <source src={heroVideo} type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              <button
                onClick={toggleVideoMute}
                className="absolute bottom-4 right-4 z-30 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors backdrop-blur-sm"
                aria-label={isVideoMuted ? "Unmute video" : "Mute video"}
              >
                {isVideoMuted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
              </button>

              <div
                className="absolute inset-0 z-10 bg-black/30"
                style={{
                  background: theme?.primaryColor
                    ? `linear-gradient(to bottom right, ${theme.primaryColor}40, ${theme.primaryColor}20)`
                    : "linear-gradient(to bottom right, rgba(0,0,0,0.4), rgba(0,0,0,0.2))",
                }}
              />
            </>
          )}

          <div className="container mx-auto px-4 text-center relative z-20">
            <h1
              className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg"
              style={{
                color: heroContent?.mainHeadingColor || "#ffffff",
              }}
            >
              {heroContent?.mainHeading || "Professional LED Solutions"}
            </h1>
            <p
              className="text-xl mb-8 max-w-2xl mx-auto drop-shadow-md"
              style={{
                color: heroContent?.subtitleColor || "rgba(255, 255, 255, 0.9)",
              }}
            >
              {heroContent?.subtitle ||
                `Premium LED displays, lighting, and holographic solutions by ${companyData?.name || "our company"}`}
            </p>

            {!heroVideo && process.env.NODE_ENV === "development" && (
              <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800 text-sm">
                <p>
                  <strong>Developer Note:</strong> No hero video found.
                </p>
                <p>
                  Add a 'hero_video' field to either your Firebase company document or create a 'website_config'
                  collection with a document matching your company ID or a 'theme' document.
                </p>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge
                variant="secondary"
                className="text-sm px-4 py-2 backdrop-blur-sm border-white/30"
                style={{
                  backgroundColor: heroContent?.categoryButtonColor || "rgba(255, 255, 255, 0.2)",
                  color: heroContent?.categoryButtonTextColor || "#ffffff",
                }}
              >
                LED Posters
              </Badge>
              <Badge
                variant="secondary"
                className="text-sm px-4 py-2 backdrop-blur-sm border-white/30"
                style={{
                  backgroundColor: heroContent?.categoryButtonColor || "rgba(255, 255, 255, 0.2)",
                  color: heroContent?.categoryButtonTextColor || "#ffffff",
                }}
              >
                LED Walls
              </Badge>
              <Badge
                variant="secondary"
                className="text-sm px-4 py-2 backdrop-blur-sm border-white/30"
                style={{
                  backgroundColor: heroContent?.categoryButtonColor || "rgba(255, 255, 255, 0.2)",
                  color: heroContent?.categoryButtonTextColor || "#ffffff",
                }}
              >
                Floodlights
              </Badge>
              <Badge
                variant="secondary"
                className="text-sm px-4 py-2 backdrop-blur-sm border-white/30"
                style={{
                  backgroundColor: heroContent?.categoryButtonColor || "rgba(255, 255, 255, 0.2)",
                  color: heroContent?.categoryButtonTextColor || "#ffffff",
                }}
              >
                Hologram Fans
              </Badge>
            </div>
            <Button
              size="lg"
              style={{
                backgroundColor: heroContent?.buttonColor || theme?.buttonColor || theme?.primaryColor || "#000000",
                borderColor: heroContent?.buttonColor || theme?.buttonColor || theme?.primaryColor || "#000000",
                color: heroContent?.buttonTextColor || theme?.buttonTextColor || "#ffffff",
              }}
              className="hover:opacity-90 transition-opacity shadow-lg"
            >
              View Products
            </Button>
          </div>

          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
            <button
              onClick={() => {
                const applicationsSection = document.getElementById("applications")
                if (applicationsSection) {
                  const yOffset = -80 // 80px offset from top
                  const y = applicationsSection.getBoundingClientRect().top + window.pageYOffset + yOffset
                  window.scrollTo({ top: y, behavior: "smooth" })
                }
              }}
              className="animate-bounce p-3 rounded-full bg-black/30 hover:bg-black/50 transition-colors backdrop-blur-sm"
              aria-label="Scroll to see more content"
            >
              <ChevronDown className="h-6 w-6 text-white" />
            </button>
          </div>
        </section>
      </div>

      <section id="our-technology" className="w-full" style={{ backgroundColor: theme.backgroundColor }}>
        <div className="w-full">
          <div className="text-center py-16 px-4">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: theme.textColor }}>
              {companyData?.web_config?.ourTechnology?.mainTitle || "Our Technology, Your Way"}
            </h2>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto" style={{ color: theme.secondaryColor }}>
              {companyData?.web_config?.ourTechnology?.subtitle || "Digital Products for Any Space, Any Application"}
            </p>
          </div>

          <div className="flex justify-center">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 place-items-center max-w-fit">
              {products.length > 0
                ? // Show real products data
                  products
                    .slice(0, 12)
                    .map((product, index) => (
                      <div
                        key={product.id}
                        className="relative aspect-square overflow-hidden group cursor-pointer hover:scale-105 transition-transform duration-300"
                      >
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
                    <div
                      key={tech.name}
                      className="relative aspect-square overflow-hidden group cursor-pointer hover:scale-105 transition-transform duration-300"
                    >
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
                  ))}
            </div>
          </div>
        </div>
      </section>

      <section id="applications" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{ color: theme.textColor }}>
              {companyData?.web_config?.applicationTabs?.sectionTitle || "Applications"}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto" style={{ color: theme.secondaryColor }}>
              {companyData?.web_config?.applicationTabs?.sectionDescription ||
                "Explore the diverse applications of our LED solutions across various industries."}
            </p>
          </div>

          <ApplicationTabs companyData={companyData} theme={theme} />
        </div>
      </section>

      <section id="recent-works" className="py-16" style={{ backgroundColor: theme.backgroundColor }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{ color: theme.textColor }}>
              {companyData?.web_config?.recentWorks?.sectionTitle || "Recent Works"}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto" style={{ color: theme.secondaryColor }}>
              {companyData?.web_config?.recentWorks?.sectionDescription ||
                "Showcasing our latest projects and installations."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <div key={index} className="relative aspect-video overflow-hidden rounded-lg shadow-md">
                <img
                  src={`/project_text.png?height=400&width=600&text=Project ${index}`}
                  alt={`Project ${index}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 hover:bg-black/50 transition-colors duration-300"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="font-semibold text-lg">Project {index}</h3>
                  <p className="text-sm">Brief description of the project</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="products" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{ color: theme.textColor }}>
              {companyData?.web_config?.products?.section_title || "Featured Products"}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto" style={{ color: theme.secondaryColor }}>
              {companyData?.web_config?.products?.section_description ||
                "Explore our range of high-quality LED products."}
            </p>
            {process.env.NODE_ENV === "development" && (
              <Button variant="outline" size="sm" onClick={handleFeaturedProductsClick}>
                Edit Section
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="relative rounded-lg shadow-md overflow-hidden group cursor-pointer hover:scale-105 transition-transform duration-300"
              >
                <img
                  src={
                    product.media?.[0]?.url ||
                    product.photo_urls?.[0] ||
                    `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(product.name) || "/placeholder.svg"}`
                  }
                  alt={product.name}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <p className="text-sm">{product.description}</p>
                </div>
                <Link
                  href={`/product/${product.slug}`}
                  className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                  <Button>View Product</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about-us" className="py-16" style={{ backgroundColor: theme.backgroundColor }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{ color: theme.textColor }}>
              {companyData?.web_config?.aboutUs?.sectionTitle || "About Us"}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto" style={{ color: theme.secondaryColor }}>
              {companyData?.web_config?.aboutUs?.sectionDescription || "Learn more about our company and our mission."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <img
                src="/placeholder.svg?height=400&width=600&text=About+Us"
                alt="About Us"
                className="w-full h-auto rounded-lg shadow-md"
              />
            </div>
            <div>
              <p className="text-gray-700 leading-relaxed" style={{ color: theme.textColor }}>
                {companyData?.web_config?.aboutUs?.content ||
                  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="why-us" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{ color: theme.textColor }}>
              {companyData?.web_config?.whyUs?.sectionTitle || "Why Choose Us?"}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto" style={{ color: theme.secondaryColor }}>
              {companyData?.web_config?.whyUs?.sectionDescription ||
                "Discover the reasons why we are the best choice for your LED solutions."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <Zap className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2" style={{ color: theme.textColor }}>
                Innovation
              </h3>
              <p className="text-gray-700" style={{ color: theme.textColor }}>
                We are committed to providing innovative and cutting-edge LED solutions.
              </p>
            </div>
            <div className="text-center">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2" style={{ color: theme.textColor }}>
                Quality
              </h3>
              <p className="text-gray-700" style={{ color: theme.textColor }}>
                We use only the highest quality materials and components in our products.
              </p>
            </div>
            <div className="text-center">
              <Monitor className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2" style={{ color: theme.textColor }}>
                Reliability
              </h3>
              <p className="text-gray-700" style={{ color: theme.textColor }}>
                Our products are designed and tested to ensure long-lasting reliability.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer
        className="py-8 text-center"
        style={{
          backgroundColor: theme?.footerBackgroundColor || theme?.primaryColor || "hsl(var(--background))",
          color: theme?.footerTextColor || "#ffffff",
        }}
      >
        <p>
          &copy; {new Date().getFullYear()} {companyData?.name || "Company"}. All rights reserved.
        </p>
      </footer>

      <Dialog open={featuredProductsEditDialog} onOpenChange={setFeaturedProductsEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Featured Products Section</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="sectionTitle" className="text-right">
                Section Title
              </label>
              <Input
                id="sectionTitle"
                value={featuredProductsEditData.sectionTitle}
                onChange={(e) =>
                  setFeaturedProductsEditData({ ...featuredProductsEditData, sectionTitle: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="sectionDescription" className="text-right">
                Section Description
              </label>
              <Textarea
                id="sectionDescription"
                value={featuredProductsEditData.sectionDescription}
                onChange={(e) =>
                  setFeaturedProductsEditData({ ...featuredProductsEditData, sectionDescription: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="productTitle" className="text-right">
                Product Title
              </label>
              <Input
                id="productTitle"
                value={featuredProductsEditData.productTitle}
                onChange={(e) =>
                  setFeaturedProductsEditData({ ...featuredProductsEditData, productTitle: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="productDescription" className="text-right">
                Product Description
              </label>
              <Textarea
                id="productDescription"
                value={featuredProductsEditData.productDescription}
                onChange={(e) =>
                  setFeaturedProductsEditData({ ...featuredProductsEditData, productDescription: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="buttonText" className="text-right">
                Button Text
              </label>
              <Input
                id="buttonText"
                value={featuredProductsEditData.buttonText}
                onChange={(e) =>
                  setFeaturedProductsEditData({ ...featuredProductsEditData, buttonText: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="backgroundColor" className="text-right">
                Background Color
              </label>
              <Input
                type="color"
                id="backgroundColor"
                value={featuredProductsEditData.backgroundColor}
                onChange={(e) =>
                  setFeaturedProductsEditData({ ...featuredProductsEditData, backgroundColor: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="textColor" className="text-right">
                Text Color
              </label>
              <Input
                type="color"
                id="textColor"
                value={featuredProductsEditData.textColor}
                onChange={(e) =>
                  setFeaturedProductsEditData({ ...featuredProductsEditData, textColor: e.target.value })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <Button onClick={() => setFeaturedProductsEditDialog(false)}>Save</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
