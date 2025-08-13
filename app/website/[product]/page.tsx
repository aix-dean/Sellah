"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Monitor, Box, Lightbulb, Zap, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productSlug = params.product as string
  const [activeSection, setActiveSection] = useState("specifications")
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [currentApplicationIndex, setCurrentApplicationIndex] = useState(0)

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
      const headerOffset = 120 // Account for sticky headers
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

  const products = {
    "led-poster": {
      name: "LED Poster",
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
        "Pixel Pitch": "2.5mm",
        "Refresh Rate": "3840Hz",
        "Operating Temperature": "-20°C to +60°C",
        "IP Rating": "IP54",
        Lifespan: "100,000 hours",
        "Control System": "WiFi, USB, LAN",
      },
      types: [
        { name: "Indoor LED Poster", size: '43" - 86"', resolution: "4K", brightness: "500-1000 nits" },
        { name: "Outdoor LED Poster", size: '55" - 98"', resolution: "4K", brightness: "2500-5000 nits" },
        { name: "Ultra-thin LED Poster", size: '32" - 75"', resolution: "4K", brightness: "800-1500 nits" },
        { name: "Interactive LED Poster", size: '43" - 86"', resolution: "4K", brightness: "1000-2000 nits" },
      ],
      applications: [
        "Retail stores and shopping malls",
        "Restaurants and cafes",
        "Corporate lobbies and offices",
        "Transportation hubs",
        "Hotels and hospitality",
        "Educational institutions",
        "Healthcare facilities",
        "Banks and financial institutions",
      ],
    },
    "led-wall": {
      name: "LED Wall",
      icon: <Box className="h-8 w-8" />,
      description: "Modular LED wall systems for large-scale displays and events",
      features: ["Modular Design", "Seamless Connection", "High Brightness", "Weather Resistant"],
      specs: {
        "Pixel Pitch": "2.5mm - 10mm",
        Brightness: "5000 nits",
        "Refresh Rate": "3840Hz",
        "Power Consumption": "800W/sqm",
        "Operating Temperature": "-20°C to +60°C",
        "IP Rating": "IP65",
        "Viewing Angle": "160°",
        "Color Depth": "16 bits",
        "Cabinet Size": "500x500mm",
        Weight: "8kg per cabinet",
        "Control System": "Nova, Colorlight, Linsn",
        Lifespan: "100,000 hours",
      },
      types: [
        { name: "Indoor LED Wall", size: "P2.5 - P4", resolution: "High", brightness: "800-1200 nits" },
        { name: "Outdoor LED Wall", size: "P4 - P10", resolution: "Standard", brightness: "5000-8000 nits" },
        { name: "Rental LED Wall", size: "P3.9 - P4.8", resolution: "High", brightness: "1000-1500 nits" },
        { name: "Fixed LED Wall", size: "P6 - P16", resolution: "Standard", brightness: "6000-10000 nits" },
      ],
      applications: [
        "Concert venues and festivals",
        "Sports stadiums and arenas",
        "Corporate events and conferences",
        "Retail flagship stores",
        "Broadcasting and TV studios",
        "Control rooms and command centers",
        "Churches and auditoriums",
        "Outdoor advertising billboards",
      ],
    },
    floodlights: {
      name: "Floodlights",
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
        "Operating Temperature": "-40°C to +50°C",
        "Input Voltage": "AC 85-265V",
        "Power Factor": ">0.95",
        CRI: ">80",
        Material: "Die-cast aluminum",
        Warranty: "5 years",
      },
      types: [
        { name: "Standard Floodlight", power: "50W - 200W", beam: "60° - 120°", application: "General lighting" },
        { name: "High Power Floodlight", power: "300W - 500W", beam: "30° - 90°", application: "Stadium lighting" },
        { name: "RGB Floodlight", power: "50W - 150W", beam: "25° - 60°", application: "Architectural lighting" },
        { name: "Solar Floodlight", power: "20W - 100W", beam: "120°", application: "Remote area lighting" },
      ],
      applications: [
        "Building facades and architecture",
        "Sports facilities and stadiums",
        "Parking lots and garages",
        "Industrial facilities",
        "Landscape and garden lighting",
        "Security and perimeter lighting",
        "Construction sites",
        "Event and festival lighting",
      ],
    },
    "3d-4x4-hologram-fan": {
      name: "3D 4x4 Hologram Fan",
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
        "Display Area": "2.6m x 2.6m",
        "Sync Accuracy": "±1ms",
        "Operating Temperature": "0°C to +40°C",
        "Storage Temperature": "-20°C to +60°C",
        Humidity: "10% - 90% RH",
        Warranty: "2 years",
      },
      types: [
        { name: "Indoor 4x4 System", size: "65cm fans", power: "400W total", application: "Indoor displays" },
        { name: "Outdoor 4x4 System", size: "65cm fans", power: "450W total", application: "Outdoor events" },
        { name: "Portable 4x4 System", size: "50cm fans", power: "300W total", application: "Mobile displays" },
        { name: "Custom 4x4 System", size: "Variable", power: "Variable", application: "Bespoke installations" },
      ],
      applications: [
        "Trade shows and exhibitions",
        "Retail product launches",
        "Entertainment venues",
        "Museums and galleries",
        "Corporate presentations",
        "Advertising campaigns",
        "Event marketing",
        "Brand activations",
      ],
    },
    "back-to-back-hologram-fan": {
      name: "Back-to-Back Hologram Fan",
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
        Resolution: "1024 x 1024 per side",
        "Control System": "WiFi, 4G, LAN",
        "Content Format": "MP4, AVI, GIF, JPG",
        "Operating Hours": "24/7 continuous",
        "Noise Level": "<35dB",
        Warranty: "2 years",
      },
      types: [
        { name: "Standard Back-to-Back", size: "65cm", power: "50W", application: "General display" },
        { name: "High Brightness B2B", size: "65cm", power: "60W", application: "Bright environments" },
        { name: "Outdoor Back-to-Back", size: "65cm", power: "70W", application: "Outdoor installations" },
        { name: "Mini Back-to-Back", size: "42cm", power: "30W", application: "Desktop displays" },
      ],
      applications: [
        "Shopping mall atriums",
        "Airport terminals",
        "Hotel lobbies",
        "Restaurant centers",
        "Exhibition centers",
        "Corporate headquarters",
        "Entertainment complexes",
        "Retail flagship stores",
      ],
    },
  }

  const product = products[productSlug as keyof typeof products]

  const applicationScenarios = [
    {
      title: "Corporate",
      image: "/images/corporate-scenario.png",
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

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Button onClick={() => router.push("/website")}>
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
              <Button variant="ghost" onClick={() => router.push("/website")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="text-2xl font-bold text-foreground">Sellah LED</div>
            </div>
            <Button onClick={() => router.push(`/website/${productSlug}/quote`)}>Request Quote</Button>
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
            {product.features.map((feature, index) => (
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

                  {/* Content Section */}
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
                      onClick={() => router.push(`/website/${productSlug}/quote`)}
                    >
                      Get Quote for {type.name}
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
              onClick={() => router.push(`/website/${productSlug}/quote`)}
            >
              Request Quote
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
