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
import { Plus, X, Upload, ImageIcon } from "lucide-react"

interface ProductVariation {
  id: string
  name: string
  price: string
  stock: string
  sku?: string
  images: File[]
  media: string | null
}

interface ProductFormData {
  name: string
  description: string
  category: string
  brand: string
  sku: string
  price: string
  comparePrice: string
  costPrice: string
  trackQuantity: boolean
  quantity: string
  lowStockThreshold: string
  weight: string
  dimensions: {
    length: string
    width: string
    height: string
    unit: "cm" | "in"
  }
  images: File[]
  mainImage: string
  tags: string
  specifications: Record<string, string>
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  status: "active" | "draft" | "archived"
  visibility: "public" | "private"
  featured: boolean
  condition: "new" | "used" | "refurbished"
  variations: ProductVariation[]
}

interface ProductFormSharedProps {
  formData: ProductFormData
  setFormData: (data: ProductFormData) => void
  onSubmit: (e: React.FormEvent) => void
  isSubmitting: boolean
  submitButtonText: string
  title: string
  description: string
}

export function ProductFormShared({
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  submitButtonText,
  title,
  description,
}: ProductFormSharedProps) {
  const [newSpecKey, setNewSpecKey] = useState("")
  const [newSpecValue, setNewSpecValue] = useState("")

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  const handleDimensionChange = (dimension: keyof ProductFormData["dimensions"], value: string) => {
    setFormData({
      ...formData,
      dimensions: {
        ...formData.dimensions,
        [dimension]: value,
      },
    })
  }

  const handleTagsChange = (value: string) => {
    setFormData({
      ...formData,
      tags: value,
    })
  }

  const addSpecification = () => {
    if (newSpecKey && newSpecValue) {
      setFormData({
        ...formData,
        specifications: {
          ...formData.specifications,
          [newSpecKey]: newSpecValue,
        },
      })
      setNewSpecKey("")
      setNewSpecValue("")
    }
  }

  const removeSpecification = (key: string) => {
    const newSpecs = { ...formData.specifications }
    delete newSpecs[key]
    setFormData({
      ...formData,
      specifications: newSpecs,
    })
  }

  const addVariation = () => {
    const newVariation: ProductVariation = {
      id: Date.now().toString(),
      name: "",
      price: "",
      stock: "",
      sku: "",
      images: [],
      media: null,
    }
    setFormData({
      ...formData,
      variations: [...formData.variations, newVariation],
    })
  }

  const updateVariation = (index: number, field: keyof ProductVariation, value: any) => {
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
        images: [...formData.images, ...newImages],
      })
    }
  }

  const removeImage = (index: number) => {
    const updatedImages = formData.images.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      images: updatedImages,
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
            <CardDescription>Enter the basic details of your product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter product name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleInputChange("sku", e.target.value)}
                  placeholder="Enter SKU"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter product description"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  placeholder="Enter category"
                  required
                />
              </div>
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => handleInputChange("brand", e.target.value)}
                  placeholder="Enter brand"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>Set your product pricing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="comparePrice">Compare Price</Label>
                <Input
                  id="comparePrice"
                  type="number"
                  step="0.01"
                  value={formData.comparePrice}
                  onChange={(e) => handleInputChange("comparePrice", e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="costPrice">Cost Price</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => handleInputChange("costPrice", e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
            <CardDescription>Manage your product inventory</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="trackQuantity"
                checked={formData.trackQuantity}
                onCheckedChange={(checked) => handleInputChange("trackQuantity", checked)}
              />
              <Label htmlFor="trackQuantity">Track quantity</Label>
            </div>

            {formData.trackQuantity && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange("quantity", e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    value={formData.lowStockThreshold}
                    onChange={(e) => handleInputChange("lowStockThreshold", e.target.value)}
                    placeholder="5"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Images */}
        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
            <CardDescription>Upload images for your product</CardDescription>
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

            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
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

        {/* Product Variations */}
        <Card>
          <CardHeader>
            <CardTitle>Product Variations</CardTitle>
            <CardDescription>Add different variations of your product</CardDescription>
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
                      placeholder="e.g., Size M, Color Red"
                    />
                  </div>
                  <div>
                    <Label>SKU</Label>
                    <Input
                      value={variation.sku || ""}
                      onChange={(e) => updateVariation(index, "sku", e.target.value)}
                      placeholder="Variation SKU"
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
                    <Label>Stock</Label>
                    <Input
                      type="number"
                      value={variation.stock}
                      onChange={(e) => updateVariation(index, "stock", e.target.value)}
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

        {/* SEO & Settings */}
        <Card>
          <CardHeader>
            <CardTitle>SEO & Settings</CardTitle>
            <CardDescription>Configure SEO and product settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: any) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value: any) => handleInputChange("visibility", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => handleInputChange("featured", checked)}
              />
              <Label htmlFor="featured">Featured product</Label>
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => handleTagsChange(e.target.value)}
                placeholder="Enter tags separated by commas"
              />
            </div>
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
