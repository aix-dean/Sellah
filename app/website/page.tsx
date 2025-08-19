"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Menu, X, Zap, Monitor, Lightbulb, Box, RotateCcw } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

export default function CompanyWebsite() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const products = [
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
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="text-2xl font-bold text-foreground">Sellah LED</div>

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

            <div className="hidden md:block">
              <Button>Request Quote</Button>
            </div>

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
                <Button className="w-full">Request Quote</Button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 to-primary/10 min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-foreground">Professional LED Solutions</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Premium LED displays, lighting, and holographic solutions for businesses worldwide
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
          <Button size="lg" className="bg-primary hover:bg-primary/90">
            View Products
          </Button>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Our Product Range</h2>
            <div className="w-16 h-1 bg-primary mx-auto mb-8"></div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional LED solutions designed for maximum impact and reliability
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">{product.icon}</div>
                    <CardTitle className="text-xl">{product.name}</CardTitle>
                  </div>
                  <CardDescription>{product.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2 text-foreground">Key Features:</h4>
                      <ul className="space-y-1">
                        {product.features.map((feature, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link href={`/website/${product.slug}`} prefetch={true}>
                      <Button variant="outline" className="w-full bg-transparent">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Specifications Section */}
      <section id="specifications" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Technical Specifications</h2>
            <div className="w-16 h-1 bg-primary mx-auto mb-8"></div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Detailed technical specifications for all our LED products
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {products.map((product) => (
              <Card key={product.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">{product.icon}</div>
                    {product.name} Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(product.specs).map(([key, value]) => (
                      <div key={key} className="border-b border-border pb-2">
                        <span className="font-medium text-foreground text-sm">{key}:</span>
                        <p className="text-muted-foreground text-sm">{value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Applications Section */}
      <section id="applications" className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Applications & Use Cases</h2>
            <div className="w-16 h-1 bg-primary mx-auto mb-8"></div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our LED solutions serve various industries and applications
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Retail & Shopping", desc: "Store displays, digital signage, promotional content" },
              { title: "Events & Entertainment", desc: "Concerts, festivals, stage backgrounds, exhibitions" },
              { title: "Corporate & Office", desc: "Reception areas, meeting rooms, corporate branding" },
              { title: "Hospitality", desc: "Hotels, restaurants, bars, entertainment venues" },
              { title: "Transportation", desc: "Airports, train stations, bus terminals, wayfinding" },
              { title: "Education", desc: "Schools, universities, auditoriums, information displays" },
              { title: "Healthcare", desc: "Hospitals, clinics, waiting areas, information systems" },
              { title: "Sports & Recreation", desc: "Stadiums, gyms, sports bars, scoreboards" },
            ].map((app, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <CardTitle className="text-lg">{app.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{app.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Why Choose Sellah LED?</h2>
            <div className="w-16 h-1 bg-primary mx-auto mb-8"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Monitor className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Premium Quality</h3>
              <p className="text-muted-foreground">
                High-grade components and rigorous quality control ensure reliable performance
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Expert Support</h3>
              <p className="text-muted-foreground">
                Dedicated technical support and installation assistance from our experts
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Box className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Custom Solutions</h3>
              <p className="text-muted-foreground">
                Tailored LED solutions designed to meet your specific requirements
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Illuminate Your Business?</h2>
          <p className="text-lg mb-8 max-w-4xl mx-auto">
            Contact our sales team for a personalized quote and consultation. We'll help you find the perfect LED
            solution for your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-background text-foreground hover:bg-background/90 px-8 py-3 font-semibold">
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

      {/* Footer */}
      <footer className="bg-background border-t py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="text-2xl font-bold mb-6 text-foreground">Sellah LED</div>
              <p className="text-muted-foreground mb-6">
                Professional LED solutions for businesses worldwide. Quality, innovation, and reliability in every
                product.
              </p>
              <div className="mb-6">
                <h3 className="font-semibold mb-4 text-foreground">Newsletter</h3>
                <div className="flex">
                  <Input placeholder="Enter your email" className="rounded-r-none" />
                  <Button className="rounded-l-none">Subscribe</Button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-foreground">Products</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    LED Posters
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    LED Walls
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Floodlights
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    3D Hologram Fans
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Back-to-Back Fans
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-foreground">Services</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Installation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Maintenance
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Technical Support
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Custom Solutions
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Consultation
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-foreground">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Warranty
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Downloads
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-8 text-sm text-muted-foreground">
            <p>© 2025 Sellah LED. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
