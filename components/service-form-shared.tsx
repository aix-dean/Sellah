"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Plus, X, Upload, Eye, Globe, MapPin, Info } from 'lucide-react'
import { useCategories } from "@/hooks/use-categories"
import { PHILIPPINE_REGIONS, type PhilippineRegion } from "@/types/service"
import type { Service, CreateServiceData } from "@/types/service"

interface ServiceFormSharedProps {
  initialData?: Partial<Service>
  onSubmit: (data: CreateServiceData) => Promise<void>
  isLoading: boolean
  submitButtonText: string
  title: string
}

export function ServiceFormShared({
  initialData,
  onSubmit,
  isLoading,
  submitButtonText,
  title
}: ServiceFormSharedProps) {
  const { categories } = useCategories()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Form state
  const [formData, setFormData] = useState<CreateServiceData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price || 0,
    category: initialData?.category || "",
    type: "SERVICES",
    status: initialData?.status || "active",
    userId: "", // Will be set when submitting
    imageUrls: initialData?.imageUrls || [],
    duration: initialData?.duration || "",
    location: initialData?.location || "",
    availability: initialData?.availability || "",
    maxParticipants: initialData?.maxParticipants || undefined,
    requirements: initialData?.requirements || [],
    inclusions: initialData?.inclusions || [],
    scope: initialData?.scope || "nationwide",
    regions: initialData?.regions || []
  })

  // UI state
  const [newRequirement, setNewRequirement] = useState("")
  const [newInclusion, setNewInclusion] = useState("")
  const [previewOpen, setPreviewOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleInputChange = (field: keyof CreateServiceData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      // Simulate upload - replace with actual upload logic
      const newImageUrls = Array.from(files).map(file => URL.createObjectURL(file))
      setFormData(prev => ({
        ...prev,
        imageUrls: [...(prev.imageUrls || []), ...newImageUrls]
      }))
    } catch (error) {
      console.error("Error uploading images:", error)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls?.filter((_, i) => i !== index) || []
    }))
  }

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...(prev.requirements || []), newRequirement.trim()]
      }))
      setNewRequirement("")
    }
  }

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements?.filter((_, i) => i !== index) || []
    }))
  }

  const addInclusion = () => {
    if (newInclusion.trim()) {
      setFormData(prev => ({
        ...prev,
        inclusions: [...(prev.inclusions || []), newInclusion.trim()]
      }))
      setNewInclusion("")
    }
  }

  const removeInclusion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      inclusions: prev.inclusions?.filter((_, i) => i !== index) || []
    }))
  }

  const handleScopeChange = (scope: "nationwide" | "regional") => {
    setFormData(prev => ({
      ...prev,
      scope,
      regions: scope === "nationwide" ? [] : prev.regions
    }))
  }

  const handleRegionToggle = (region: PhilippineRegion) => {
    setFormData(prev => {
      const currentRegions = prev.regions || []
      const isSelected = currentRegions.includes(region)
      
      return {
        ...prev,
        regions: isSelected
          ? currentRegions.filter(r => r !== region)
          : [...currentRegions, region]
      }
    })
  }

  const removeRegion = (region: string) => {
    setFormData(prev => ({
      ...prev,
      regions: prev.regions?.filter(r => r !== region) || []
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name.trim()) {
      alert("Service name is required")
      return
    }
    
    if (!formData.description.trim()) {
      alert("Service description is required")
      return
    }
    
    if (formData.price <= 0) {
      alert("Service price must be greater than 0")
      return
    }
    
    if (!formData.category) {
      alert("Service category is required")
      return
    }

    if (formData.scope === "regional" && (!formData.regions || formData.regions.length === 0)) {
      alert("Please select at least one region for regional services")
      return
    }

    await onSubmit(formData)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
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
                  ${formData.price.toFixed(2)}
                </p>
              </div>
              <p className="text-gray-600">{formData.description || "Service description..."}</p>
              
              {formData.scope && (
                <div>
                  <h4 className="font-medium mb-2">Service Coverage</h4>
                  <Badge variant={formData.scope === "nationwide" ? "default" : "secondary"}>
                    {formData.scope === "nationwide" ? "Nationwide" : "Regional"}
                  </Badge>
                  {formData.scope === "regional" && formData.regions && formData.regions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formData.regions.map((region, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {region}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter service name"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe your service"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
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

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Coverage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Service Coverage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="nationwide"
                  checked={formData.scope === "nationwide"}
                  onCheckedChange={() => handleScopeChange("nationwide")}
                />
                <Label htmlFor="nationwide" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Nationwide Service
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="regional"
                  checked={formData.scope === "regional"}
                  onCheckedChange={() => handleScopeChange("regional")}
                />
                <Label htmlFor="regional" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Specific Regions Only
                </Label>
              </div>
            </div>

            {formData.scope === "nationwide" && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Your service will be available to customers across all regions in the Philippines.
                </AlertDescription>
              </Alert>
            )}

            {formData.scope === "regional" && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Select Regions</Label>
                  <ScrollArea className="h-48 w-full border rounded-md p-4 mt-2">
                    <div className="grid grid-cols-1 gap-2">
                      {PHILIPPINE_REGIONS.map((region) => (
                        <div key={region} className="flex items-center space-x-2">
                          <Checkbox
                            id={region}
                            checked={formData.regions?.includes(region) || false}
                            onCheckedChange={() => handleRegionToggle(region)}
                          />
                          <Label htmlFor={region} className="text-sm">
                            {region}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {formData.regions && formData.regions.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">
                      Selected Regions ({formData.regions.length})
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.regions.map((region) => (
                        <Badge key={region} variant="secondary" className="text-xs">
                          {region}
                          <button
                            type="button"
                            onClick={() => removeRegion(region)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Details */}
        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => handleInputChange("duration", e.target.value)}
                  placeholder="e.g., 2 hours, 1 day"
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="e.g., Client's location, Online"
                />
              </div>

              <div>
                <Label htmlFor="availability">Availability</Label>
                <Input
                  id="availability"
                  value={formData.availability}
                  onChange={(e) => handleInputChange("availability", e.target.value)}
                  placeholder="e.g., Mon-Fri 9AM-5PM"
                />
              </div>

              <div>
                <Label htmlFor="maxParticipants">Max Participants</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  min="1"
                  value={formData.maxParticipants || ""}
                  onChange={(e) => handleInputChange("maxParticipants", parseInt(e.target.value) || undefined)}
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                placeholder="Add a requirement"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRequirement())}
              />
              <Button type="button" onClick={addRequirement}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {formData.requirements && formData.requirements.length > 0 && (
              <div className="space-y-2">
                {formData.requirements.map((req, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">{req}</span>
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
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newInclusion}
                onChange={(e) => setNewInclusion(e.target.value)}
                placeholder="Add what's included"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addInclusion())}
              />
              <Button type="button" onClick={addInclusion}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {formData.inclusions && formData.inclusions.length > 0 && (
              <div className="space-y-2">
                {formData.inclusions.map((inclusion, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">{inclusion}</span>
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
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Images"}
              </Button>
            </div>

            {formData.imageUrls && formData.imageUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.imageUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url || "/placeholder.svg"}
                      alt={`Service image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading} className="min-w-32">
            {isLoading ? "Saving..." : submitButtonText}
          </Button>
        </div>
      </form>
    </div>
  )
}
