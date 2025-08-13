"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Monitor, Box, Lightbulb, Zap, ChevronLeft, ChevronRight } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const companySlug = params.slug as string
  const productId = params.product as string // Now treating this as product ID instead of slug
  const [activeSection, setActiveSection] = useState("specifications")
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [currentApplicationIndex, setCurrentApplicationIndex] = useState(0)
  const [product, setProduct] = useState<any>(null)
  const [companyData, setCompanyData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true)

        const companyDocRef = doc(db, "companies", companySlug)
        const companyDoc = await getDoc(companyDocRef)

        if (companyDoc.exists()) {
          const companyInfo = { id: companyDoc.id, ...companyDoc.data() }
          setCompanyData(companyInfo)

          const productDocRef = doc(db, "products", productId)
          const productDoc = await getDoc(productDocRef)

          if (productDoc.exists()) {
            const productData = { id: productDoc.id, ...productDoc.data() }

            const transformedProduct = {
              ...productData,
              icon: getProductIcon(productData),
              description: productData.description || `Professional ${productData.name} solution`,
              features: productData.features ||
                productData.key_features || ["Professional Grade", "High Quality", "Reliable Performance"],
              specs: productData.specifications ||
                productData.specs || {
                  "Product Name": productData.name,
                  SKU: productData.sku || "N/A",
                  Price: productData.price ? `$${productData.price}` : "Contact for pricing",
                  Stock: productData.stock || "Available",
                  Status: productData.status || "Active",
                },
              types: productData.variants || [
                {
                  name: `Standard ${productData.name}`,
                  specification: "Professional grade",
                  application: "General use",
                },
              ],
              applications: productData.applications || [
                "Commercial applications",
                "Professional installations",
                "Business environments",
                "Industrial use cases",
              ],
            }
            setProduct(transformedProduct)
          } else {
            console.error("Product not found with ID:", productId)
            // Fallback to hardcoded product if not found in Firestore
            setProduct(getHardcodedProduct("default"))
          }
        } else {
          console.error("Company not found with ID:", companySlug)
          // Fallback if company not found
          setProduct(getHardcodedProduct("default"))
          setCompanyData({ name: "Company" })
        }
      } catch (error) {
        console.error("Error fetching product data:", error)
        setProduct(getHardcodedProduct("default"))
        setCompanyData({ name: "Company" })
      } finally {
        setLoading(false)
      }
    }

    fetchProductData()
  }, [companySlug, productId])

  const getProductIcon = (product: any) => {
    const name = product.name?.toLowerCase() || ""
    if (name.includes("poster")) return <Monitor className="h-8 w-8" />
    if (name.includes("wall")) return <Box className="h-8 w-8" />
    if (name.includes("light")) return <Lightbulb className="h-8 w-8" />
    if (name.includes("hologram") || name.includes("fan")) return <Zap className="h-8 w-8" />
    return <Box className="h-8 w-8" />
  }

  const getHardcodedProduct = (slug: string) => {
    return {
      name: "LED Product",
      icon: <Monitor className="h-8 w-8" />,
      description: "Professional LED solution for your business needs",
      features: ["Professional Grade", "High Quality", "Reliable Performance"],
      specs: {
        "Product Name": "LED Product",
        SKU: "N/A",
        Price: "Contact for pricing",
        Stock: "Available",
        Status: "Active",
      },
      types: [{ name: "Standard LED Product", specification: "Professional grade", application: "General use" }],
      applications: [
        "Commercial applications",
        "Professional installations",
        "Business environments",
        "Industrial use cases",
      ],
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300)

      const sections = ["specifications", "types", "applications"]
      const scrollPosition = window.scrollY + 150

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const offsetTop = element.offsetTop
          const offsetBottom = offsetTop + element.offsetHeight

          if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const headerOffset = 120
      const elementPosition = element.offsetTop
      const offsetPosition = elementPosition - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
      setActiveSection(sectionId)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const applicationScenarios = [
    {
      title: "Corporate",
      image: "/placeholder.svg?height=300&width=400",
      description: "Modern corporate lobbies and showrooms with professional LED displays",
    },
    {
      title: "Conference Room",
      image: "/placeholder.svg?height=300&width=400",
      description: "Professional meeting rooms with large LED wall displays for presentations",
    },
    {
      title: "Command Center",
      image: "/placeholder.svg?height=300&width=400",
      description: "Control rooms with multiple LED screens for monitoring and data visualization",
    },
    {
      title: "Broadcasting",
      image: "/placeholder.svg?height=300&width=400",
      description: "TV studios and broadcasting setups with professional LED wall backgrounds",
    },
    {
      title: "Retail",
      image: "/placeholder.svg?height=300&width=400",
      description: "Retail environments with engaging LED displays for product promotion",
    },
    {
      title: "Entertainment",
      image: "/placeholder.svg?height=300&width=400",
      description: "Entertainment venues and event spaces with dynamic LED installations",
    },
  ]

  const nextApplication = () => {
    setCurrentApplicationIndex((prev) => (prev + 1) % applicationScenarios.length)
  }

  const prevApplication = () => {
    setCurrentApplicationIndex((prev) => (prev - 1 + applicationScenarios.length) % applicationScenarios.length)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Button onClick={() => router.push(`/website/${companySlug}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
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
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push(`/website/${companySlug}`)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              {companyData?.logo ? (
                <img
                  src={companyData.logo || "/placeholder.svg"}
                  alt={`${companyData.name} logo`}
                  className="h-8 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                    e.currentTarget.nextElementSibling!.style.display = "block"
                  }}
                />
              ) : null}
              <div
                className="text-2xl font-bold text-foreground"
                style={{ display: companyData?.logo ? "none" : "block" }}
              >
                {companyData?.name || "Company"}
              </div>
            </div>
            <Button onClick={() => router.push(`/website/${companySlug}/${productId}/quote`)}>Project Brief</Button>
          </div>
        </div>
      </header>

      <nav className="sticky top-16 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-14 overflow-x-auto">
            <div className="flex space-x-8 min-w-max">
              {[
                { id: "specifications", label: "Specifications" },
                { id: "types", label: "Product Types" },
                { id: "applications", label: "Applications" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => scrollToSection(tab.id)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeSection === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Product Hero */}
      <section className="py-12 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-primary/10 rounded-lg text-primary">{product.icon}</div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">{product.name}</h1>
              <p className="text-lg text-muted-foreground mt-2">{product.description}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {(Array.isArray(product.features) ? product.features : [product.features]).map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                {feature}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Image Placeholder */}
            <div className="bg-muted/30 rounded-lg aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="p-4 bg-primary/10 rounded-lg text-primary mb-4 inline-block">{product.icon}</div>
                <p className="text-muted-foreground">Product Image Coming Soon</p>
              </div>
            </div>

            {/* Quick Specs */}
            <Card>
              <CardHeader>
                <CardTitle>Key Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(product.specs)
                    .slice(0, 6)
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center border-b border-border pb-2">
                        <span className="font-medium text-foreground text-sm">{key}:</span>
                        <span className="text-muted-foreground text-sm">{value}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className="py-16">
        <div className="container mx-auto px-4 space-y-16">
          {/* Specifications Section */}
          <section id="specifications">
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-foreground text-center mb-8">Product Parameter</h2>
            </div>

            <div className="w-full">
              <div className="bg-card rounded-xl border border-border/50 overflow-hidden shadow-lg w-full">
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-6 py-4 border-b border-border/50">
                  <div className="grid grid-cols-4 gap-4 w-full">
                    <div className="col-span-1">
                      <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Product
                      </span>
                    </div>
                    <div className="col-span-3 text-center">
                      <span className="text-lg font-bold text-foreground">{product.name} Series</span>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-border/30 w-full">
                  {Object.entries(product.specs).map(([key, value], index) => (
                    <div
                      key={key}
                      className={`grid grid-cols-4 gap-4 px-6 py-4 transition-colors hover:bg-muted/20 w-full ${
                        index % 2 === 0 ? "bg-background" : "bg-muted/10"
                      }`}
                    >
                      <div className="col-span-1 flex items-center">
                        <span className="font-medium text-foreground text-sm">{key}</span>
                      </div>
                      <div className="col-span-3 flex items-center">
                        <span className="text-muted-foreground text-sm font-mono bg-muted/30 px-3 py-1 rounded-md">
                          {value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Product Types Section */}
          <section id="types">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Product Types</h2>
              <p className="text-muted-foreground">Choose the right variant for your specific needs</p>
            </div>

            <div className="space-y-12">
              {product.types.map((type, index) => (
                <div
                  key={index}
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-8 items-center ${
                    index % 2 === 1 ? "lg:grid-flow-col-dense" : ""
                  }`}
                >
                  <div
                    className={`bg-black rounded-lg p-8 aspect-[4/3] flex items-center justify-center ${
                      index % 2 === 1 ? "lg:col-start-2" : ""
                    }`}
                  >
                    <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                      <div className="bg-muted/20 rounded-lg aspect-square flex items-center justify-center">
                        <div className="p-4 bg-primary/20 rounded-lg text-primary">{product.icon}</div>
                      </div>
                      <div className="bg-muted/20 rounded-lg aspect-square flex items-center justify-center">
                        <div className="p-4 bg-primary/20 rounded-lg text-primary">{product.icon}</div>
                      </div>
                    </div>
                  </div>

                  <div className={`space-y-6 ${index % 2 === 1 ? "lg:col-start-1" : ""}`}>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-4">{type.name}</h3>
                      <div className="space-y-4">
                        {Object.entries(type)
                          .filter(([key]) => key !== "name")
                          .map(([key, value]) => (
                            <div key={key} className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                                <span className="font-semibold text-foreground capitalize">{key}</span>
                              </div>
                              <p className="text-muted-foreground ml-4">
                                {typeof value === "string" && value.includes("-")
                                  ? `${key} range: ${value}`
                                  : `${value} - Professional grade specification for optimal performance`}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>

                    <Button
                      className="w-full sm:w-auto px-8"
                      onClick={() => router.push(`/website/${companySlug}/${productId}/quote`)}
                    >
                      Get Project Brief for {type.name}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Applications Section */}
          <section id="applications">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Application Scenarios</h2>
              <p className="text-muted-foreground">Where {product.name} excels in real-world applications</p>
            </div>

            {/* Carousel Container */}
            <div className="relative">
              <div className="overflow-hidden rounded-lg">
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentApplicationIndex * 25}%)` }}
                >
                  {applicationScenarios.map((scenario, index) => (
                    <div key={index} className="w-1/4 flex-shrink-0 px-2">
                      <div className="bg-card rounded-lg overflow-hidden shadow-sm border border-border">
                        <div className="aspect-[4/3] overflow-hidden">
                          <img
                            src={scenario.image || "/placeholder.svg"}
                            alt={scenario.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-foreground text-lg mb-2">{scenario.title}</h3>
                          <p className="text-sm text-muted-foreground">{scenario.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              <button
                onClick={prevApplication}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-background/80 backdrop-blur-sm rounded-full shadow-lg border border-border hover:bg-background transition-colors"
                disabled={currentApplicationIndex === 0}
              >
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </button>

              <button
                onClick={nextApplication}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-background/80 backdrop-blur-sm rounded-full shadow-lg border border-border hover:bg-background transition-colors"
                disabled={currentApplicationIndex >= applicationScenarios.length - 4}
              >
                <ChevronRight className="h-5 w-5 text-foreground" />
              </button>

              {/* Dots Indicator */}
              <div className="flex justify-center mt-6 gap-2">
                {Array.from({ length: Math.max(1, applicationScenarios.length - 3) }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentApplicationIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      currentApplicationIndex === index ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Contact our sales team for a personalized quote and consultation for {product.name}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              className="bg-background text-foreground hover:bg-background/90 px-8 py-3 font-semibold"
              onClick={() => router.push(`/website/${companySlug}/${productId}/quote`)}
            >
              Project Brief
            </Button>
            <Button
              variant="outline"
              className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary px-8 py-3 font-semibold bg-transparent"
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all duration-300 hover:scale-110"
          aria-label="Back to top"
        >
          <ArrowLeft className="h-5 w-5 rotate-90" />
        </button>
      )}
    </div>
  )
}
