"use client"

import { Badge } from "@/components/ui/badge"

import type React from "react"

import { z } from "zod"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"
import { useState } from "react"

// Zod schema for product form validation
export const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  brand: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  comparePrice: z.coerce.number().optional(),
  costPrice: z.coerce.number().optional(),
  trackQuantity: z.boolean(),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative").optional(),
  lowStockThreshold: z.coerce.number().min(0, "Threshold cannot be negative").optional(),
  weight: z.coerce.number().min(0, "Weight cannot be negative").optional(),
  dimensions: z
    .object({
      length: z.coerce.number().min(0, "Length cannot be negative").optional(),
      width: z.coerce.number().min(0, "Width cannot be negative").optional(),
      height: z.coerce.number().min(0, "Height cannot be negative").optional(),
      unit: z.enum(["cm", "in"]).optional(),
    })
    .optional(),
  images: z.array(z.string()).min(1, "At least one image is required"),
  mainImage: z.string().optional(),
  tags: z.string().optional(), // Stored as comma-separated string
  specifications: z.record(z.string(), z.string()).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(), // Stored as comma-separated string
  status: z.enum(["active", "draft", "archived"]),
  visibility: z.enum(["public", "private"]),
  featured: z.boolean(),
  condition: z.enum(["new", "used", "refurbished"]),
  variations: z
    .array(
      z.object({
        name: z.string().min(1, "Variation name is required"),
        price: z.coerce.number().min(0.01, "Variation price must be greater than 0"),
        stock: z.coerce.number().min(0, "Variation stock cannot be negative"),
        sku: z.string().optional(),
      }),
    )
    .optional(),
})

export type ProductFormData = z.infer<typeof productFormSchema>

interface ImageUploadProps {
  images: string[]
  onImageUpload: (file: File) => Promise<string>
  onImageRemove: (url: string) => void
  onSetMainImage: (url: string) => void
  mainImage?: string
  disabled?: boolean
}

export function ImageUpload({
  images,
  onImageUpload,
  onImageRemove,
  onSetMainImage,
  mainImage,
  disabled,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploading(true)
      try {
        const file = e.target.files[0]
        const url = await onImageUpload(file)
        if (!mainImage) {
          onSetMainImage(url) // Set first uploaded image as main if none is set
        }
      } catch (error) {
        console.error("Error uploading image:", error)
        // Handle error, e.g., show a toast
      } finally {
        setUploading(false)
        e.target.value = "" // Clear the input
      }
    }
  }

  return (
    <div className="space-y-4">
      <Label htmlFor="images">Product Images</Label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative group aspect-square rounded-md overflow-hidden border">
            <img
              src={image || "/placeholder.svg"}
              alt={`Product image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="destructive"
                size="icon"
                className="mr-2"
                onClick={() => onImageRemove(image)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant={mainImage === image ? "default" : "secondary"}
                size="sm"
                onClick={() => onSetMainImage(image)}
                disabled={disabled}
              >
                {mainImage === image ? "Main" : "Set Main"}
              </Button>
            </div>
          </div>
        ))}
        <div className="aspect-square rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center">
          <Label htmlFor="image-upload" className="cursor-pointer p-4">
            {uploading ? <span>Uploading...</span> : <Plus className="h-8 w-8 text-gray-400" />}
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
              disabled={disabled || uploading}
            />
          </Label>
        </div>
      </div>
    </div>
  )
}

interface TagInputProps {
  tags: string[]
  onTagsChange: (tags: string[]) => void
  disabled?: boolean
}

export function TagInput({ tags, onTagsChange, disabled }: TagInputProps) {
  const [inputValue, setInputValue] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim() !== "") {
      e.preventDefault()
      const newTag = inputValue.trim()
      if (!tags.includes(newTag)) {
        onTagsChange([...tags, newTag])
      }
      setInputValue("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove))
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="tags">Tags</Label>
      <Input
        id="tags"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        placeholder="Add tags (press Enter to add)"
        disabled={disabled}
      />
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-1">
            {tag}
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0.5 text-muted-foreground hover:text-foreground"
              onClick={() => removeTag(tag)}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  )
}

interface SpecificationInputProps {
  specifications: Record<string, string>
  onSpecificationsChange: (specs: Record<string, string>) => void
  disabled?: boolean
}

export function SpecificationInput({ specifications, onSpecificationsChange, disabled }: SpecificationInputProps) {
  const [newSpecKey, setNewSpecKey] = useState("")
  const [newSpecValue, setNewSpecValue] = useState("")

  const handleAddSpec = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      onSpecificationsChange({
        ...specifications,
        [newSpecKey.trim()]: newSpecValue.trim(),
      })
      setNewSpecKey("")
      setNewSpecValue("")
    }
  }

  const handleRemoveSpec = (keyToRemove: string) => {
    const newSpecs = { ...specifications }
    delete newSpecs[keyToRemove]
    onSpecificationsChange(newSpecs)
  }

  return (
    <div className="space-y-2">
      <Label>Specifications</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Input
          placeholder="Key (e.g., Color)"
          value={newSpecKey}
          onChange={(e) => setNewSpecKey(e.target.value)}
          disabled={disabled}
        />
        <div className="flex gap-2">
          <Input
            placeholder="Value (e.g., Red)"
            value={newSpecValue}
            onChange={(e) => setNewSpecValue(e.target.value)}
            disabled={disabled}
          />
          <Button type="button" onClick={handleAddSpec} disabled={disabled}>
            Add
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {Object.entries(specifications).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between rounded-md border p-2">
            <span>
              <strong>{key}:</strong> {value}
            </span>
            <Button variant="ghost" size="sm" onClick={() => handleRemoveSpec(key)} disabled={disabled}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

interface VariationInputProps {
  variations: Array<{ name: string; price: number; stock: number; sku?: string }>
  onVariationsChange: (variations: Array<{ name: string; price: number; stock: number; sku?: string }>) => void
  disabled?: boolean
}

export function VariationInput({ variations, onVariationsChange, disabled }: VariationInputProps) {
  const [newVariationName, setNewVariationName] = useState("")
  const [newVariationPrice, setNewVariationPrice] = useState("")
  const [newVariationStock, setNewVariationStock] = useState("")
  const [newVariationSku, setNewVariationSku] = useState("")

  const handleAddVariation = () => {
    if (newVariationName.trim() && newVariationPrice.trim() && newVariationStock.trim()) {
      onVariationsChange([
        ...variations,
        {
          name: newVariationName.trim(),
          price: Number.parseFloat(newVariationPrice),
          stock: Number.parseInt(newVariationStock),
          sku: newVariationSku.trim() || undefined,
        },
      ])
      setNewVariationName("")
      setNewVariationPrice("")
      setNewVariationStock("")
      setNewVariationSku("")
    }
  }

  const handleRemoveVariation = (indexToRemove: number) => {
    onVariationsChange(variations.filter((_, index) => index !== indexToRemove))
  }

  return (
    <div className="space-y-2">
      <Label>Variations</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
        <Input
          placeholder="Name (e.g., Small)"
          value={newVariationName}
          onChange={(e) => setNewVariationName(e.target.value)}
          disabled={disabled}
        />
        <Input
          type="number"
          placeholder="Price"
          value={newVariationPrice}
          onChange={(e) => setNewVariationPrice(e.target.value)}
          disabled={disabled}
        />
        <Input
          type="number"
          placeholder="Stock"
          value={newVariationStock}
          onChange={(e) => setNewVariationStock(e.target.value)}
          disabled={disabled}
        />
        <div className="flex gap-2">
          <Input
            placeholder="SKU (optional)"
            value={newVariationSku}
            onChange={(e) => setNewVariationSku(e.target.value)}
            disabled={disabled}
          />
          <Button type="button" onClick={handleAddVariation} disabled={disabled}>
            Add
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {variations.map((variation, index) => (
          <div key={index} className="flex items-center justify-between rounded-md border p-2">
            <span>
              {variation.name} - {variation.price} ({variation.stock} in stock) {variation.sku && `[${variation.sku}]`}
            </span>
            <Button variant="ghost" size="sm" onClick={() => handleRemoveVariation(index)} disabled={disabled}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

interface SeoFieldsProps {
  seoTitle: string
  onSeoTitleChange: (value: string) => void
  seoDescription: string
  onSeoDescriptionChange: (value: string) => void
  seoKeywords: string[]
  onSeoKeywordsChange: (keywords: string[]) => void
  disabled?: boolean
}

export function SeoFields({
  seoTitle,
  onSeoTitleChange,
  seoDescription,
  onSeoDescriptionChange,
  seoKeywords,
  onSeoKeywordsChange,
  disabled,
}: SeoFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="seoTitle">SEO Title</Label>
        <Input
          id="seoTitle"
          value={seoTitle}
          onChange={(e) => onSeoTitleChange(e.target.value)}
          placeholder="SEO friendly title"
          disabled={disabled}
        />
      </div>
      <div>
        <Label htmlFor="seoDescription">SEO Description</Label>
        <Textarea
          id="seoDescription"
          value={seoDescription}
          onChange={(e) => onSeoDescriptionChange(e.target.value)}
          placeholder="Meta description for search engines"
          disabled={disabled}
        />
      </div>
      <TagInput tags={seoKeywords} onTagsChange={onSeoKeywordsChange} disabled={disabled} />
    </div>
  )
}

interface ProductStatusAndVisibilityProps {
  status: "active" | "draft" | "archived"
  onStatusChange: (value: "active" | "draft" | "archived") => void
  visibility: "public" | "private"
  onVisibilityChange: (value: "public" | "private") => void
  featured: boolean
  onFeaturedChange: (checked: boolean) => void
  condition: "new" | "used" | "refurbished"
  onConditionChange: (value: "new" | "used" | "refurbished") => void
  disabled?: boolean
}

export function ProductStatusAndVisibility({
  status,
  onStatusChange,
  visibility,
  onVisibilityChange,
  featured,
  onFeaturedChange,
  condition,
  onConditionChange,
  disabled,
}: ProductStatusAndVisibilityProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={onStatusChange} disabled={disabled}>
          <SelectTrigger id="status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="visibility">Visibility</Label>
        <Select value={visibility} onValueChange={onVisibilityChange} disabled={disabled}>
          <SelectTrigger id="visibility">
            <SelectValue placeholder="Select visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="featured" checked={featured} onCheckedChange={onFeaturedChange} disabled={disabled} />
        <Label htmlFor="featured">Featured Product</Label>
      </div>
      <div className="space-y-2">
        <Label htmlFor="condition">Condition</Label>
        <Select value={condition} onValueChange={onConditionChange} disabled={disabled}>
          <SelectTrigger id="condition">
            <SelectValue placeholder="Select condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="used">Used</SelectItem>
            <SelectItem value="refurbished">Refurbished</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
