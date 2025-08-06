"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Plus, X, Upload, Eye, Globe, MapPin, Info } from 'lucide-react'
import { toast } from "@/hooks/use-toast"
import type { Service } from "@/types/service"

interface ServiceFormSharedProps {
  initialData?: Partial<Service>
  onSubmit: (data: CreateServiceData) => Promise<void>
  isLoading?: boolean
  submitButtonText?: string
}

export interface CreateServiceData {
  name: string
  description: string
  price: number
  duration?: string
  location?: string
  availability?: string
  maxParticipants?: number
  requirements: string[]
  inclusions: string[]
  imageUrls: string[]
  scope: "nationwide" | "regional"
  regions: string[]
}

// Philippine regions
const PHILIPPINE_REGIONS = [
  "National Capital Region (NCR)",
  "Cordillera Administrative Region (CAR)",
  "Region I (Ilocos Region)",
  "Region II (Cagayan Valley)",
  "Region III (Central Luzon)",
  "Region IV-A (CALABARZON)",
  "Region IV-B (MIMAROPA)",
  "Region V (Bicol Region)",
  "Region VI (Western Visayas)",
  "Region VII (Central Visayas)",
  "Region VIII (Eastern Visayas)",
  "Region IX (Zamboanga Peninsula)",
  "Region X (Northern Mindanao)",
  "Region XI (Davao Region)",
  "Region XII (SOCCSKSARGEN)",
  "Region XIII (Caraga)",
  "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)"
]

export function ServiceFormShared({
  initialData,
  onSubmit,
  isLoading = false,
  submitButtonText = "Create Service"
}: ServiceFormSharedProps) {
  const [formData, setFormData] = useState<CreateServiceData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price || 0,
    duration: initialData?.duration || "",
    location: initialData?.location || "",
    availability: initialData?.availability || "",
    maxParticipants: initialData?.maxParticipants || undefined,
    requirements: initialData?.requirements || [],
    inclusions: initialData?.inclusions || [],
    imageUrls: initialData?.imageUrls || [],
    scope: initialData?.scope || "nationwide",
    regions: initialData?.regions || []
  })

  const [newRequirement, setNewRequirement] = useState("")
  const [newInclusion, setNewInclusion] = useState("")
  const [newImageUrl, setNewImageUrl] = useState("")
  const [previewOpen, setPreviewOpen] = useState(false)

  const handleInputChange = (field: keyof CreateServiceData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }))
      setNewRequirement("")
    }
  }

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }))
  }

  const addInclusion = () => {
    if (newInclusion.trim()) {
      setFormData(prev => ({
        ...prev,
        inclusions: [...prev.inclusions, newInclusion.trim()]
      }))
      setNewInclusion("")
    }
  }

  const removeInclusion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      inclusions: prev.inclusions.filter((_, i) => i !== index)
    }))
  }

  const addImageUrl = () => {
    if (newImageUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        imageUrls: [...prev.imageUrls, newImageUrl.trim()]
      }))
      setNewImageUrl("")
    }
  }

  const removeImageUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index)
    }))
  }

  const handleScopeChange = (scope: "nationwide" | "regional") => {
    setFormData(prev => ({
      ...prev,
      scope,
      regions: scope === "nationwide" ? [] : prev.regions
    }))
  }

  const handleRegionChange = (region: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      regions: checked 
        ? [...prev.regions, region]
        : prev.regions.filter(r => r !== region)
    }))
  }

  const removeRegion = (region: string) => {
    setFormData(prev => ({
      ...prev,
      regions: prev.regions.filter(r => r !== region)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Service name is required",
        variant: "destructive"
      })
      return
    }

    if (!formData.description.trim()) {
      toast({
        title: "Error",
        description: "Service description is required",
        variant: "destructive"
      })
      return
    }

    if (formData.price <= 0) {
      toast({
        title: "Error",
        description: "Service price must be greater than 0",
        variant: "destructive"
      })
      return
    }

    if (formData.scope === "regional" && formData.regions.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one region for regional services",
        variant: "destructive"
      })
      return
    }

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: "Failed to save service. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Enter the basic details of your service
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter service name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (PHP) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe your service in detail"
                rows={4}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Service Details */}
        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
            <CardDescription>
              Additional information about your service
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => handleInputChange("duration", e.target.value)}
                  placeholder="e.g., 2 hours, 1 day, 1 week"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="e.g., Client's location, Online, Our office"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="availability">Availability</Label>
                <Input
                  id="availability"
                  value={formData.availability}
                  onChange={(e) => handleInputChange("availability", e.target.value)}
                  placeholder="e.g., Mon-Fri 9AM-5PM, Weekends only"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxParticipants">Max Participants</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  min="1"
                  value={formData.maxParticipants || ""}
                  onChange={(e) => handleInputChange("maxParticipants", e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Leave empty if no limit"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Coverage */}
        <Card>
          <CardHeader>
            <CardTitle>Service Coverage</CardTitle>
            <CardDescription>
              Specify where your service is available
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Scope Selection */}
            <div className="space-y-3">
              <Label>Service Scope</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="nationwide"
                    checked={formData.scope === "nationwide"}
                    onCheckedChange={() => handleScopeChange("nationwide")}
                  />
                  <Label htmlFor="nationwide" className="flex items-center gap-2 cursor-pointer">
                    <Globe className="h-4 w-4" />
                    Nationwide
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="regional"
                    checked={formData.scope === "regional"}
                    onCheckedChange={() => handleScopeChange("regional")}
                  />
                  <Label htmlFor="regional" className="flex items-center gap-2 cursor-pointer">
                    <MapPin className="h-4 w-4" />
                    Specific Regions Only
                  </Label>
                </div>
              </div>
            </div>

            {/* Nationwide Info */}
            {formData.scope === "nationwide" && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Your service will be available to customers across all regions in the Philippines.
                </AlertDescription>
              </Alert>
            )}

            {/* Regional Selection */}
            {formData.scope === "regional" && (
              <div className="space-y-4">
                <div>
                  <Label>Select Regions</Label>
                  <p className="text-sm text-gray-600 mb-3">
                    Choose the specific regions where your service is available
                  </p>
                  
                  {/* Selected Regions Display */}
                  {formData.regions.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">Selected Regions ({formData.regions.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.regions.map((region) => (
                          <Badge key={region} variant="secondary" className="flex items-center gap-1">
                            {region}
                            <button
                              type="button"
                              onClick={() => removeRegion(region)}
                              className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Region Selection Grid */}
                  <ScrollArea className="h-64 border rounded-md p-4">
                    <div className="grid grid-cols-1 gap-3">
                      {PHILIPPINE_REGIONS.map((region) => (
                        <div key={region} className="flex items-center space-x-2">
                          <Checkbox
                            id={region}
                            checked={formData.regions.includes(region)}
                            onCheckedChange={(checked) => handleRegionChange(region, checked as boolean)}
                          />
                          <Label htmlFor={region} className="text-sm cursor-pointer">
                            {region}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
            <CardDescription>
              What do customers need to prepare or bring?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                placeholder="Add a requirement"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRequirement())}
              />
              <Button type="button" onClick={addRequirement} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {formData.requirements.length > 0 && (
              <div className="space-y-2">
                {formData.requirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="flex-1 text-sm">{req}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRequirement(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inclusions */}
        <Card>
          <CardHeader>
            <CardTitle>What's Included</CardTitle>
            <CardDescription>
              What's included in your service package?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newInclusion}
                onChange={(e) => setNewInclusion(e.target.value)}
                placeholder="Add an inclusion"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addInclusion())}
              />
              <Button type="button" onClick={addInclusion} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {formData.inclusions.length > 0 && (
              <div className="space-y-2">
                {formData.inclusions.map((inclusion, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="flex-1 text-sm">{inclusion}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeInclusion(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Service Images</CardTitle>
            <CardDescription>
              Add images to showcase your service
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Enter image URL"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addImageUrl())}
              />
              <Button type="button" onClick={addImageUrl} size="sm">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            
            {formData.imageUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {formData.imageUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url || "/placeholder.svg"}
                      alt={`Service image ${index + 1}`}
                      className="w-full h-32 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImageUrl(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex gap-4 justify-end">
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Service Preview</DialogTitle>
                <DialogDescription>
                  This is how your service will appear to customers
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold">{formData.name || "Service Name"}</h3>
                  <p className="text-2xl font-semibold text-green-600">
                    ₱{formData.price.toFixed(2)}
                  </p>
                </div>
                
                {formData.description && (
                  <div>
                    <h4 className="font-semibold mb-1">Description</h4>
                    <p className="text-gray-600">{formData.description}</p>
                  </div>
                )}

                {/* Service Coverage Preview */}
                <div>
                  <h4 className="font-semibold mb-2">Service Coverage</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={formData.scope === "nationwide" ? "default" : "secondary"}>
                      {formData.scope === "nationwide" ? "Nationwide" : "Regional"}
                    </Badge>
                  </div>
                  {formData.scope === "regional" && formData.regions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {formData.regions.map((region, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {region}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                {(formData.duration || formData.location || formData.availability || formData.maxParticipants) && (
                  <div>
                    <h4 className="font-semibold mb-2">Service Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {formData.duration && <div><strong>Duration:</strong> {formData.duration}</div>}
                      {formData.location && <div><strong>Location:</strong> {formData.location}</div>}
                      {formData.availability && <div><strong>Availability:</strong> {formData.availability}</div>}
                      {formData.maxParticipants && <div><strong>Max Participants:</strong> {formData.maxParticipants}</div>}
                    </div>
                  </div>
                )}
                
                {formData.requirements.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Requirements</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {formData.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {formData.inclusions.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">What's Included</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {formData.inclusions.map((inclusion, index) => (
                        <li key={index}>{inclusion}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {formData.imageUrls.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Images</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {formData.imageUrls.slice(0, 4).map((url, index) => (
                        <img
                          key={index}
                          src={url || "/placeholder.svg"}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : submitButtonText}
          </Button>
        </div>
      </form>
    </div>
  )
}
