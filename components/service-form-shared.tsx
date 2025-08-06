"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { useCategories } from "@/hooks/use-categories"
import { createService, updateService } from "@/lib/service-service"
import { Service, CreateServiceData } from "@/types/service"
import { Upload, X, Plus, Loader2, AlertCircle, MapPin, Globe, CheckCircle, Info } from 'lucide-react'

// Philippine regions data
const PHILIPPINE_REGIONS = [
  { code: "NCR", name: "National Capital Region (NCR)" },
  { code: "CAR", name: "Cordillera Administrative Region (CAR)" },
  { code: "I", name: "Region I - Ilocos Region" },
  { code: "II", name: "Region II - Cagayan Valley" },
  { code: "III", name: "Region III - Central Luzon" },
  { code: "IV-A", name: "Region IV-A - CALABARZON" },
  { code: "IV-B", name: "Region IV-B - MIMAROPA" },
  { code: "V", name: "Region V - Bicol Region" },
  { code: "VI", name: "Region VI - Western Visayas" },
  { code: "VII", name: "Region VII - Central Visayas" },
  { code: "VIII", name: "Region VIII - Eastern Visayas" },
  { code: "IX", name: "Region IX - Zamboanga Peninsula" },
  { code: "X", name: "Region X - Northern Mindanao" },
  { code: "XI", name: "Region XI - Davao Region" },
  { code: "XII", name: "Region XII - SOCCSKSARGEN" },
  { code: "XIII", name: "Region XIII - Caraga" },
  { code: "BARMM", name: "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)" }
]

interface ServiceFormSharedProps {
  service?: Service
  onSuccess?: () => void
  onCancel?: () => void
}

export function ServiceFormShared({ service, onSuccess, onCancel }: ServiceFormSharedProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { categories, loading: categoriesLoading } = useCategories()

  // Form state
  const [formData, setFormData] = useState<CreateServiceData>({
    name: "",
    description: "",
    category: "",
    price: 0,
    duration: "",
    availability: "available",
    images: [],
    scope: "nationwide",
    regions: []
  })

  const [images, setImages] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Initialize form data for editing
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description,
        category: service.category,
        price: service.price,
        duration: service.duration || "",
        availability: service.availability,
        images: service.images || [],
        scope: service.scope || "nationwide",
        regions: service.regions || []
      })
      setImageUrls(service.images || [])
    }
  }, [service])

  const handleInputChange = (field: keyof CreateServiceData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file`,
          variant: "destructive"
        })
        return false
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: `${file.name} is larger than 5MB`,
          variant: "destructive"
        })
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    // Check total image limit
    const totalImages = images.length + imageUrls.length + validFiles.length
    if (totalImages > 5) {
      toast({
        title: "Too many images",
        description: "Maximum 5 images allowed per service",
        variant: "destructive"
      })
      return
    }

    setImages(prev => [...prev, ...validFiles])

    // Create preview URLs
    validFiles.forEach(file => {
      const url = URL.createObjectURL(file)
      setImageUrls(prev => [...prev, url])
    })
  }

  const removeImage = (index: number) => {
    const isNewImage = index >= (imageUrls.length - images.length)
    
    if (isNewImage) {
      // Remove from new images
      const newImageIndex = index - (imageUrls.length - images.length)
      const newImages = [...images]
      newImages.splice(newImageIndex, 1)
      setImages(newImages)
    }

    // Remove from URLs
    const newUrls = [...imageUrls]
    const removedUrl = newUrls.splice(index, 1)[0]
    
    // Revoke object URL if it's a blob URL
    if (removedUrl.startsWith('blob:')) {
      URL.revokeObjectURL(removedUrl)
    }
    
    setImageUrls(newUrls)

    // Update form data
    setFormData(prev => ({
      ...prev,
      images: newUrls.filter(url => !url.startsWith('blob:'))
    }))
  }

  const handleScopeChange = (scope: "nationwide" | "regional") => {
    setFormData(prev => ({
      ...prev,
      scope,
      regions: scope === "nationwide" ? [] : prev.regions
    }))
  }

  const handleRegionToggle = (regionCode: string) => {
    setFormData(prev => ({
      ...prev,
      regions: prev.regions.includes(regionCode)
        ? prev.regions.filter(r => r !== regionCode)
        : [...prev.regions, regionCode]
    }))
  }

  const removeRegion = (regionCode: string) => {
    setFormData(prev => ({
      ...prev,
      regions: prev.regions.filter(r => r !== regionCode)
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Service name is required",
        variant: "destructive"
      })
      return false
    }

    if (!formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Service description is required",
        variant: "destructive"
      })
      return false
    }

    if (!formData.category) {
      toast({
        title: "Validation Error",
        description: "Please select a category",
        variant: "destructive"
      })
      return false
    }

    if (formData.price <= 0) {
      toast({
        title: "Validation Error",
        description: "Price must be greater than 0",
        variant: "destructive"
      })
      return false
    }

    if (formData.scope === "regional" && formData.regions.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one region for regional services",
        variant: "destructive"
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !user) return

    setIsSubmitting(true)

    try {
      const serviceData = {
        ...formData,
        images: [...formData.images, ...images]
      }

      if (service) {
        await updateService(service.id, serviceData)
        toast({
          title: "Success",
          description: "Service updated successfully"
        })
      } else {
        await createService(serviceData, user.uid)
        toast({
          title: "Success",
          description: "Service created successfully"
        })
      }

      onSuccess?.()
    } catch (error) {
      console.error("Error saving service:", error)
      toast({
        title: "Error",
        description: "Failed to save service. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSelectedRegionNames = () => {
    return formData.regions.map(code => 
      PHILIPPINE_REGIONS.find(region => region.code === code)?.name || code
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {service ? "Edit Service" : "Add New Service"}
          </h1>
          <p className="text-gray-600 mt-1">
            {service ? "Update your service details" : "Create a new service offering"}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            Preview
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Provide the essential details about your service
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
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading categories...
                      </SelectItem>
                    ) : (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₱) *</Label>
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

              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => handleInputChange("duration", e.target.value)}
                  placeholder="e.g., 2 hours, 1 day, 1 week"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="availability">Availability</Label>
              <Select
                value={formData.availability}
                onValueChange={(value: "available" | "unavailable") => 
                  handleInputChange("availability", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Service Location/Scope */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Service Coverage Area</span>
            </CardTitle>
            <CardDescription>
              Specify where your service is available within the Philippines
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Scope Selection */}
            <div className="space-y-3">
              <Label>Service Scope *</Label>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="nationwide"
                    checked={formData.scope === "nationwide"}
                    onCheckedChange={() => handleScopeChange("nationwide")}
                  />
                  <Label htmlFor="nationwide" className="flex items-center space-x-2 cursor-pointer">
                    <Globe className="w-4 h-4" />
                    <span>Nationwide</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="regional"
                    checked={formData.scope === "regional"}
                    onCheckedChange={() => handleScopeChange("regional")}
                  />
                  <Label htmlFor="regional" className="flex items-center space-x-2 cursor-pointer">
                    <MapPin className="w-4 h-4" />
                    <span>Specific Regions Only</span>
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
                <div className="space-y-2">
                  <Label>Select Regions *</Label>
                  <p className="text-sm text-gray-600">
                    Choose the specific regions where your service is available
                  </p>
                </div>

                {/* Selected Regions Display */}
                {formData.regions.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        Selected Regions ({formData.regions.length})
                      </Label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getSelectedRegionNames().map((regionName, index) => (
                        <Badge
                          key={formData.regions[index]}
                          variant="secondary"
                          className="flex items-center space-x-1"
                        >
                          <span>{regionName}</span>
                          <button
                            type="button"
                            onClick={() => removeRegion(formData.regions[index])}
                            className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Region Selection Grid */}
                <div className="border rounded-lg p-4">
                  <ScrollArea className="h-64">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {PHILIPPINE_REGIONS.map((region) => (
                        <div key={region.code} className="flex items-center space-x-2">
                          <Checkbox
                            id={region.code}
                            checked={formData.regions.includes(region.code)}
                            onCheckedChange={() => handleRegionToggle(region.code)}
                          />
                          <Label
                            htmlFor={region.code}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {region.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {formData.regions.length === 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please select at least one region where your service is available.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Service Images</CardTitle>
            <CardDescription>
              Upload images to showcase your service (Maximum 5 images, 5MB each)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="images"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                </div>
                <input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {imageUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url || "/placeholder.svg"}
                      alt={`Service image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {service ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                {service ? "Update Service" : "Create Service"}
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Service Preview</DialogTitle>
            <DialogDescription>
              This is how your service will appear to customers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {imageUrls.slice(0, 4).map((url, index) => (
                  <img
                    key={index}
                    src={url || "/placeholder.svg"}
                    alt={`Service preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}

            <div>
              <h3 className="text-xl font-semibold">{formData.name || "Service Name"}</h3>
              <p className="text-2xl font-bold text-green-600 mt-1">
                ₱{formData.price.toFixed(2)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{formData.category || "Category"}</Badge>
              <Badge variant="outline">
                {formData.availability === "available" ? "Available" : "Unavailable"}
              </Badge>
              {formData.duration && (
                <Badge variant="outline">{formData.duration}</Badge>
              )}
            </div>

            {/* Location/Scope Display */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Service Coverage</span>
              </h4>
              {formData.scope === "nationwide" ? (
                <Badge className="bg-green-100 text-green-800">
                  <Globe className="w-3 h-3 mr-1" />
                  Nationwide
                </Badge>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Available in selected regions:</p>
                  <div className="flex flex-wrap gap-1">
                    {getSelectedRegionNames().map((regionName, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {regionName}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-gray-700 whitespace-pre-wrap">
                {formData.description || "Service description will appear here..."}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowPreview(false)}>Close Preview</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
