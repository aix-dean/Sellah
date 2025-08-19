"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Menu, X, Zap, Monitor, Lightbulb, Box, RotateCcw, Volume2, VolumeX } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
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

          let videoUrl = null

          // Check company document first (existing behavior)
          if (companyInfo.hero_video) {
            console.log("[v0] Hero video URL found in company document:", companyInfo.hero_video)
            videoUrl = companyInfo.hero_video
          } else {
            console.log("[v0] No hero_video field found in company document, checking website_config subcollection")

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
        const companyDocRef = doc(db, "companies", companyId)
        const companyDoc = await getDoc(companyDocRef)

        if (companyDoc.exists()) {
          const companyData = companyDoc.data()
          const themeData = companyData.theme

          if (themeData) {
            setTheme(themeData)
            applyTheme(themeData)
          }
        }
      } catch (error) {
        console.error("Error fetching theme config:", error)
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
              <Link href="#products" className="transition-colors text-white/90 hover:text-white">
                Products
              </Link>
              <Link href="#specifications" className="transition-colors text-white/90 hover:text-white">
                Specifications
              </Link>
              <Link href="#applications" className="transition-colors text-white/90 hover:text-white">
                Applications
              </Link>
              <Link href="#contact" className="transition-colors text-white/90 hover:text-white">
                Contact
              </Link>
            </nav>

            <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/20 py-4">
              <nav className="flex flex-col space-y-4">
                <Link href="#products" className="transition-colors text-white/90 hover:text-white">
                  Products
                </Link>
                <Link href="#specifications" className="transition-colors text-white/90 hover:text-white">
                  Specifications
                </Link>
                <Link href="#applications" className="transition-colors text-white/90 hover:text-white">
                  Applications
                </Link>
                <Link href="#contact" className="transition-colors text-white/90 hover:text-white">
                  Contact
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      <div className="pt-16">
        <section
          className="relative bg-gradient-to-br from-primary/5 to-primary/10 w-full h-[90vh] flex items-center justify-center overflow-hidden"
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
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg">
              Professional LED Solutions
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md">
              Premium LED displays, lighting, and holographic solutions by {companyData?.name || "our company"}
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
                className="text-sm px-4 py-2 backdrop-blur-sm bg-white/20 text-white border-white/30"
              >
                LED Posters
              </Badge>
              <Badge
                variant="secondary"
                className="text-sm px-4 py-2 backdrop-blur-sm bg-white/20 text-white border-white/30"
              >
                LED Walls
              </Badge>
              <Badge
                variant="secondary"
                className="text-sm px-4 py-2 backdrop-blur-sm bg-white/20 text-white border-white/30"
              >
                Floodlights
              </Badge>
              <Badge
                variant="secondary"
                className="text-sm px-4 py-2 backdrop-blur-sm bg-white/20 text-white border-white/30"
              >
                Hologram Fans
              </Badge>
            </div>
            <Button
              size="lg"
              style={
                theme?.buttonColor
                  ? {
                      backgroundColor: theme.buttonColor,
                      borderColor: theme.buttonColor,
                      color: theme.buttonTextColor || "#ffffff",
                    }
                  : theme?.primaryColor
                    ? {
                        backgroundColor: theme.primaryColor,
                        borderColor: theme.primaryColor,
                        color: theme.buttonTextColor || "#ffffff",
                      }
                    : {}
              }
              className="hover:opacity-90 transition-opacity shadow-lg"
            >
              View Products
            </Button>
          </div>
        </section>
      </div>

      <section id="about" className="bg-background">
        <div className="w-full">
          <div className="flex flex-col lg:flex-row min-h-[600px]">
            {/* Left side - Text content with dark background */}
            <div className="w-full lg:w-1/2 bg-gray-900 text-white flex items-center p-8 lg:p-16">
              <div className="max-w-xl">
                <h2 className="text-4xl lg:text-5xl font-bold mb-4">Lorem Ipsum Dolor Sit Amet</h2>
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
      <section className="w-full aspect-video relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent z-20"></div>
        <img
          src="/placeholder.svg?height=720&width=1280"
          alt="Comcast Lobby LED Installation"
          className="w-full h-full object-cover"
        />

        {/* Content Overlay */}
        <div className="absolute inset-0 z-30 flex items-end">
          <div className="p-8 lg:p-16 max-w-2xl">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">Our Recent Works</h2>
            <h3 className="text-2xl lg:text-3xl font-semibold text-white mb-6">Comcast Lobby</h3>
            <p className="text-lg text-white/90 leading-relaxed">
              Comcast lobby project built one of the world's most iconic LED walls and it is a major tourist attraction
              in Philadelphia. The update of the Unilumin's LED wall and the re-rendering of the content have attracted
              a lot of attention.
            </p>
          </div>
        </div>

        <div className="absolute bottom-8 right-8 z-30 flex items-center space-x-4">
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
            <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
            <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
            <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
            <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
            <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
            <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <div className="flex space-x-2">
            <button className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-white">
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

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg text-gray-800">
                    Our products are conceived, designed, tested, and supported in-house to ensure{" "}
                    <strong>quality control</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg text-gray-800">
                    {companyData?.name || "We"} provide <strong>world-class support</strong> with our five-year product
                    warranty, 10-year parts availability guarantee, and white glove service style.
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg text-gray-800">
                    <strong>Since our founding</strong>, our company has relied on a tireless work ethic to outperform
                    the competition.
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg text-gray-800">
                    <strong>Thousands of businesses nationwide</strong> have trusted {companyData?.name || "us"} as
                    their LED display manufacturer.
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - Image/Video */}
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

      <section id="products" className="py-16 bg-slate-900 text-white">
        <div className="w-full">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-white">Featured Products</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row min-h-[600px]">
            {/* Left side - Product showcase content */}
            <div className="w-full lg:w-1/2 flex items-center p-8 lg:p-16">
              <div className="max-w-xl">
                <h3 className="text-4xl lg:text-5xl font-bold mb-6 text-white">Classic Products</h3>
                <p className="text-lg mb-8 text-gray-300 leading-relaxed">
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
                          product.active ? "bg-blue-600" : "bg-slate-700"
                        }`}
                      >
                        <img
                          src="/placeholder.svg?height=48&width=64"
                          alt={product.name}
                          className="w-8 h-8 object-cover"
                        />
                      </div>
                      <span className="text-xs text-gray-300">{product.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side - Product image and specifications */}
            <div className="w-full lg:w-1/2 relative p-8 lg:p-16">
              <div className="w-1/2 mx-auto aspect-square bg-gradient-to-br from-blue-900 to-slate-800 rounded-lg overflow-hidden mb-6 flex items-center justify-center">
                <img
                  src="/placeholder.svg?height=400&width=400"
                  alt="LED Display Modules"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product specifications */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white mb-4">
                  Designed for Outdoor Digital Signage Market P6/9/10
                </h4>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    1x1ft metric size is optimal for signages and billboards
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    Triple Protection design makes module and PDU IP69K
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    Fanless Design, no noise and fewer risks
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    Low Power consumption: 545W/SQM @850nits
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    Flawless Display: 7680Hz refresh rate, 16bit, calibrated
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-white">
        {/* Top CTA Section */}
        <div className="py-16 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">How Can We Help You?</h2>
          <p className="text-lg mb-8 text-gray-300">Feel free to let us know.</p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full text-lg">
            contact us
          </Button>
        </div>

        {/* Main Footer Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* About Us Column */}
            <div>
              <h3 className="font-semibold mb-4 text-white">About Us</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About Unilumin
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Joint-Stock Company
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    U-Green
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-white">Address</h3>
              <div className="flex items-start mb-4">
                <svg className="w-5 h-5 mt-1 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-gray-400 text-sm">
                  <p>No. 18 Haoye Road, Fuhai Sub-district, Bao'an District</p>
                  <p>Shenzhen, Guangdong Province</p>
                </div>
              </div>

              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <a
                  href="mailto:sales@unilumin.com"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  sales@unilumin.com
                </a>
              </div>

              <div className="text-gray-400 text-sm">+86-755-29918999</div>
            </div>

            <div className="md:col-start-4">
              <h3 className="font-semibold mb-4 text-white">Follow Us</h3>
              <div className="flex space-x-3">
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Facebook">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Twitter">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Instagram">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323C6.001 8.198 7.152 7.708 8.449 7.708s2.448.49 3.323 1.416c.875.875 1.365 2.026 1.365 3.323s-.49 2.448-1.365 3.323c-.875.875-2.026 1.365-3.323 1.365s-2.448-.49-3.323-1.365c-.875-.807-2.026-1.218-3.323-1.218zm7.718 0c-1.297 0-2.448-.49-3.323-1.297-.875-.896-1.365-2.047-1.365-3.344s.49-2.448 1.365-3.323c.875-.875 2.026-1.365 3.323-1.365s2.448.49 3.323 1.365c.875.875 1.365 2.026 1.365 3.323s-.49 2.448-1.365 3.344c-.875.807-2.026 1.297-3.323 1.297z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="LinkedIn">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v11.452zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="YouTube">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="TikTok">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 3.98-2.13 5.11-1.92 1.92-4.19 3.17-6.51 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm mb-4 md:mb-0">
                copyright © 2025 {companyData?.name || "Company"}
              </div>

              <div className="flex items-center">
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="flex items-center text-gray-400 hover:text-white transition-colors text-sm"
                >
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Back To Top
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function ApplicationTabs({ theme }: { theme: any }) {
  const [activeTab, setActiveTab] = useState("Indoor")

  const tabs = ["Indoor", "Outdoor", "Rental", "Sports", "Lighting"]

  const tabContent = {
    Indoor: {
      title: "Indoor",
      description:
        "From control rooms to governments to retail, Unilumin LED display presents exceptional images in mission-critical places and indoor commercial space.",
      applications: ["Broadcast Room", "Education & Medical", "Control Room", "Corporate", "Hospitality", "Retail"],
      image: "/placeholder.svg?height=600&width=800",
    },
    Outdoor: {
      title: "Outdoor",
      description:
        "Weather-resistant LED displays designed for outdoor environments, delivering bright and clear visuals in all lighting conditions.",
      applications: [
        "Digital Billboards",
        "Stadium Displays",
        "Transportation Hubs",
        "Outdoor Advertising",
        "Public Information",
        "Street Furniture",
      ],
      image: "/placeholder.svg?height=600&width=800",
    },
    Rental: {
      title: "Rental",
      description:
        "Flexible and portable LED solutions perfect for events, concerts, conferences, and temporary installations.",
      applications: [
        "Concert Stages",
        "Corporate Events",
        "Trade Shows",
        "Conferences",
        "Festivals",
        "Temporary Installations",
      ],
      image: "/placeholder.svg?height=600&width=800",
    },
    Sports: {
      title: "Sports",
      description:
        "High-performance LED displays engineered for sports venues, providing crystal-clear visuals for spectators and athletes.",
      applications: [
        "Stadium Scoreboards",
        "Perimeter Displays",
        "Video Walls",
        "Ribbon Boards",
        "Concourse Displays",
        "Training Facilities",
      ],
      image: "/placeholder.svg?height=600&width=800",
    },
    Lighting: {
      title: "Lighting",
      description:
        "Innovative LED lighting solutions that combine illumination with digital display capabilities for architectural and decorative applications.",
      applications: [
        "Architectural Lighting",
        "Decorative Displays",
        "Interactive Installations",
        "Facade Lighting",
        "Landscape Lighting",
        "Art Installations",
      ],
      image: "/placeholder.svg?height=600&width=800",
    },
  }

  const currentContent = tabContent[activeTab as keyof typeof tabContent]

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-2 bg-white rounded-full p-2 shadow-lg">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                activeTab === tab ? "text-white shadow-md" : "text-gray-600 hover:text-gray-800"
              }`}
              style={
                activeTab === tab
                  ? {
                      backgroundColor: theme?.primaryColor || "#3b82f6",
                    }
                  : {}
              }
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex flex-col lg:flex-row lg:justify-around gap-8 lg:gap-0 min-h-[500px]">
        {/* Left Image */}
        <div className="w-full lg:w-[40%] aspect-video">
          <div className="h-full rounded-lg overflow-hidden">
            <img
              src={currentContent.image || "/placeholder.svg"}
              alt={`${currentContent.title} LED Display`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right Content */}
        <div className="w-full lg:w-[40%] bg-gray-100 rounded-lg p-8 lg:p-12 aspect-video">
          <h3 className="text-4xl font-bold mb-6 text-gray-900">{currentContent.title}</h3>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">{currentContent.description}</p>

          <div className="space-y-3 mb-8">
            {currentContent.applications.map((app, index) => (
              <div key={index} className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-gray-400 mr-3"></span>
                <span
                  className={`text-lg ${index === currentContent.applications.length - 1 ? "font-medium" : "text-gray-700"}`}
                  style={
                    index === currentContent.applications.length - 1 ? { color: theme?.primaryColor || "#3b82f6" } : {}
                  }
                >
                  {app}
                </span>
              </div>
            ))}
          </div>

          <button className="flex items-center text-lg font-medium hover:opacity-80 transition-opacity">
            <span className="mr-2">View More</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
