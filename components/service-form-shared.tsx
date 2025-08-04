"use client"

import { z } from "zod"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useState } from "react"
import { ImageUpload, TagInput, SeoFields } from "./product-form-shared" // Reusing components

// Zod schema for service form validation
export const serviceFormSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  duration: z.coerce.number().min(1, "Duration must be at least 1"),
  durationUnit: z.enum(["minutes", "hours", "days"]),
  images: z.array(z.string()).min(1, "At least one image is required"),
  mainImage: z.string().optional(),
  tags: z.string().optional(), // Stored as comma-separated string
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(), // Stored as comma-separated string
  status: z.enum(["active", "draft", "archived"]),
  visibility: z.enum(["public", "private"]),
  featured: z.boolean(),
  variations: z
    .array(
      z.object({
        name: z.string().min(1, "Variation name is required"),
        price: z.coerce.number().min(0.01, "Variation price must be greater than 0"),
        duration: z.coerce.number().min(1, "Variation duration must be at least 1"),
        durationUnit: z.enum(["minutes", "hours", "days"]),
      }),
    )
    .optional(),
})

export type ServiceFormData = z.infer<typeof serviceFormSchema>

interface ServiceVariationInputProps {
  variations: Array<{ name: string; price: number; duration: number; durationUnit: "minutes" | "hours" | "days" }>
  onVariationsChange: (
    variations: Array<{ name: string; price: number; duration: number; durationUnit: "minutes" | "hours" | "days" }>,
  ) => void
  disabled?: boolean
}

export function ServiceVariationInput({ variations, onVariationsChange, disabled }: ServiceVariationInputProps) {
  const [newVariationName, setNewVariationName] = useState("")
  const [newVariationPrice, setNewVariationPrice] = useState("")
  const [newVariationDuration, setNewVariationDuration] = useState("")
  const [newVariationDurationUnit, setNewVariationDurationUnit] = useState<"minutes" | "hours" | "days">("minutes")

  const handleAddVariation = () => {
    if (newVariationName.trim() && newVariationPrice.trim() && newVariationDuration.trim()) {
      onVariationsChange([
        ...variations,
        {
          name: newVariationName.trim(),
          price: Number.parseFloat(newVariationPrice),
          duration: Number.parseInt(newVariationDuration),
          durationUnit: newVariationDurationUnit,
        },
      ])
      setNewVariationName("")
      setNewVariationPrice("")
      setNewVariationDuration("")
      setNewVariationDurationUnit("minutes")
    }
  }

  const handleRemoveVariation = (indexToRemove: number) => {
    onVariationsChange(variations.filter((_, index) => index !== indexToRemove))
  }

  return (
    <div className="space-y-2">
      <Label>Service Variations</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
        <Input
          placeholder="Name (e.g., Basic)"
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
          placeholder="Duration"
          value={newVariationDuration}
          onChange={(e) => setNewVariationDuration(e.target.value)}
          disabled={disabled}
        />
        <div className="flex gap-2">
          <Select value={newVariationDurationUnit} onValueChange={setNewVariationDurationUnit} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minutes">Minutes</SelectItem>
              <SelectItem value="hours">Hours</SelectItem>
              <SelectItem value="days">Days</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" onClick={handleAddVariation} disabled={disabled}>
            Add
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {variations.map((variation, index) => (
          <div key={index} className="flex items-center justify-between rounded-md border p-2">
            <span>
              {variation.name} - {variation.price} ({variation.duration} {variation.durationUnit})
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

interface ServiceStatusAndVisibilityProps {
  status: "active" | "draft" | "archived"
  onStatusChange: (value: "active" | "draft" | "archived") => void
  visibility: "public" | "private"
  onVisibilityChange: (value: "public" | "private") => void
  featured: boolean
  onFeaturedChange: (checked: boolean) => void
  disabled?: boolean
}

export function ServiceStatusAndVisibility({
  status,
  onStatusChange,
  visibility,
  onVisibilityChange,
  featured,
  onFeaturedChange,
  disabled,
}: ServiceStatusAndVisibilityProps) {
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
        <Label htmlFor="featured">Featured Service</Label>
      </div>
    </div>
  )
}

export { ImageUpload, TagInput, SeoFields }
