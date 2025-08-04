"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, ImageIcon, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import type { ServiceFormData } from "@/types/service"
import { StepNavigation, CategorySelection, NavigationButtons } from "@/components/product-form-shared"

// Step definitions for service creation/editing
export const SERVICE_STEPS = [
  { id: 1, title: "Service Details", description: "Basic service information" },
  { id: 2, title: "Pricing & Availability", description: "Cost, duration, and schedule" },
  { id: 3, title: "Media", description: "Service images and videos" },
  { id: 4, title: "Others", description: "Additional settings" },
]

// Unit options for services (can be different from products)
export const SERVICE_UNIT_OPTIONS = [
  { value: "per_hour", label: "Per Hour" },
  { value: "per_session", label: "Per Session" },
  { value: "per_day", label: "Per Day" },
  { value: "per_project", label: "Per Project" },
  { value: "per_person", label: "Per Person" },
]

// Validation function for each step
export function validateServiceStep(
  step: number,
  formData: ServiceFormData,
): { isValid: boolean; errors: { [key: string]: string } } {
  const errors: { [key: string]: string } = {}

  switch (step) {
    case 1: // Service Details
      if (!formData.name.trim()) {
        errors.name = "Service name is required"
      }
      if (!formData.description.trim()) {
        errors.description = "Service description is required"
      }
      if (!formData.categories || formData.categories.length === 0) {
        errors.categories = "At least one category must be selected"
      }
      if (!formData.unit) {
        errors.unit = "Unit is required"
      }
      break

    case 2: // Pricing & Availability
      if (!formData.variations || formData.variations.length === 0) {
        errors.variations = "At least one service variation is required"
      } else {
        formData.variations.forEach((variation, index) => {
          if (!variation.name.trim()) {
            errors[`variation_${index}_name`] = `Variation ${index + 1} name is required`
          }
          if (!variation.price || Number.parseFloat(variation.price) <= 0) {
            errors[`variation_${index}_price`] = `Variation ${index + 1} price is required and must be greater than 0`
          }
          if (!variation.slots || Number.parseInt(variation.slots) < 0) {
            errors[`variation_${index}_slots`] = `Variation ${index + 1} slots is required and cannot be negative`
          }
        })
      }
      if (!Object.values(formData.availability).some(Boolean)) {
        errors.availability = "At least one day of availability must be selected"
      }
      break

    case 3: // Media
      const hasImages = formData.service_images.length > 0
      if (!hasImages) {
        errors.service_images = "At least one service image is required"
      }
      break

    case 4: // Others
      if (formData.is_pre_order && (!formData.pre_order_days || Number.parseInt(formData.pre_order_days) <= 0)) {
        errors.pre_order_days = "Pre-order delivery days is required and must be greater than 0"
      }
      break
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// Re-exporting generic components from product-form-shared
export { StepNavigation, CategorySelection, NavigationButtons }

// Service Variation Item Component (adapted from Product Variation Item)
interface ServiceVariationItemProps {
  variation: ServiceFormData["variations"][0]
  index: number
  isCollapsed: boolean
  onToggleCollapse: () => void
  onRemove: () => void
  onUpdate: (field: string, value: string) => void
  onUpdatePriceSlots: (field: string, value: string) => void
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: () => void
  uploading: boolean
  fieldErrors: { [key: string]: string }
  showPricing?: boolean
  showMedia?: boolean
  unit: string
}

export function ServiceVariationItem({
  variation,
  index,
  isCollapsed,
  onToggleCollapse,
  onRemove,
  onUpdate,
  onUpdatePriceSlots,
  onImageUpload,
  onRemoveImage,
  uploading,
  fieldErrors,
  showPricing = false,
  showMedia = false,
  unit,
}: ServiceVariationItemProps) {
  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <button type="button" onClick={onToggleCollapse} className="text-gray-500 hover:text-gray-700">
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <h4 className="font-medium text-gray-800">
            Variation {index + 1} {variation.name && `- ${variation.name}`}
          </h4>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {!isCollapsed && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`service-variation-name-${variation.id}`}>Variation Name *</Label>
              <Input
                id={`service-variation-name-${variation.id}`}
                value={variation.name}
                onChange={(e) => onUpdate("name", e.target.value)}
                placeholder="e.g., Basic, Premium, etc."
                className={fieldErrors[`variation_${index}_name`] ? "border-red-500" : ""}
              />
              {fieldErrors[`variation_${index}_name`] && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors[`variation_${index}_name`]}</p>
              )}
            </div>

            <div>
              <Label htmlFor={`service-variation-duration-${variation.id}`}>Duration ({unit})</Label>
              <Input
                id={`service-variation-duration-${variation.id}`}
                value={variation.duration}
                onChange={(e) => onUpdate("duration", e.target.value)}
                placeholder="e.g., 30 mins, 1 hour"
              />
            </div>
          </div>

          {showPricing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label htmlFor={`service-variation-price-${variation.id}`}>Price (₱) *</Label>
                <Input
                  id={`service-variation-price-${variation.id}`}
                  type="number"
                  step="0.01"
                  value={variation.price}
                  onChange={(e) => onUpdatePriceSlots("price", e.target.value)}
                  placeholder="0.00"
                  className={fieldErrors[`variation_${index}_price`] ? "border-red-500" : ""}
                />
                {fieldErrors[`variation_${index}_price`] && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors[`variation_${index}_price`]}</p>
                )}
              </div>

              <div>
                <Label htmlFor={`service-variation-slots-${variation.id}`}>Available Slots *</Label>
                <Input
                  id={`service-variation-slots-${variation.id}`}
                  type="number"
                  value={variation.slots}
                  onChange={(e) => onUpdatePriceSlots("slots", e.target.value)}
                  placeholder="0"
                  className={fieldErrors[`variation_${index}_slots`] ? "border-red-500" : ""}
                />
                {fieldErrors[`variation_${index}_slots`] && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors[`variation_${index}_slots`]}</p>
                )}
              </div>
            </div>
          )}

          {showMedia && (
            <div className="pt-4 border-t">
              <Label className="text-sm font-medium mb-2 block">Variation Image</Label>
              {variation.media ? (
                <div className="space-y-3">
                  <div className="relative group inline-block">
                    <img
                      src={variation.media || "/placeholder.svg"}
                      alt={`${variation.name} image`}
                      className="w-20 h-20 object-cover rounded border"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=80&width=80"
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={onRemoveImage}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onImageUpload}
                    className="hidden"
                    id={`service-variation-replace-${variation.id}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById(`service-variation-replace-${variation.id}`)?.click()}
                    disabled={uploading}
                  >
                    Replace Image
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onImageUpload}
                    className="hidden"
                    id={`service-variation-upload-${variation.id}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById(`service-variation-upload-${variation.id}`)?.click()}
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Add Image
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
