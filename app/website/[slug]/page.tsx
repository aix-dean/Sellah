"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Menu, X, Zap, Monitor, Lightbulb, Box, RotateCcw, Volume2, VolumeX, ChevronDown } from "lucide-react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import ApplicationTabs from "@/components/ApplicationTabs" // Import ApplicationTabs component

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
                      behavior: "smooth",
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
                      behavior: "smooth",
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
                      behavior: "smooth",
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
                        behavior: "smooth",
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
                        behavior: "smooth",
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
                        behavior: "smooth",
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

      <section id="applications" className="py-16 bg-muted/30">
        <div className="w-full">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-foreground">Application</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua.
            </p>
          </div>

          <ApplicationTabs theme={theme} />
        </div>
      </section>

      {/* Our Recent Works Section */}
      <section
        id="recent-works"
        className="w-full aspect-video relative overflow-hidden"
        onMouseEnter={() => setCurrentSlideIndex(currentSlideIndex)} // Pause on hover
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent z-20"></div>
        {companyData?.web_config?.recentWorksItems?.[currentSlideIndex]?.mediaType === "video" ? (
          <video
            src={
              companyData?.web_config?.recentWorksItems?.[currentSlideIndex]?.backgroundImage ||
              "/placeholder.svg?height=720&width=1280"
            }
            className="w-full h-full object-cover transition-all duration-500"
            muted
            loop
            autoPlay
            playsInline
          />
        ) : (
          <img
            src={
              companyData?.web_config?.recentWorksItems?.[currentSlideIndex]?.backgroundImage ||
              "/placeholder.svg?height=720&width=1280" ||
              "/placeholder.svg" ||
              "/placeholder.svg" ||
              "/placeholder.svg" ||
              "/placeholder.svg" ||
              "/placeholder.svg" ||
              "/placeholder.svg" ||
              "/placeholder.svg"
            }
            alt={companyData?.web_config?.recentWorksItems?.[currentSlideIndex]?.projectTitle || "Recent Work"}
            className="w-full h-full object-cover transition-all duration-500"
          />
        )}

        {/* Content Overlay */}
        <div className="absolute inset-0 z-30 flex items-end">
          <div className="p-8 lg:p-16 max-w-2xl">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 transition-all duration-500">
              {companyData?.web_config?.recentWorksItems?.[0]?.sectionTitle || "Our Recent Works"}
            </h2>
            <h3 className="text-2xl lg:text-3xl font-semibold text-white mb-6 transition-all duration-500">
              {companyData?.web_config?.recentWorksItems?.[currentSlideIndex]?.projectTitle || "Project Title"}
            </h3>
            <p className="text-lg text-white/90 leading-relaxed transition-all duration-500">
              {companyData?.web_config?.recentWorksItems?.[currentSlideIndex]?.projectDescription ||
                "Project description will appear here."}
            </p>
          </div>
        </div>

        <div className="absolute bottom-8 right-8 z-30 flex items-center space-x-4">
          <div className="flex space-x-2">
            {(companyData?.web_config?.recentWorksItems || []).map((_, index) => (
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
                backgroundColor:
                  companyData?.web_config?.recentWorksSettings?.carouselNavColors?.buttonColor || "#2563eb",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  companyData?.web_config?.recentWorksSettings?.carouselNavColors?.buttonHoverColor || "#1d4ed8"
                const svg = e.currentTarget.querySelector("svg")
                if (svg) {
                  svg.style.color =
                    companyData?.web_config?.recentWorksSettings?.carouselNavColors?.iconHoverColor || "#ffffff"
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  companyData?.web_config?.recentWorksSettings?.carouselNavColors?.buttonColor || "#2563eb"
                const svg = e.currentTarget.querySelector("svg")
                if (svg) {
                  svg.style.color =
                    companyData?.web_config?.recentWorksSettings?.carouselNavColors?.iconColor || "#ffffff"
                }
              }}
              onClick={() => {
                if (autoSwipeInterval) {
                  clearInterval(autoSwipeInterval)
                  setAutoSwipeInterval(null)
                }
                const itemsLength = companyData?.web_config?.recentWorksItems?.length || 1
                setCurrentSlideIndex((prev) => (prev - 1 + itemsLength) % itemsLength)
              }}
            >
              <svg
                className="w-5 h-5 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{
                  color: companyData?.web_config?.recentWorksSettings?.carouselNavColors?.iconColor || "#ffffff",
                }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{
                backgroundColor:
                  companyData?.web_config?.recentWorksSettings?.carouselNavColors?.buttonColor || "#2563eb",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  companyData?.web_config?.recentWorksSettings?.carouselNavColors?.buttonHoverColor || "#1d4ed8"
                const svg = e.currentTarget.querySelector("svg")
                if (svg) {
                  svg.style.color =
                    companyData?.web_config?.recentWorksSettings?.carouselNavColors?.iconHoverColor || "#ffffff"
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  companyData?.web_config?.recentWorksSettings?.carouselNavColors?.buttonColor || "#2563eb"
                const svg = e.currentTarget.querySelector("svg")
                if (svg) {
                  svg.style.color =
                    companyData?.web_config?.recentWorksSettings?.carouselNavColors?.iconColor || "#ffffff"
                }
              }}
              onClick={() => {
                if (autoSwipeInterval) {
                  clearInterval(autoSwipeInterval)
                  setAutoSwipeInterval(null)
                }
                const itemsLength = companyData?.web_config?.recentWorksItems?.length || 1
                setCurrentSlideIndex((prev) => (prev + 1) % itemsLength)
              }}
            >
              <svg
                className="w-5 h-5 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{
                  color: companyData?.web_config?.recentWorksSettings?.carouselNavColors?.iconColor || "#ffffff",
                }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section id="products" className="py-16 bg-white">
        {" "}
        {/* Changed from bg-slate-900 to bg-white */}
        <div className="w-full">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-gray-900">Featured Products</h2>{" "}
            {/* Changed from text-white to text-gray-900 */}
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {" "}
              {/* Changed from text-gray-300 to text-gray-600 */}
              {companyData?.web_config?.products?.section_description ||
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}
            </p>
          </div>

          <div className="flex flex-col lg:flex-row min-h-[600px]">
            {/* Left side - Product showcase content */}
            <div className="w-full lg:w-1/2 flex items-center p-8 lg:p-16">
              <div className="max-w-xl">
                <h3 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">Classic Products</h3>{" "}
                {/* Changed from text-white to text-gray-900 */}
                <p className="text-lg mb-8 text-gray-700 leading-relaxed">
                  {" "}
                  {/* Changed from text-gray-300 to text-gray-700 */}
                  LED signage that provides exceptional image with robust product quality to empower businesses to reach
                  a new level.
                </p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold transition-colors mb-8">
                  View More
                </button>
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
                          product.active ? "bg-blue-600" : "bg-gray-200" /* Changed from bg-slate-700 to bg-gray-200 */
                        }`}
                      >
                        <img
                          src="/placeholder.svg?height=48&width=64"
                          alt={product.name}
                          className="w-8 h-8 object-cover"
                        />
                      </div>
                      <span className="text-xs text-gray-600">{product.name}</span>{" "}
                      {/* Changed from text-gray-300 to text-gray-600 */}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side - Product image and specifications */}
            <div className="w-full lg:w-1/2 relative p-8 lg:p-16">
              <div className="w-1/2 mx-auto aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden mb-6 flex items-center justify-center">
                {" "}
                {/* Changed from dark blue gradient to light gray gradient */}
                <img
                  src="/placeholder.svg?height=400&width=400"
                  alt="LED Display Modules"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-xl font-semibold text-gray-900">
                  {" "}
                  {/* Changed from text-white to text-gray-900 */}
                  Designed for Outdoor Digital Signage Market P6/9/10
                </h4>
                <ul className="space-y-2 text-gray-700">
                  {" "}
                  {/* Changed from text-gray-300 to text-gray-700 */}
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-gray-900 rounded-full mt-2 flex-shrink-0"></span>{" "}
                    {/* Changed from bg-white to bg-gray-900 */}
                    <span>1x1ft metric size is optimal for signages and billboards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-gray-900 rounded-full mt-2 flex-shrink-0"></span>{" "}
                    {/* Changed from bg-white to bg-gray-900 */}
                    <span>Triple Protection design makes module and PDU IP69K</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-gray-900 rounded-full mt-2 flex-shrink-0"></span>{" "}
                    {/* Changed from bg-white to bg-gray-900 */}
                    <span>Fanless Design, no noise and fewer risks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-gray-900 rounded-full mt-2 flex-shrink-0"></span>{" "}
                    {/* Changed from bg-white to bg-gray-900 */}
                    <span>Low Power consumption: 545W/SQM @850nits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-gray-900 rounded-full mt-2 flex-shrink-0"></span>{" "}
                    {/* Changed from bg-white to bg-gray-900 */}
                    <span>Flawless Display: 7680Hz refresh rate, 16bit, calibrated</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about-us" className="bg-background">
        <div className="w-full">
          <div className="flex flex-col lg:flex-row min-h-[600px]">
            {/* Left side - Text content with dark background */}
            <div className="w-full lg:w-1/2 bg-gray-900 text-white flex items-center p-8 lg:p-16">
              <div className="max-w-xl">
                <h2 className="text-4xl lg:text-5xl font-bold mb-4">About Us</h2>
                <h3 className="text-xl lg:text-2xl mb-8 text-gray-300">Consectetur Adipiscing Elit</h3>
                <p className="mb-8 text-sm leading-relaxed">
                  Professional LED solutions for businesses worldwide. Quality, innovation, and reliability in every
                  product.
                </p>
                <div className="mb-8">
                  <h3 className="font-semibold mb-2 text-sm">Contact Us</h3>
                  <p className="text-sm">📞 +63 (2) 8123-4567</p>
                </div>
                <button className="bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  Get To Know Us
                </button>
              </div>
            </div>

            {/* Right side - Image */}
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

      <section id="why-us" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left side - Content */}
            <div className="w-full lg:w-1/2">
              <h2 className="text-4xl lg:text-5xl font-bold text-black mb-8">
                WHY {companyData?.name?.toUpperCase() || "CHOOSE US"}?
              </h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg text-gray-800">
                    We create LED displays with a focus on <strong>quality and usability</strong>.
                  </p>
                </div>
                {/* Additional content can be added here */}
              </div>
            </div>

            {/* Right side - Image */}
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
    </div>
  )
}
