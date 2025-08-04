"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, X, ImageIcon, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"
import { Input } from "@/components/ui/input"

// Step definitions for product creation/editing
export const STEPS = [
  { id: 1, title: "Product Details", description: "Basic product information" },
  { id: 2, title: "Specification", description: "Product variations and specifications" },
  { id: 3, title: "Sales Information", description: "Pricing and stock management" },
  { id: 4, title: "Shipping", description: "Delivery and pickup options" },
  { id: 5, title: "Media", description: "Product images and videos" },
  { id: 6, title: "Others", description: "Additional settings" },
]

// Unit options for products
export const UNIT_OPTIONS = [
  { value: "per_bottle", label: "Per Bottle" },
  { value: "per_gallon", label: "Per Gallon" },
  { value: "per_piece", label: "Per Piece" },
  { value: "per_set", label: "Per Set" },
  { value: "per_box", label: "Per Box" },
  { value: "per_square_foot", label: "Per Square Foot" },
  { value: "per_square_meter", label: "Per Square Meter" },
  { value: "per_roll", label: "Per Roll" },
  { value: "per_dozon", label: "Per Dozen" },
  { value: "per_hundred", label: "Per Hundred" },
  { value: "per_unit", label: "Per Unit" },
  { value: "per_watt", label: "Per Watt" },
]

// Product form data interface
export interface ProductFormData {
  name: string
  description: string
  categories: string[]
  unit: string
  delivery_options: {
    delivery: boolean
    pickup: boolean
    delivery_note: string
    pickup_note: string
    couriers: {
      lalamove: boolean
      transportify: boolean
    }
  }
  product_images: File[]
  product_video: File | null
  media: Array<{
    distance: string
    isVideo: boolean
    type: string
    url: string
  }>
  delivery_days: string
  condition: string
  is_pre_order: boolean
  pre_order_days: string
  payment_methods: {
    ewallet: boolean
    bank_transfer: boolean
    gcash: boolean
    maya: boolean
    manual: boolean
  }
  variations: Array<{
    id: string
    name: string
    color: string
    weight: string
    height: string
    length: string
    price: string
    stock: string
    images: File[]
    media: string | null
  }>
}

// Validation function for each step
export function validateStep(
  step: number,
  formData: ProductFormData,
): { isValid: boolean; errors: { [key: string]: string } } {
  const errors: { [key: string]: string } = {}

  switch (step) {
    case 1: // Product Details
      if (!formData.name.trim()) {
        errors.name = "Product name is required"
      }
      if (!formData.description.trim()) {
        errors.description = "Product description is required"
      }
      if (!formData.categories || formData.categories.length === 0) {
        errors.categories = "At least one category must be selected"
      }
      break

    case 2: // Specification
      if (!formData.unit) {
        errors.unit = "Unit is required"
      }
      if (!formData.variations || formData.variations.length === 0) {
        errors.variations = "At least one variation is required"
      } else {
        // Validate each variation
        formData.variations.forEach((variation, index) => {
          if (!variation.name.trim()) {
            errors[`variation_${index}_name`] = `Variation ${index + 1} name is required`
          }
        })
      }
      break

    case 3: // Sales Information
      if (formData.variations && formData.variations.length > 0) {
        formData.variations.forEach((variation, index) => {
          if (!variation.price || Number.parseFloat(variation.price) <= 0) {
            errors[`variation_${index}_price`] = `Variation ${index + 1} price is required and must be greater than 0`
          }
          if (!variation.stock || Number.parseInt(variation.stock) < 0) {
            errors[`variation_${index}_stock`] = `Variation ${index + 1} stock is required and cannot be negative`
          }
        })
      }
      break

    case 4: // Shipping
      if (!formData.delivery_options.delivery && !formData.delivery_options.pickup) {
        errors.delivery_options = "At least one delivery option (delivery or pickup) must be selected"
      }
      if (formData.delivery_options.delivery) {
        if (!formData.delivery_options.couriers.lalamove && !formData.delivery_options.couriers.transportify) {
          errors.couriers = "At least one courier must be selected when delivery is enabled"
        }
      }
      break

    case 5: // Media
      const hasImages = formData.media.filter((item) => !item.isVideo).length > 0 || formData.product_images.length > 0
      if (!hasImages) {
        errors.product_images = "At least one product image is required"
      }
      break

    case 6: // Others
      if (!formData.condition) {
        errors.condition = "Product condition is required"
      }
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

// Shared step navigation component
interface StepNavigationProps {
  currentStep: number
  steps: { id: number; title: string; description: string }[]
}

export function StepNavigation({ currentStep, steps }: StepNavigationProps) {
  return (
    <nav className="space-y-4">
      {steps.map((step) => (
        <div key={step.id} className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full font-semibold",
              currentStep === step.id ? "bg-primary text-primary-foreground" : "bg-gray-200 text-gray-600",
            )}
          >
            {step.id}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{step.title}</h3>
            <p className="text-sm text-gray-500">{step.description}</p>
          </div>
        </div>
      ))}
    </nav>
  )
}

// Shared category selection component
interface CategorySelectionProps {
  categories: { id: string; name: string }[]
  selectedCategories: string[]
  onCategoryChange: (categoryId: string, checked: boolean) => void
  loading: boolean
  error: string | null
  fieldError?: string
}

export function CategorySelection({
  categories,
  selectedCategories,
  onCategoryChange,
  loading,
  error,
  fieldError,
}: CategorySelectionProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700 mb-2 block text-left">
        Categories * (Select at least one)
      </Label>
      <div
        className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4 rounded-lg border ${fieldError ? "border-red-500" : "border-gray-300"}`}
      >
        {loading && <p className="col-span-full text-center text-gray-500">Loading categories...</p>}
        {error && (
          <Alert variant="destructive" className="col-span-full">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!loading && categories.length === 0 && !error && (
          <p className="col-span-full text-center text-gray-500">No categories available.</p>
        )}
        {categories.map((category) => (
          <label key={category.id} className="flex items-center space-x-2 cursor-pointer select-none">
            <Checkbox
              checked={selectedCategories.includes(category.id)}
              onCheckedChange={(checked) => onCategoryChange(category.id, !!checked)}
              id={`category-${category.id}`}
            />
            <span className="text-sm text-gray-700">{category.name}</span>
          </label>
        ))}
      </div>
      {fieldError && (
        <div className="mt-1 flex items-center text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
          <span>{fieldError}</span>
        </div>
      )}
    </div>
  )
}

// Variation Item Component
interface VariationItemProps {
  variation: ProductFormData["variations"][0]
  index: number
  isCollapsed: boolean
  onToggleCollapse: () => void
  onRemove: () => void
  onUpdate: (field: string, value: string) => void
  onUpdatePriceStock: (field: string, value: string) => void
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: () => void
  uploading: boolean
  fieldErrors: { [key: string]: string }
  showPricing?: boolean
  showMedia?: boolean
  unit: string
}

export function VariationItem({
  variation,
  index,
  isCollapsed,
  onToggleCollapse,
  onRemove,
  onUpdate,
  onUpdatePriceStock,
  onImageUpload,
  onRemoveImage,
  uploading,
  fieldErrors,
  showPricing = false,
  showMedia = false,
  unit,
}: VariationItemProps) {
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
              <Label htmlFor={`variation-name-${variation.id}`}>Variation Name *</Label>
              <Input
                id={`variation-name-${variation.id}`}
                value={variation.name}
                onChange={(e) => onUpdate("name", e.target.value)}
                placeholder="e.g., Small, Red, etc."
                className={fieldErrors[`variation_${index}_name`] ? "border-red-500" : ""}
              />
              {fieldErrors[`variation_${index}_name`] && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors[`variation_${index}_name`]}</p>
              )}
            </div>

            <div>
              <Label htmlFor={`variation-color-${variation.id}`}>Color</Label>
              <Input
                id={`variation-color-${variation.id}`}
                value={variation.color}
                onChange={(e) => onUpdate("color", e.target.value)}
                placeholder="e.g., Red, Blue, etc."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor={`variation-weight-${variation.id}`}>Weight (kg)</Label>
              <Input
                id={`variation-weight-${variation.id}`}
                type="number"
                step="0.1"
                value={variation.weight}
                onChange={(e) => onUpdate("weight", e.target.value)}
                placeholder="0.0"
              />
            </div>

            <div>
              <Label htmlFor={`variation-height-${variation.id}`}>Height (cm)</Label>
              <Input
                id={`variation-height-${variation.id}`}
                type="number"
                value={variation.height}
                onChange={(e) => onUpdate("height", e.target.value)}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor={`variation-length-${variation.id}`}>Length (cm)</Label>
              <Input
                id={`variation-length-${variation.id}`}
                type="number"
                value={variation.length}
                onChange={(e) => onUpdate("length", e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {showPricing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label htmlFor={`variation-price-${variation.id}`}>Price (₱) *</Label>
                <Input
                  id={`variation-price-${variation.id}`}
                  type="number"
                  step="0.01"
                  value={variation.price}
                  onChange={(e) => onUpdatePriceStock("price", e.target.value)}
                  placeholder="0.00"
                  className={fieldErrors[`variation_${index}_price`] ? "border-red-500" : ""}
                />
                {fieldErrors[`variation_${index}_price`] && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors[`variation_${index}_price`]}</p>
                )}
              </div>

              <div>
                <Label htmlFor={`variation-stock-${variation.id}`}>Stock Quantity *</Label>
                <Input
                  id={`variation-stock-${variation.id}`}
                  type="number"
                  value={variation.stock}
                  onChange={(e) => onUpdatePriceStock("stock", e.target.value)}
                  placeholder="0"
                  className={fieldErrors[`variation_${index}_stock`] ? "border-red-500" : ""}
                />
                {fieldErrors[`variation_${index}_stock`] && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors[`variation_${index}_stock`]}</p>
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
                    id={`variation-replace-${variation.id}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById(`variation-replace-${variation.id}`)?.click()}
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
                    id={`variation-upload-${variation.id}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById(`variation-upload-${variation.id}`)?.click()}
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

// Shared navigation buttons for multi-step forms
interface NavigationButtonsProps {
  currentStep: number
  totalSteps: number
  loading: boolean
  canProceed: boolean
  onPrevious: () => void
  onNext: () => void
  onSaveDraft: () => void
  onSubmit: () => void
  submitLabel?: string
}

export function NavigationButtons({
  currentStep,
  totalSteps,
  loading,
  canProceed,
  onPrevious,
  onNext,
  onSaveDraft,
  onSubmit,
  submitLabel = "Submit",
}: NavigationButtonsProps) {
  return (
    <div className="flex justify-between p-6 border-t border-gray-200">
      <Button type="button" variant="outline" onClick={onPrevious} disabled={currentStep === 1 || loading}>
        <ChevronLeft className="w-4 h-4 mr-2" />
        Previous
      </Button>
      <div className="flex gap-2">
        {currentStep < totalSteps && (
          <Button type="button" variant="outline" onClick={onSaveDraft} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Draft"
            )}
          </Button>
        )}
        {currentStep < totalSteps ? (
          <Button type="button" onClick={onNext} disabled={!canProceed || loading}>
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button type="button" onClick={onSubmit} disabled={!canProceed || loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {submitLabel.replace("Service", "ing...")}
              </>
            ) : (
              submitLabel
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
