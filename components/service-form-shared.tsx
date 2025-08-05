"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload, X, Clock, Calendar } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import type { Service } from "@/types/service"

interface ServiceFormValues {
  name: string
  description: string
  serviceType: "roll_up" | "roll_down" | "delivery"
  price: number
  status: "active" | "inactive" | "draft"
  schedule: {
    [key: string]: {
      available: boolean
      startTime: string
      endTime: string
    }
  }
}

interface ServiceFormSharedProps {
  initialData?: Partial<Service>
  onSubmit: (data: ServiceFormValues, imageUrls: string[], newImageFiles: File[]) => Promise<void>
  isLoading?: boolean
  submitButtonText?: string
}

const DAYS_OF_WEEK = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
]

export default function ServiceFormShared({
  initialData,
  onSubmit,
  isLoading = false,
  submitButtonText = "Create Service",
}: ServiceFormSharedProps) {
  const [formData, setFormData] = useState<ServiceFormValues>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    serviceType: initialData?.serviceType || "roll_up",
    price: initialData?.price || 0,
    status: initialData?.status || "active",
    schedule: initialData?.schedule || {
      monday: { available: false, startTime: "09:00", endTime: "17:00" },
      tuesday: { available: false, startTime: "09:00", endTime: "17:00" },
      wednesday: { available: false, startTime: "09:00", endTime: "17:00" },
      thursday: { available: false, startTime: "09:00", endTime: "17:00" },
      friday: { available: false, startTime: "09:00", endTime: "17:00" },
      saturday: { available: false, startTime: "09:00", endTime: "17:00" },
      sunday: { available: false, startTime: "09:00", endTime: "17:00" },
    },
  })

  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(initialData?.imageUrls || [])
  const [newImageFiles, setNewImageFiles] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])
  const [error, setError] = useState("")

  const handleInputChange = (field: keyof ServiceFormValues, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleScheduleChange = (day: string, field: "available" | "startTime" | "endTime", value: any) => {
    setFormData((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          [field]: value,
        },
      },
    }))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Validate file types
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        setError("Please select only image files")
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB")
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    // Check total image limit
    const totalImages = existingImageUrls.length + newImageFiles.length + validFiles.length
    if (totalImages > 10) {
      setError("Maximum 10 images allowed")
      return
    }

    setError("")
    setNewImageFiles((prev) => [...prev, ...validFiles])

    // Generate previews for new files
    validFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setNewImagePreviews((prev) => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeExistingImage = (index: number) => {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const removeNewImage = (index: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index))
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!formData.name.trim()) {
      setError("Service name is required")
      return
    }

    if (!formData.description.trim()) {
      setError("Service description is required")
      return
    }

    if (formData.price <= 0) {
      setError("Price must be greater than 0")
      return
    }

    // Check if at least one day is available
    const hasAvailableDay = Object.values(formData.schedule).some((day) => day.available)
    if (!hasAvailableDay) {
      setError("Please select at least one available day")
      return
    }

    try {
      await onSubmit(formData, existingImageUrls, newImageFiles)
    } catch (error: any) {
      setError(error.message || "Failed to save service")
    }
  }

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case "roll_up":
        return "Roll Up"
      case "roll_down":
        return "Roll Down"
      case "delivery":
        return "Delivery"
      default:
        return type
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="serviceType">Service Type *</Label>
              <Select
                value={formData.serviceType}
                onValueChange={(value) => handleInputChange("serviceType", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="roll_up">Roll Up</SelectItem>
                  <SelectItem value="roll_down">Roll Down</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="price">Price (PHP) *</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => handleInputChange("price", Number.parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Service Images */}
      <Card>
        <CardHeader>
          <CardTitle>Service Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="images">Upload Images (Max 10)</Label>
            <Input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="cursor-pointer"
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500 mt-1">Select multiple images (JPG, PNG, GIF). Max 5MB each.</p>
          </div>

          {/* Image Previews */}
          {(existingImageUrls.length > 0 || newImagePreviews.length > 0) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {/* Existing Images */}
              {existingImageUrls.map((url, index) => (
                <div key={`existing-${index}`} className="relative group">
                  <img
                    src={url || "/placeholder.svg"}
                    alt={`Service image ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeExistingImage(index)}
                    disabled={isLoading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <Badge variant="secondary" className="absolute bottom-1 left-1 text-xs">
                    Saved
                  </Badge>
                </div>
              ))}

              {/* New Image Previews */}
              {newImagePreviews.map((preview, index) => (
                <div key={`new-${index}`} className="relative group">
                  <img
                    src={preview || "/placeholder.svg"}
                    alt={`New service image ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeNewImage(index)}
                    disabled={isLoading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <Badge variant="outline" className="absolute bottom-1 left-1 text-xs">
                    New
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Service Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS_OF_WEEK.map(({ key, label }) => (
            <div key={key} className="flex items-center space-x-4 p-3 border rounded-lg">
              <div className="flex items-center space-x-2 min-w-[120px]">
                <Checkbox
                  id={`${key}-available`}
                  checked={formData.schedule[key]?.available || false}
                  onCheckedChange={(checked) => handleScheduleChange(key, "available", checked)}
                  disabled={isLoading}
                />
                <Label htmlFor={`${key}-available`} className="font-medium">
                  {label}
                </Label>
              </div>

              {formData.schedule[key]?.available && (
                <div className="flex items-center space-x-2 flex-1">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <Input
                    type="time"
                    value={formData.schedule[key]?.startTime || "09:00"}
                    onChange={(e) => handleScheduleChange(key, "startTime", e.target.value)}
                    className="w-auto"
                    disabled={isLoading}
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="time"
                    value={formData.schedule[key]?.endTime || "17:00"}
                    onChange={(e) => handleScheduleChange(key, "endTime", e.target.value)}
                    className="w-auto"
                    disabled={isLoading}
                  />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" disabled={isLoading} onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-red-500 hover:bg-red-600 text-white">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              {submitButtonText}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
