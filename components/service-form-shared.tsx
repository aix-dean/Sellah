"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X, ImageIcon } from "lucide-react"
import { ServiceService } from "@/lib/service-service"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import type { CreateServiceData, Service } from "@/types/service"

interface ServiceFormSharedProps {
  initialData?: Partial<Service>
  onSubmit: (data: CreateServiceData) => Promise<void>
  isSubmitting: boolean
  submitButtonText: React.ReactNode
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

export function ServiceFormShared({ initialData, onSubmit, isSubmitting, submitButtonText }: ServiceFormSharedProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    serviceType: initialData?.serviceType || "delivery",
    price: initialData?.price || 0,
    status: initialData?.status || "active",
  })

  const [schedule, setSchedule] = useState(
    initialData?.schedule || {
      monday: { available: false, startTime: "09:00", endTime: "17:00" },
      tuesday: { available: false, startTime: "09:00", endTime: "17:00" },
      wednesday: { available: false, startTime: "09:00", endTime: "17:00" },
      thursday: { available: false, startTime: "09:00", endTime: "17:00" },
      friday: { available: false, startTime: "09:00", endTime: "17:00" },
      saturday: { available: false, startTime: "09:00", endTime: "17:00" },
      sunday: { available: false, startTime: "09:00", endTime: "17:00" },
    },
  )

  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>(initialData?.imageUrls || [])
  const [uploadingImage, setUploadingImage] = useState(false)

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleScheduleChange = (day: string, field: string, value: any) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }))
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      const newImageFiles = [...imageFiles, ...files]
      setImageFiles(newImageFiles)

      const newImagePreviews: string[] = []
      files.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          newImagePreviews.push(e.target?.result as string)
          if (newImagePreviews.length === files.length) {
            setImagePreviews((prev) => [...prev, ...newImagePreviews])
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeImage = (indexToRemove: number) => {
    setImageFiles((prev) => prev.filter((_, index) => index !== indexToRemove))
    setImagePreviews((prev) => prev.filter((_, index) => index !== indexToRemove))
    // If it's an existing image (from initialData), we might need to track it for deletion on save
    // For simplicity, this example only handles new uploads.
    // A more robust solution would track initialData.imageUrls separately and manage deletions.
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a service.",
        variant: "destructive",
      })
      return
    }

    try {
      let uploadedImageUrls: string[] = []

      // Upload new images if any
      if (imageFiles.length > 0) {
        setUploadingImage(true)
        const uploadPromises = imageFiles.map((file) => ServiceService.uploadServiceImage(file, user.uid))
        uploadedImageUrls = await Promise.all(uploadPromises)
        setUploadingImage(false)
      }

      // Combine existing image URLs with newly uploaded ones
      const finalImageUrls = [...(initialData?.imageUrls || []), ...uploadedImageUrls]

      const serviceData: CreateServiceData = {
        name: formData.name,
        description: formData.description,
        serviceType: formData.serviceType as "roll_up" | "roll_down" | "delivery",
        price: Number(formData.price),
        schedule,
        userId: user.uid,
        type: "SERVICES",
        status: formData.status as "active" | "inactive" | "draft",
        views: 0,
        bookings: 0,
        rating: 5,
        imageUrls: finalImageUrls, // Use imageUrls array
      }

      await onSubmit(serviceData)
    } catch (error: any) {
      console.error("Error in form submission:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingImage(false)
    }
  }

  return (
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="serviceType">Service Type *</Label>
            <Select
              value={formData.serviceType}
              onValueChange={(value) => handleInputChange("serviceType", value)}
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange("status", value)}
              disabled={isSubmitting}
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
        </CardContent>
      </Card>

      {/* Service Images */}
      <Card>
        <CardHeader>
          <CardTitle>Service Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {imagePreviews.map((src, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={src || "/placeholder.svg"}
                      alt={`Service preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                      disabled={isSubmitting || uploadingImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Click to upload more images</p>
              <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB each</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple // Allow multiple file selection
              onChange={handleImageSelect}
              className="hidden"
              disabled={isSubmitting || uploadingImage}
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting || uploadingImage}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploadingImage ? "Uploading..." : "Add More Images"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Availability Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.key} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="flex items-center space-x-2 min-w-[120px]">
                  <Switch
                    checked={schedule[day.key]?.available || false}
                    onCheckedChange={(checked) => handleScheduleChange(day.key, "available", checked)}
                    disabled={isSubmitting}
                  />
                  <Label className="font-medium">{day.label}</Label>
                </div>

                {schedule[day.key]?.available && (
                  <div className="flex items-center space-x-2 flex-1">
                    <Input
                      type="time"
                      value={schedule[day.key]?.startTime || "09:00"}
                      onChange={(e) => handleScheduleChange(day.key, "startTime", e.target.value)}
                      disabled={isSubmitting}
                      className="w-32"
                    />
                    <span className="text-gray-500">to</span>
                    <Input
                      type="time"
                      value={schedule[day.key]?.endTime || "17:00"}
                      onChange={(e) => handleScheduleChange(day.key, "endTime", e.target.value)}
                      disabled={isSubmitting}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || uploadingImage || !formData.name || !formData.description}
          className="bg-red-500 hover:bg-red-600 text-white min-w-[150px]"
        >
          {submitButtonText}
        </Button>
      </div>
    </form>
  )
}
