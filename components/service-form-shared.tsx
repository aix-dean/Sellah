"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, X, Upload, ImageIcon } from "lucide-react"
import type { ServiceFormData, ServiceVariation } from "@/types/service"

interface ServiceFormSharedProps {
  formData: ServiceFormData
  setFormData: (data: ServiceFormData) => void
  onSubmit: (e: React.FormEvent) => void
  isSubmitting: boolean
  submitButtonText: string
  title: string
  description: string
}

export function ServiceFormShared({
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  submitButtonText,
  title,
  description,
}: ServiceFormSharedProps) {
  const [newCategory, setNewCategory] = useState("")

  const handleInputChange = (field: keyof ServiceFormData, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  const handleAvailabilityChange = (day: keyof ServiceFormData["availability"], checked: boolean) => {
    setFormData({
      ...formData,
      availability: {
        ...formData.availability,
        [day]: checked,
      },
    })
  }

  const handlePaymentMethodChange = (method: keyof ServiceFormData["payment_methods"], checked: boolean) => {
    setFormData({
      ...formData,
      payment_methods: {
        ...formData.payment_methods,
        [method]: checked,
      },
    })
  }

  const addCategory = () => {
    if (newCategory && !formData.categories.includes(newCategory)) {
      setFormData({
        ...formData,
        categories: [...formData.categories, newCategory],
      })
      setNewCategory("")
    }
  }

  const removeCategory = (category: string) => {
    setFormData({
      ...formData,
      categories: formData.categories.filter((c) => c !== category),
    })
  }

  const addVariation = () => {
    const newVariation: ServiceVariation = {
      id: Date.now().toString(),
      name: "",
      duration: "",
      price: "",
      slots: "",
      images: [],
      media: null,
    }
    setFormData({
      ...formData,
      variations: [...formData.variations, newVariation],
    })
  }

  const updateVariation = (index: number, field: keyof ServiceVariation, value: any) => {
    const updatedVariations = formData.variations.map((variation, i) =>
      i === index ? { ...variation, [field]: value } : variation,
    )
    setFormData({
      ...formData,
      variations: updatedVariations,
    })
  }

  const removeVariation = (index: number) => {
    const updatedVariations = formData.variations.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      variations: updatedVariations,
    })
  }

  const handleImageUpload = (files: FileList | null) => {
    if (files) {
      const newImages = Array.from(files)
      setFormData({
        ...formData,
        service_images: [...formData.service_images, ...newImages],
      })
    }
  }

  const removeImage = (index: number) => {
    const updatedImages = formData.service_images.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      service_images: updatedImages,
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-2">{description}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the basic details of your service</CardDescription>
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
                placeholder="Enter service description"
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="unit">Unit *</Label>
              <Select value={formData.unit} onValueChange={(value) => handleInputChange("unit", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_hour">Per Hour</SelectItem>
                  <SelectItem value="per_session">Per Session</SelectItem>
                  <SelectItem value="per_day">Per Day</SelectItem>
                  <SelectItem value="per_project">Per Project</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Add categories for your service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter category"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
              />
              <Button type="button" onClick={addCategory}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {formData.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.categories.map((category) => (
                  <div key={category} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                    <span className="text-sm">{category}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => removeCategory(category)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Images */}
        <Card>
          <CardHeader>
            <CardTitle>Service Images</CardTitle>
            <CardDescription>Upload images for your service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="images">Upload Images</Label>
              <div className="mt-2">
                <input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("images")?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Images
                </Button>
              </div>
            </div>

            {formData.service_images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.service_images.map((image, index) => (
                  <div key={index} className="relative">
                    <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => removeImage(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    <p className="text-xs text-gray-500 mt-1 truncate">{image.name}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Availability */}
        <Card>
          <CardHeader>
            <CardTitle>Availability</CardTitle>
            <CardDescription>Set your service availability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(formData.availability).map(([day, available]) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={day}
                    checked={available}
                    onCheckedChange={(checked) =>
                      handleAvailabilityChange(day as keyof ServiceFormData["availability"], checked as boolean)
                    }
                  />
                  <Label htmlFor={day} className="capitalize">
                    {day}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pre-order Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Pre-order Settings</CardTitle>
            <CardDescription>Configure pre-order requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_pre_order"
                checked={formData.is_pre_order}
                onCheckedChange={(checked) => handleInputChange("is_pre_order", checked)}
              />
              <Label htmlFor="is_pre_order">Require pre-order</Label>
            </div>

            {formData.is_pre_order && (
              <div>
                <Label htmlFor="pre_order_days">Pre-order Days</Label>
                <Input
                  id="pre_order_days"
                  type="number"
                  value={formData.pre_order_days}
                  onChange={(e) => handleInputChange("pre_order_days", e.target.value)}
                  placeholder="Number of days"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Select accepted payment methods</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(formData.payment_methods).map(([method, accepted]) => (
                <div key={method} className="flex items-center space-x-2">
                  <Checkbox
                    id={method}
                    checked={accepted}
                    onCheckedChange={(checked) =>
                      handlePaymentMethodChange(method as keyof ServiceFormData["payment_methods"], checked as boolean)
                    }
                  />
                  <Label htmlFor={method} className="capitalize">
                    {method.replace("_", " ")}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Service Variations */}
        <Card>
          <CardHeader>
            <CardTitle>Service Variations</CardTitle>
            <CardDescription>Add different variations of your service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.variations.map((variation, index) => (
              <div key={variation.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Variation {index + 1}</h4>
                  <Button type="button" variant="destructive" size="sm" onClick={() => removeVariation(index)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Variation Name</Label>
                    <Input
                      value={variation.name}
                      onChange={(e) => updateVariation(index, "name", e.target.value)}
                      placeholder="e.g., Basic Package, Premium Package"
                    />
                  </div>
                  <div>
                    <Label>Duration</Label>
                    <Input
                      value={variation.duration}
                      onChange={(e) => updateVariation(index, "duration", e.target.value)}
                      placeholder="e.g., 1 hour, 2 days"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={variation.price}
                      onChange={(e) => updateVariation(index, "price", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Available Slots</Label>
                    <Input
                      type="number"
                      value={variation.slots}
                      onChange={(e) => updateVariation(index, "slots", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addVariation} className="w-full bg-transparent">
              <Plus className="w-4 h-4 mr-2" />
              Add Variation
            </Button>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="bg-red-500 hover:bg-red-600">
            {isSubmitting ? "Saving..." : submitButtonText}
          </Button>
        </div>
      </form>
    </div>
  )
}
