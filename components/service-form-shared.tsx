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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { useCategories } from "@/hooks/use-categories"
import { Upload, X, Loader2, AlertCircle, MapPin, Globe, CheckCircle, Info, Calendar } from 'lucide-react'
import type { Service } from "@/types/service"
import type { ServiceSchedule } from "@/types/schedule"

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

// Days of the week
const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
]

interface ServiceFormSharedProps {
  initialData?: Service
  onSubmit: (serviceData: any, existingImageUrls: string[], newImageFiles: File[]) => Promise<void>
  isLoading: boolean
  submitButtonText: string
}

export default function ServiceFormShared({ initialData, onSubmit, isLoading, submitButtonText }: ServiceFormSharedProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { categories = [], loading: categoriesLoading } = useCategories()

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: 0,
    duration: "",
    availability: "available" as "available" | "unavailable",
    scope: "nationwide" as "nationwide" | "regional",
    regions: [] as string[]
  })

  // Schedule state
  const [schedule, setSchedule] = useState<ServiceSchedule>({
    monday: { available: true, startTime: "09:00", endTime: "17:00" },
    tuesday: { available: true, startTime: "09:00", endTime: "17:00" },
    wednesday: { available: true, startTime: "09:00", endTime: "17:00" },
    thursday: { available: true, startTime: "09:00", endTime: "17:00" },
    friday: { available: true, startTime: "09:00", endTime: "17:00" },
    saturday: { available: false, startTime: "09:00", endTime: "17:00" },
    sunday: { available: false, startTime: "09:00", endTime: "17:00" }
  })

  const [images, setImages] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)

  // Initialize form data for editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        category: initialData.category || "",
        price: initialData.price || 0,
        duration: initialData.duration || "",
        availability: initialData.availability || "available",
        scope: initialData.scope || "nationwide",
        regions: initialData.regions || []
      })
      setImageUrls(initialData.imageUrls || [])
      
      // Initialize schedule if available, otherwise use default
      if (initialData.schedule) {
        setSchedule(initialData.schedule)
      } else {
        // If no schedule data, ensure default values are applied
        setSchedule({
          monday: { available: true, startTime: "09:00", endTime: "17:00" },
          tuesday: { available: true, startTime: "09:00", endTime: "17:00" },
          wednesday: { available: true, startTime: "09:00", endTime: "17:00" },
          thursday: { available: true, startTime: "09:00", endTime: "17:00" },
          friday: { available: true, startTime: "09:00", endTime: "17:00" },
          saturday: { available: false, startTime: "09:00", endTime: "17:00" },
          sunday: { available: false, startTime: "09:00", endTime: "17:00" }
        })
      }
    }
  }, [initialData])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleScheduleChange = (day: string, field: 'available' | 'startTime' | 'endTime', value: any) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        [field]: value
      }
    }))
  }

  const formatTimeForDisplay = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`
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
    // Determine if the image to remove is a new file or an existing URL
    const isNewImage = index >= (imageUrls.length - images.length)
    
    if (isNewImage) {
      // If it's a new image file, remove it from the 'images' state
      const newImageIndex = index - (imageUrls.length - images.length)
      const newImages = [...images]
      newImages.splice(newImageIndex, 1)
      setImages(newImages)
    }

    // Remove from URLs
    const newUrls = [...imageUrls]
    const removedUrl = newUrls.splice(index, 1)[0]
    
    // Revoke object URL if it's a blob URL (for new images)
    if (removedUrl && removedUrl.startsWith('blob:')) {
      URL.revokeObjectURL(removedUrl)
    }
    
    setImageUrls(newUrls)
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

    const existingImageUrls = imageUrls.filter(url => !url.startsWith('blob:'))
    const newImageFiles = images

    // Include schedule in form data
    const serviceData = {
      ...formData,
      schedule
    }

    await onSubmit(serviceData, existingImageUrls, newImageFiles)
  }

  const getSelectedRegionNames = () => {
    if (!formData.regions || formData.regions.length === 0) return []
    
    return formData.regions.map(code => 
      PHILIPPINE_REGIONS.find(region => region.code === code)?.name || code
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setShowPreview(true)}>
          Preview
        </Button>
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
              <div className="space-y-2">
                <Label htmlFor="category">Service Type *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Roll Up" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Hardcoded options as per user request */}
                    <SelectItem value="Roll Up">Roll Up</SelectItem>
                    <SelectItem value="Roll Down">Roll Down</SelectItem>
                    <SelectItem value="Delivery">Delivery</SelectItem>
                    {/* Removed dynamic categories loading as per user request for specific options */}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="availability">Status</Label>
                <Select
                  value={formData.availability}
                  onValueChange={(value: "available" | "unavailable") => 
                    handleInputChange("availability", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Active" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Active</SelectItem>
                    <SelectItem value="unavailable">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                placeholder="0"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Service Images */}
        <Card>
          <CardHeader>
            <CardTitle>Service Images</CardTitle>
            <CardDescription>
              Upload Images (Max 5) - Select multiple images (JPG, PNG, GIF). Max 5MB each.
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
                    <span className="font-semibold">Choose Files</span> No file chosen
                  </p>
                  <p className="text-xs text-gray-500">Select multiple images (JPG, PNG, GIF). Max 5MB each.</p>
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

            {imageUrls && imageUrls.length > 0 && (
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

        {/* Service Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Service Schedule</span>
            </CardTitle>
            <CardDescription>
              Set your availability for each day of the week
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.key} className="flex items-center space-x-4 p-3 border rounded-lg">
                <div className="flex items-center space-x-2 min-w-[120px]">
                  <Checkbox
                    id={day.key}
                    checked={schedule[day.key as keyof typeof schedule].available}
                    onCheckedChange={(checked) => 
                      handleScheduleChange(day.key, 'available', checked)
                    }
                  />
                  <Label htmlFor={day.key} className="cursor-pointer">
                    {day.label}
                  </Label>
                </div>

                {schedule[day.key as keyof typeof schedule].available && (
                  <div className="flex items-center space-x-2 flex-1">
                    <Input
                      type="time"
                      value={schedule[day.key as keyof typeof schedule].startTime}
                      onChange={(e) => 
                        handleScheduleChange(day.key, 'startTime', e.target.value)
                      }
                      className="w-32"
                    />
                    <span className="text-sm text-gray-500">to</span>
                    <Input
                      type="time"
                      value={schedule[day.key as keyof typeof schedule].endTime}
                      onChange={(e) => 
                        handleScheduleChange(day.key, 'endTime', e.target.value)
                      }
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Service Coverage Area */}
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
                {formData.regions && formData.regions.length > 0 && (
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
                            checked={formData.regions && formData.regions.includes(region.code)}
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

                {(!formData.regions || formData.regions.length === 0) && (
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

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="min-w-[120px] bg-red-500 hover:bg-red-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {submitButtonText.includes("Update") ? "Updating..." : "Creating..."}
              </>
            ) : (
              submitButtonText
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
            {imageUrls && imageUrls.length > 0 && (
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

            {/* Schedule Display */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Schedule</span>
              </h4>
              <div className="space-y-1">
                {DAYS_OF_WEEK.map((day) => {
                  const daySchedule = schedule[day.key as keyof typeof schedule]
                  return (
                    <div key={day.key} className="flex items-center justify-between text-sm">
                      <span className={daySchedule.available ? "text-gray-900" : "text-gray-400"}>
                        {day.label}
                      </span>
                      <span className={daySchedule.available ? "text-gray-700" : "text-gray-400"}>
                        {daySchedule.available 
                          ? `${formatTimeForDisplay(daySchedule.startTime)} - ${formatTimeForDisplay(daySchedule.endTime)}`
                          : "Closed"
                        }
                      </span>
                    </div>
                  )
                })}
              </div>
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
