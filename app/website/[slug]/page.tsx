"use client"
import { Menu, Zap, Monitor, Lightbulb, Box, RotateCcw } from "lucide-react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function CompanyWebsite() {
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

  useEffect(() => {
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

  const getProductIcon = (product: any) => {
    if (product.icon) return product.icon

    const name = product.name?.toLowerCase() || ""
    if (name.includes("poster")) return <Monitor className="h-8 w-8" />
    if (name.includes("wall")) return <Box className="h-8 w-8" />
    if (name.includes("floodlights")) return <Lightbulb className="h-8 w-8" />
    if (name.includes("hologram")) return <Zap className="h-8 w-8" />
    return <Menu className="h-8 w-8" />
  }
}
