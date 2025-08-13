"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Menu, X, Zap, Monitor, Lightbulb, Box, RotateCcw } from "lucide-react"
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

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true)

        const companyId = companySlug

        // Fetch company document directly by ID
        const companyDocRef = doc(db, "companies", companyId)
        const companyDoc = await getDoc(companyDocRef)

        if (companyDoc.exists()) {
          const companyInfo = { id: companyDoc.id, ...companyDoc.data() }
          setCompanyData(companyInfo)

          await fetchThemeConfig(companyDoc.id)
          await fetchCompanyProducts(companyDoc.id)
        } else {
          console.error("Company not found with ID:", companyId)
          // Fallback to default company data
          setCompanyData({
            name: "Company",
            business_type: "LED Solutions Provider",
          })
          setFallbackProducts()
        }
      } catch (error) {
        console.error("Error fetching company data:", error)
        // Set fallback data
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
        const themeDocRef = doc(db, "companies", companyId, "website_config", "theme")
        const themeDoc = await getDoc(themeDocRef)

        if (themeDoc.exists()) {
          const themeData = themeDoc.data()
          setTheme(themeData)
          applyTheme(themeData)
        }
      } catch (error) {
        console.error("Error fetching theme config:", error)
      }
    }

    const applyTheme = (themeData: any) => {
      if (!themeData) return

      const root = document.documentElement

      // Apply theme colors as CSS custom properties
      if (themeData.primaryColor) {
        root.style.setProperty("--primary", themeData.primaryColor)
        root.style.setProperty("--primary-foreground", "#ffffff")
        // Also set hsl values for better Tailwind compatibility
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
        root.style.setProperty("--muted-foreground", themeData.textColor + "80") // 50% opacity
      }

      // Update elements that should use primary color
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
    }

    const fetchCompanyProducts = async (companyId: string) => {
      try {
        const productsRef = collection(db, "products")
        const productsQuery = query(productsRef, where("company_id", "==", companyId))
        const productsSnapshot = await getDocs(productsQuery)

        const companyProducts = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Generate slug from name if not present
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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              {companyData?.logo ? (
                <img
                  src={companyData.logo || "/placeholder.svg"}
                  alt={`${companyData.name} Logo`}
                  className="h-10 w-auto max-w-[200px] object-contain"
                  onError={(e) => {
                    // Fallback to text if logo fails to load
                    e.currentTarget.style.display = "none"
                    const textFallback = e.currentTarget.nextElementSibling as HTMLElement
                    if (textFallback) textFallback.style.display = "block"
                  }}
                />
              ) : null}
              <div className={`text-2xl font-bold text-foreground ${companyData?.logo ? "hidden" : "block"}`}>
                {companyData?.name || "Company"}
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#products" className="text-foreground hover:text-primary transition-colors">
                Products
              </Link>
              <Link href="#specifications" className="text-foreground hover:text-primary transition-colors">
                Specifications
              </Link>
              <Link href="#applications" className="text-foreground hover:text-primary transition-colors">
                Applications
              </Link>
              <Link href="#contact" className="text-foreground hover:text-primary transition-colors">
                Contact
              </Link>
            </nav>

            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t py-4">
              <nav className="flex flex-col space-y-4">
                <Link href="#products" className="text-foreground hover:text-primary transition-colors">
                  Products
                </Link>
                <Link href="#specifications" className="text-foreground hover:text-primary transition-colors">
                  Specifications
                </Link>
                <Link href="#applications" className="text-foreground hover:text-primary transition-colors">
                  Applications
                </Link>
                <Link href="#contact" className="text-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="relative bg-gradient-to-br from-primary/5 to-primary/10 py-20"
        style={
          theme?.primaryColor
            ? {
                background: `linear-gradient(to bottom right, ${theme.primaryColor}0D, ${theme.primaryColor}1A)`,
              }
            : {}
        }
      >
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-foreground">Professional LED Solutions</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Premium LED displays, lighting, and holographic solutions by {companyData?.name || "our company"}
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              LED Posters
            </Badge>
            <Badge variant="secondary" className="text-sm px-4 py-2">
              LED Walls
            </Badge>
            <Badge variant="secondary" className="text-sm px-4 py-2">
              Floodlights
            </Badge>
            <Badge variant="secondary" className="text-sm px-4 py-2">
              Hologram Fans
            </Badge>
          </div>
          <Button
            size="lg"
            style={
              theme?.primaryColor
                ? {
                    backgroundColor: theme.primaryColor,
                    borderColor: theme.primaryColor,
                  }
                : {}
            }
            className="hover:opacity-90 transition-opacity"
          >
            View Products
          </Button>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Our Product Range</h2>
            <div
              className="w-16 h-1 mx-auto mb-8"
              style={
                theme?.primaryColor
                  ? {
                      backgroundColor: theme.primaryColor,
                    }
                  : {}
              }
            ></div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional LED solutions designed for maximum impact and reliability
            </p>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">No products found for this company.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <Link key={product.id} href={`/website/${companySlug}/${product.id}`} prefetch={true}>
                  <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 h-full flex flex-col cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="p-2 rounded-lg"
                          style={
                            theme?.primaryColor
                              ? {
                                  backgroundColor: theme.primaryColor + "1A",
                                  color: theme.primaryColor,
                                }
                              : {}
                          }
                        >
                          {getProductIcon(product)}
                        </div>
                        <CardTitle className="text-xl">{product.name}</CardTitle>
                      </div>
                      <CardDescription className="flex-1">{product.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <div className="space-y-4 flex-1">
                        {product.media && product.media.length > 0 && product.media[0].url && (
                          <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={product.media[0].url || "/placeholder.svg"}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none"
                              }}
                            />
                          </div>
                        )}

                        {product.price && typeof product.price === "number" && product.price > 0 && (
                          <div
                            className="text-lg font-semibold"
                            style={
                              theme?.primaryColor
                                ? {
                                    color: theme.primaryColor,
                                  }
                                : {}
                            }
                          >
                            ${product.price}
                          </div>
                        )}

                        {product.stock !== undefined && (
                          <div className="text-sm">
                            <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                            </Badge>
                          </div>
                        )}

                        {product.features && product.features.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2 text-foreground">Key Features:</h4>
                            <ul className="space-y-1">
                              {(Array.isArray(product.features) ? product.features : [product.features]).map(
                                (feature: string, index: number) => (
                                  <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                                    <div
                                      className="w-1.5 h-1.5 rounded-full"
                                      style={
                                        theme?.primaryColor
                                          ? {
                                              backgroundColor: theme.primaryColor,
                                            }
                                          : {}
                                      }
                                    ></div>
                                    {feature}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="flex items-center mb-6">
                {companyData?.logo ? (
                  <img
                    src={companyData.logo || "/placeholder.svg"}
                    alt={`${companyData.name} Logo`}
                    className="h-8 w-auto max-w-[150px] object-contain"
                    onError={(e) => {
                      // Fallback to text if logo fails to load
                      e.currentTarget.style.display = "none"
                      const textFallback = e.currentTarget.nextElementSibling as HTMLElement
                      if (textFallback) textFallback.style.display = "block"
                    }}
                  />
                ) : null}
                <div className={`text-2xl font-bold text-foreground ${companyData?.logo ? "hidden" : "block"}`}>
                  {companyData?.name || "Company"}
                </div>
              </div>

              <p className="text-muted-foreground mb-6">
                Professional LED solutions for businesses worldwide. Quality, innovation, and reliability in every
                product.
              </p>
              <div className="mb-6">
                <h3 className="font-semibold mb-4 text-foreground">Newsletter</h3>
                <div className="flex">
                  <Input placeholder="Enter your email" className="rounded-r-none" />
                  <Button
                    className="rounded-l-none"
                    style={
                      theme?.primaryColor
                        ? {
                            backgroundColor: theme.primaryColor,
                            borderColor: theme.primaryColor,
                          }
                        : {}
                    }
                  >
                    Subscribe
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-8 text-sm text-muted-foreground">
            <p>© 2025 {companyData?.name || "Company"} LED. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
