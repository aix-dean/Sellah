"use client"

import type React from "react"

import { useState } from "react"
import { Upload, X, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"

interface Schedule {
  [key: string]: {
    available: boolean
    startTime: string
    endTime: string
  }
}

interface ServiceFormData {
  name: string
  description: string
  price: string
  serviceType: string
  category: string
}

interface ServiceFormSharedProps {
  initialData?: ServiceFormData
  initialSchedule?: Schedule
  initialImageUrl?: string
  onSubmit: (data: ServiceFormData, schedule: Schedule, image: File | null) => Promise<void>
  isSubmitting: boolean
  submitButtonText: string
}

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

const SERVICE_TYPES = [
  { value: "roll_up", label: "Roll Up" },
  { value: "roll_down", label: "Roll Down" },
  { value: "delivery", label: "Delivery" },
]

export default function ServiceFormShared({
  initialData,
  initialSchedule,
  initialImageUrl,
  onSubmit,
  isSubmitting,
  submitButtonText,
}: ServiceFormSharedProps) {
  const [formData, setFormData] = useState<ServiceFormData>(
    initialData || {
      name: "",
      description: "",
      price: "",
      serviceType: "",
      category: "",
    },
  )

  const [schedule, setSchedule] = useState<Schedule>(() => {
    if (initialSchedule) return initialSchedule

    const defaultSchedule: Schedule = {}
    DAYS_OF_WEEK.forEach((day) => {
      defaultSchedule[day] = {
        available: false,
        startTime: "00:00",
        endTime: "23:59",
      }
    })
    return defaultSchedule
  })

  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(initialImageUrl || null)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleScheduleChange = (day: string, field: "available" | "startTime" | "endTime", value: boolean | string) => {
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
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(initialImageUrl || null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData, schedule, image)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            <div>
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="serviceType">Service Type *</Label>
              <Select value={formData.serviceType} onValueChange={(value) => handleInputChange("serviceType", value)}>
                <SelectTrigger>
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
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                placeholder="Enter category (optional)"
              />
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
              {imagePreview ? (
                <div className="relative">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={imagePreview || "/placeholder.svg"}
                      alt="Service preview"
                      width={400}
                      height={400}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <Label htmlFor="image" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">Upload service image</span>
                        <span className="mt-1 block text-sm text-gray-500">PNG, JPG, GIF up to 10MB</span>
                      </Label>
                      <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Service Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Select the days and times when this service is available</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={day}
                      checked={schedule[day].available}
                      onCheckedChange={(checked) => handleScheduleChange(day, "available", checked as boolean)}
                    />
                    <Label htmlFor={day} className="capitalize font-medium">
                      {day}
                    </Label>
                  </div>

                  {schedule[day].available && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-gray-500">Start Time</Label>
                        <Input
                          type="time"
                          value={schedule[day].startTime}
                          onChange={(e) => handleScheduleChange(day, "startTime", e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">End Time</Label>
                        <Input
                          type="time"
                          value={schedule[day].endTime}
                          onChange={(e) => handleScheduleChange(day, "endTime", e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Processing..." : submitButtonText}
        </Button>
      </div>
    </form>
  )
}
