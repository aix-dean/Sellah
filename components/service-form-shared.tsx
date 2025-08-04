"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, X, Clock, Calendar, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Service } from "@/types/service"

const DAYS_OF_WEEK = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
]

const SERVICE_TYPES = [
  { value: "roll_up", label: "Roll Up" },
  { value: "roll_down", label: "Roll Down" },
  { value: "delivery", label: "Delivery" },
]

interface ScheduleDay {
  available: boolean
  startTime: string
  endTime: string
}

type Schedule = {
  [key: string]: ScheduleDay
}

interface ServiceFormSharedProps {
  initialData?: Partial<Service>
  onSubmit: (data: any, imageFile?: File) => Promise<void>
  submitButtonText: string
  isSubmitting: boolean
}

export function ServiceFormShared({ initialData, onSubmit, submitButtonText, isSubmitting }: ServiceFormSharedProps) {
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    serviceType: initialData?.serviceType || "",
    price: initialData?.price?.toString() || "",
  })

  const [schedule, setSchedule] = useState<Schedule>(() => {
    if (initialData?.schedule) {
      return initialData.schedule
    }

    const initialSchedule: Schedule = {}
    DAYS_OF_WEEK.forEach(({ key }) => {
      initialSchedule[key] = {
        available: false,
        startTime: "00:00",
        endTime: "23:59",
      }
    })
    return initialSchedule
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleScheduleChange = (day: string, field: keyof ScheduleDay, value: boolean | string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size should be less than 5MB",
          variant: "destructive",
        })
        return
      }

      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Service name is required"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    }

    if (!formData.serviceType) {
      newErrors.serviceType = "Service type is required"
    }

    if (!formData.price || Number.parseFloat(formData.price) <= 0) {
      newErrors.price = "Valid price is required"
    }

    // Check if at least one day is selected
    const hasAvailableDay = Object.values(schedule).some((day) => day.available)
    if (!hasAvailableDay) {
      newErrors.schedule = "Please select at least one available day"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const serviceData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      serviceType: formData.serviceType as "roll_up" | "roll_down" | "delivery",
      price: Number.parseFloat(formData.price),
      schedule,
      type: "SERVICE",
      status: "active",
      views: initialData?.views || 0,
      bookings: initialData?.bookings || 0,
      rating: initialData?.rating || 5,
      // imageUrl: imagePreview || "", // Removed this line
    }

    await onSubmit(serviceData, imageFile || undefined)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter service name"
                className={errors.name ? "border-red-500" : ""}
                disabled={isSubmitting}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type *</Label>
              <Select
                value={formData.serviceType}
                onValueChange={(value) => handleInputChange("serviceType", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger className={errors.serviceType ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.serviceType && <p className="text-sm text-red-500">{errors.serviceType}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe your service..."
              rows={4}
              className={errors.description ? "border-red-500" : ""}
              disabled={isSubmitting}
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (PHP) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => handleInputChange("price", e.target.value)}
              placeholder="0.00"
              className={errors.price ? "border-red-500" : ""}
              disabled={isSubmitting}
            />
            {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Service Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {errors.schedule && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errors.schedule}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            {DAYS_OF_WEEK.map(({ key, label }) => (
              <div key={key} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="flex items-center space-x-2 min-w-[120px]">
                  <Checkbox
                    id={key}
                    checked={schedule[key].available}
                    onCheckedChange={(checked) => handleScheduleChange(key, "available", !!checked)}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor={key} className="font-medium">
                    {label}
                  </Label>
                </div>

                {schedule[key].available && (
                  <div className="flex items-center space-x-2 flex-1">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <Input
                      type="time"
                      value={schedule[key].startTime}
                      onChange={(e) => handleScheduleChange(key, "startTime", e.target.value)}
                      className="w-32"
                      disabled={isSubmitting}
                    />
                    <span className="text-gray-500">to</span>
                    <Input
                      type="time"
                      value={schedule[key].endTime}
                      onChange={(e) => handleScheduleChange(key, "endTime", e.target.value)}
                      className="w-32"
                      disabled={isSubmitting}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Image Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Service Image</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!imagePreview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">Upload service image</p>
                  <p className="text-gray-500">PNG, JPG up to 5MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                  disabled={isSubmitting}
                />
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" className="mt-4 bg-transparent" disabled={isSubmitting}>
                    Choose Image
                  </Button>
                </Label>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Service preview"
                  className="w-full h-64 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={removeImage}
                  className="absolute top-2 right-2"
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            submitButtonText
          )}
        </Button>
      </div>
    </form>
  )
}
