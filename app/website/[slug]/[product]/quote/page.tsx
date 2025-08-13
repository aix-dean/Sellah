"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

export default function QuotePage() {
  const params = useParams()
  const router = useRouter()
  const companySlug = params.slug as string
  const productSlug = params.product as string
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1: Project Requirements
    projectType: "",
    quantity: "",
    dimensions: "",
    usage: "",

    // Step 2: Technical Specifications
    resolution: "",
    brightness: "",
    installation: "",
    features: [],

    // Step 3: Budget & Timeline
    budget: "",
    timeline: "",
    priority: "",

    // Step 4: Contact Information
    name: "",
    email: "",
    phone: "",
    company: "",

    // Step 5: Additional Requirements
    additionalInfo: "",
    support: "",
    warranty: "",
  })

  const totalSteps = 5

  const productNames = {
    "led-poster": "LED Poster",
    "led-wall": "LED Wall",
    floodlights: "Floodlights",
    "3d-4x4-hologram-fan": "3D 4x4 Hologram Fan",
    "back-to-back-hologram-fan": "Back-to-Back Hologram Fan",
  }

  const productName = productNames[productSlug as keyof typeof productNames] || "Product"

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    console.log("Quote request submitted:", formData)
    alert("Quote request submitted successfully! Our sales team will contact you within 24 hours.")
    router.push(`/website/${companySlug}/${productSlug}`)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Project Requirements</CardTitle>
              <CardDescription>Tell us about your {productName} project needs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="projectType">Project Type</Label>
                <Select value={formData.projectType} onValueChange={(value) => updateFormData("projectType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity Needed</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="Enter quantity"
                  value={formData.quantity}
                  onChange={(e) => updateFormData("quantity", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dimensions">Preferred Dimensions</Label>
                <Input
                  id="dimensions"
                  placeholder="e.g., 2m x 3m or Custom"
                  value={formData.dimensions}
                  onChange={(e) => updateFormData("dimensions", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Primary Usage</Label>
                <RadioGroup value={formData.usage} onValueChange={(value) => updateFormData("usage", value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="indoor" id="indoor" />
                    <Label htmlFor="indoor">Indoor</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="outdoor" id="outdoor" />
                    <Label htmlFor="outdoor">Outdoor</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id="both" />
                    <Label htmlFor="both">Both Indoor & Outdoor</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        )

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Technical Specifications</CardTitle>
              <CardDescription>Specify your technical requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="resolution">Resolution Requirements</Label>
                <Select value={formData.resolution} onValueChange={(value) => updateFormData("resolution", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select resolution" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hd">HD (1920x1080)</SelectItem>
                    <SelectItem value="4k">4K (3840x2160)</SelectItem>
                    <SelectItem value="8k">8K (7680x4320)</SelectItem>
                    <SelectItem value="custom">Custom Resolution</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brightness">Brightness Level</Label>
                <Select value={formData.brightness} onValueChange={(value) => updateFormData("brightness", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select brightness level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (500-1000 nits)</SelectItem>
                    <SelectItem value="medium">Medium (1000-3000 nits)</SelectItem>
                    <SelectItem value="high">High (3000-5000 nits)</SelectItem>
                    <SelectItem value="ultra">Ultra High (5000+ nits)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Installation Type</Label>
                <RadioGroup
                  value={formData.installation}
                  onValueChange={(value) => updateFormData("installation", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="wall-mount" id="wall-mount" />
                    <Label htmlFor="wall-mount">Wall Mount</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ceiling" id="ceiling" />
                    <Label htmlFor="ceiling">Ceiling Mount</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="floor-stand" id="floor-stand" />
                    <Label htmlFor="floor-stand">Floor Stand</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom">Custom Installation</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Additional Features (Select all that apply)</Label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    "Touch Screen",
                    "Weather Resistant",
                    "Remote Control",
                    "WiFi Connectivity",
                    "Content Management",
                    "Auto Brightness",
                  ].map((feature) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Checkbox
                        id={feature}
                        checked={formData.features.includes(feature)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFormData("features", [...formData.features, feature])
                          } else {
                            updateFormData(
                              "features",
                              formData.features.filter((f: string) => f !== feature),
                            )
                          }
                        }}
                      />
                      <Label htmlFor={feature}>{feature}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Budget & Timeline</CardTitle>
              <CardDescription>Help us understand your project constraints</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget Range</Label>
                <Select value={formData.budget} onValueChange={(value) => updateFormData("budget", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-10k">Under $10,000</SelectItem>
                    <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                    <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                    <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
                    <SelectItem value="over-100k">Over $100,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeline">Project Timeline</Label>
                <Select value={formData.timeline} onValueChange={(value) => updateFormData("timeline", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asap">ASAP (Rush Order)</SelectItem>
                    <SelectItem value="1-month">Within 1 Month</SelectItem>
                    <SelectItem value="2-3-months">2-3 Months</SelectItem>
                    <SelectItem value="3-6-months">3-6 Months</SelectItem>
                    <SelectItem value="flexible">Flexible Timeline</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Project Priority</Label>
                <RadioGroup value={formData.priority} onValueChange={(value) => updateFormData("priority", value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cost" id="cost" />
                    <Label htmlFor="cost">Cost Optimization</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="quality" id="quality" />
                    <Label htmlFor="quality">Premium Quality</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="speed" id="speed" />
                    <Label htmlFor="speed">Fast Delivery</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="balanced" id="balanced" />
                    <Label htmlFor="balanced">Balanced Approach</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        )

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>How can we reach you with the quote?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => updateFormData("email", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={(e) => updateFormData("phone", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    placeholder="Enter your company name"
                    value={formData.company}
                    onChange={(e) => updateFormData("company", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Additional Requirements</CardTitle>
              <CardDescription>Any additional information or special requirements?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="additionalInfo">Additional Information</Label>
                <Textarea
                  id="additionalInfo"
                  placeholder="Tell us about any specific requirements, concerns, or questions you have..."
                  rows={4}
                  value={formData.additionalInfo}
                  onChange={(e) => updateFormData("additionalInfo", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="support">Support Requirements</Label>
                <Select value={formData.support} onValueChange={(value) => updateFormData("support", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select support level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic Support</SelectItem>
                    <SelectItem value="standard">Standard Support</SelectItem>
                    <SelectItem value="premium">Premium Support</SelectItem>
                    <SelectItem value="enterprise">Enterprise Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="warranty">Warranty Preference</Label>
                <Select value={formData.warranty} onValueChange={(value) => updateFormData("warranty", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warranty period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-year">1 Year Standard</SelectItem>
                    <SelectItem value="2-year">2 Year Extended</SelectItem>
                    <SelectItem value="3-year">3 Year Premium</SelectItem>
                    <SelectItem value="5-year">5 Year Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push(`/website/${companySlug}/${productSlug}`)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Product
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Get Quote for {productName}</h1>
            <p className="text-muted-foreground">
              Fill out this questionnaire to receive a customized quote for your project.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Form Step */}
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
                Submit Quote Request
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
