"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  X,
  ArrowLeft,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Check,
  Loader2,
  ImageIcon,
  Save,
  UploadIcon,
  AlertCircle,
} from "lucide-react"

// Shared interfaces
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
  availability_type: "stock" | "per_order"
  per_order_days: string
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
    color?: string
    weight?: string
    height?: string
    length?: string
    price: string
    stock: string
    images: File[]
    media: string | null
  }>
}

export interface CompanyData {
  name: string
  address_street: string
  address_city: string
  address_province: string
  website: string
}

export const STEPS = [
  { id: 1, title: "Details", description: "Basic product information" },
  { id: 2, title: "Specification", description: "Product variations and unit" },
  { id: 3, title: "Sales Information", description: "Pricing and inventory" },
  { id: 4, title: "Shipping", description: "Delivery options" },
  { id: 5, title: "Media", description: "Product images and videos" },
  { id: 6, title: "Others", description: "Additional information" },
]

export const UNIT_OPTIONS = [
  { value: "per_bottle", label: "Per Bottle" },
  { value: "per_gallon", label: "Per Gallon" },
  { value: "per_piece", label: "Per Piece" },
  { value: "per_set", label: "Per Set" },
  { value: "per_box", label: "Per Box" },
  { value: "per_square_foot", label: "Per Square Foot" },
  { value: "per_square_meter", label: "Per Square Meter" },
  { value: "per_roll", label: "Per Roll" },
  { value: "per_dozen", label: "Per Dozen" },
  { value: "per_hundred", label: "Per Hundred" },
  { value: "per_unit", label: "Per Unit" },
  { value: "per_watt", label: "Per Watt" },
]

// Updated validation function that returns validation result
export const validateStep = (
  step: number,
  formData: ProductFormData,
): { isValid: boolean; errors: { [key: string]: string } } => {
  const errors: { [key: string]: string } = {}

  switch (step) {
    case 1:
      if (formData.name.trim() === "") {
        errors.name = "Product name is required"
      }
      if (formData.description.trim() === "") {
        errors.description = "Product description is required"
      }
      if (formData.categories.length === 0) {
        errors.categories = "Please select at least one category"
      }
      break
    case 2:
      if (formData.unit.trim() === "") {
        errors.unit = "Unit selection is required"
      }
      // Require at least one variation
      if (formData.variations.length === 0) {
        errors.variations = "Please add at least one product variation"
      }
      if (formData.variations.length > 0) {
        formData.variations.forEach((variation) => {
          if (variation.name.trim() === "") {
            errors[`variation_name_${variation.id}`] = "Variation name is required"
          }
        })
      }
      break
    case 3:
      if (formData.variations.length > 0) {
        formData.variations.forEach((variation) => {
          if (variation.price.trim() === "" || Number.parseFloat(variation.price) <= 0) {
            errors[`variation_price_${variation.id}`] = "Valid price is required"
          }
          if (variation.stock.trim() === "" || Number.parseInt(variation.stock) < 0) {
            errors[`variation_stock_${variation.id}`] = "Valid stock quantity is required"
          }
        })
      }
      break
    case 4:
      if (!formData.delivery_options.delivery && !formData.delivery_options.pickup) {
        errors.delivery_options = "Please select at least one delivery option"
      }
      break
    case 5:
      // Always require at least one main product image
      if (formData.media.filter((item) => !item.isVideo).length === 0) {
        errors.product_images = "At least one product image is required"
      }
      // Validate variation images only if variations exist
      if (formData.variations.length > 0) {
        formData.variations.forEach((variation) => {
          if (!variation.media) {
            errors[`variation_media_${variation.id}`] = "An image is required for this variation"
          }
        })
      }
      break
    case 6:
      if (formData.condition.trim() === "") {
        errors.condition = "Product condition is required"
      }
      // Remove payment method validation since it's now automatic
      if (formData.availability_type === "per_order" && formData.per_order_days.trim() === "") {
        errors.per_order_days = "Delivery days is required for per order items"
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
  steps: typeof STEPS
  onStepClick?: (step: number) => void
}

export function StepNavigation({ currentStep, steps, onStepClick }: StepNavigationProps) {
  return (
    <>
      {/* Mobile: Horizontal scrollable steps */}
      <div className="lg:hidden bg-white rounded-lg shadow-sm border p-4 mb-4">
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => onStepClick?.(step.id)}
              className={`flex-shrink-0 flex flex-col items-center space-y-1 p-3 rounded-lg transition-colors min-w-[80px] ${
                currentStep === step.id ? "bg-red-50 border border-red-200" : "hover:bg-gray-50"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep > step.id
                    ? "bg-green-500 text-white"
                    : currentStep === step.id
                      ? "bg-red-500 text-white"
                      : "bg-gray-200 text-gray-600"
                }`}
              >
                {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <span
                className={`text-xs font-medium text-center ${
                  currentStep === step.id ? "text-red-600" : "text-gray-700"
                }`}
              >
                {step.title}
              </span>
            </button>
          ))}
        </div>
        {/* Mobile Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <span>
              Step {currentStep} of {steps.length}
            </span>
            <span>{Math.round((currentStep / steps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Desktop: Vertical sidebar */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border p-6 sticky top-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Product Steps</h3>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              <button
                onClick={() => onStepClick?.(step.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  currentStep === step.id ? "bg-red-50 border border-red-200" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                      currentStep > step.id
                        ? "bg-green-500 text-white"
                        : currentStep === step.id
                          ? "bg-red-500 text-white"
                          : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${currentStep === step.id ? "text-red-600" : "text-gray-900"}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 hidden xl:block">{step.description}</p>
                  </div>
                </div>
              </button>
              {/* Connector line for desktop */}
              {index < steps.length - 1 && <div className="absolute left-7 top-14 w-0.5 h-4 bg-gray-200" />}
            </div>
          ))}
        </div>

        {/* Desktop Progress Summary */}
        <div className="mt-6 pt-4 border-t">
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-2">
              Progress: {currentStep} of {steps.length}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Shared form field components
interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}

export function FormField({ label, required = false, error, children }: FormFieldProps) {
  return (
    <div>
      <Label className="text-sm font-medium text-gray-700 mb-2 block">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

// Shared category selection component
interface CategorySelectionProps {
  categories: any[]
  selectedCategories: string[]
  onCategoryChange: (categoryId: string, checked: boolean) => void
  loading: boolean
  error?: string
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
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading categories...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 bg-red-50 rounded-lg border-2 border-dashed border-red-200 text-center">
        <div className="text-red-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-red-400" />
          <p className="text-sm mb-3">{error}</p>
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 text-center">
        <div className="text-gray-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-gray-400" />
          <p className="text-sm mb-3">No active merchandise categories available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium text-gray-700 mb-2 block text-left">
        Categories <span className="text-red-500">*</span>
      </Label>

      {/* Category Selection Grid */}
      <div className="space-y-2">
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category.id)
          return (
            <div key={category.id} className="flex space-x-3 p-2 hover:bg-gray-50 rounded-md items-start flex-row">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  id={`category-${category.id}`}
                  checked={isSelected}
                  onChange={(e) => onCategoryChange(category.id, e.target.checked)}
                  className="w-4 h-4 text-red-600 bg-white border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                />
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor={`category-${category.id}`} className="cursor-pointer">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{category.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-red-600 flex-shrink-0" />}
                  </div>
                  {category.description && <p className="text-xs mt-1 text-gray-500">{category.description}</p>}
                </label>
              </div>
            </div>
          )
        })}
      </div>

      {/* Field Error */}
      {fieldError && (
        <div className="flex items-center space-x-2 text-red-600 text-sm mt-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{fieldError}</span>
        </div>
      )}
    </div>
  )
}

// Shared variation component
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
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
      <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
            {index + 1}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{variation.name || `Variation ${index + 1}`}</h4>
            {variation.price && <p className="text-sm text-gray-500">Price: ₱{variation.price}</p>}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            onClick={onRemove}
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-6 w-6"
          >
            <X className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onToggleCollapse} className="p-1 h-6 w-6">
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-4 bg-white space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`variation-name-${variation.id}`} className="text-sm font-medium text-gray-700">
                Variation Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`variation-name-${variation.id}`}
                value={variation.name}
                onChange={(e) => onUpdate("name", e.target.value)}
                placeholder="e.g., Small, Large, Red, Blue"
                className={
                  fieldErrors[`variation_name_${variation.id}`]
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : ""
                }
                required
              />
              {fieldErrors[`variation_name_${variation.id}`] && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                  {fieldErrors[`variation_name_${variation.id}`]}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor={`variation-color-${variation.id}`} className="text-sm font-medium text-gray-700">
                Color
              </Label>
              <Input
                id={`variation-color-${variation.id}`}
                value={variation.color}
                onChange={(e) => onUpdate("color", e.target.value)}
                placeholder="e.g., Red, Blue, Green"
              />
            </div>

            <div>
              <Label htmlFor={`variation-weight-${variation.id}`} className="text-sm font-medium text-gray-700">
                Weight (kg)
              </Label>
              <Input
                id={`variation-weight-${variation.id}`}
                type="number"
                step="0.01"
                value={variation.weight}
                onChange={(e) => onUpdate("weight", e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor={`variation-height-${variation.id}`} className="text-sm font-medium text-gray-700">
                Height (cm)
              </Label>
              <Input
                id={`variation-height-${variation.id}`}
                type="number"
                value={variation.height}
                onChange={(e) => onUpdate("height", e.target.value)}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor={`variation-length-${variation.id}`} className="text-sm font-medium text-gray-700">
                Length (cm)
              </Label>
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
            <div className="border-t pt-4">
              <h5 className="font-medium text-gray-800 mb-3">Pricing & Stock</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`variation-price-${variation.id}`} className="text-sm font-medium text-gray-700">
                    Price (₱) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`variation-price-${variation.id}`}
                    type="number"
                    step="0.01"
                    value={variation.price}
                    onChange={(e) => onUpdatePriceStock("price", e.target.value)}
                    placeholder="0.00"
                    className={
                      fieldErrors[`variation_price_${variation.id}`]
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }
                    required
                  />
                  {fieldErrors[`variation_price_${variation.id}`] && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                      {fieldErrors[`variation_price_${variation.id}`]}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor={`variation-stock-${variation.id}`} className="text-sm font-medium text-gray-700">
                    Stock Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`variation-stock-${variation.id}`}
                    type="number"
                    value={variation.stock}
                    onChange={(e) => onUpdatePriceStock("stock", e.target.value)}
                    placeholder="0"
                    className={
                      fieldErrors[`variation_stock_${variation.id}`]
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }
                    required
                  />
                  {fieldErrors[`variation_stock_${variation.id}`] && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                      {fieldErrors[`variation_stock_${variation.id}`]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {showMedia && (
            <div className="border-t pt-4">
              <h5 className="font-medium text-gray-800 mb-3">Variation Image</h5>
              {variation.media ? (
                <div className="space-y-3">
                  <div className="relative group inline-block">
                    <img
                      src={variation.media || "/placeholder.svg"}
                      alt={`${variation.name} image`}
                      className="w-24 h-24 object-cover rounded border"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=96&width=96"
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={onRemoveImage}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2 h-2" />
                    </Button>
                  </div>
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
                  >
                    Replace Image
                  </Button>
                </div>
              ) : (
                <div className="text-center border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  </div>
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
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3 h-3 mr-1" />
                        Add Image
                      </>
                    )}
                  </Button>
                  {fieldErrors[`variation_media_${variation.id}`] && (
                    <p className="mt-2 text-sm text-red-600 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                      {fieldErrors[`variation_media_${variation.id}`]}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Shared navigation buttons component
interface NavigationButtonsProps {
  currentStep: number
  totalSteps: number
  loading: boolean
  canProceed: boolean
  onPrevious: () => void
  onNext: () => void
  onSaveDraft?: () => void
  onSubmit: () => void
  submitLabel?: string
  isEdit?: boolean
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
  submitLabel = "Save & Publish",
  isEdit = false,
}: NavigationButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center p-4 sm:p-6 lg:p-8 border-t bg-gray-50 rounded-b-lg gap-3 sm:gap-0">
      <Button
        type="button"
        variant="ghost"
        onClick={onPrevious}
        disabled={currentStep === 1}
        className="flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800 order-2 sm:order-1"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Previous</span>
      </Button>

      {currentStep < totalSteps ? (
        <Button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="bg-red-500 hover:bg-red-600 text-white flex items-center justify-center space-x-2 px-6 order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Next</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      ) : (
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 order-1 sm:order-2">
          {onSaveDraft && (
            <Button
              type="button"
              onClick={onSaveDraft}
              disabled={loading}
              variant="outline"
              className="flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save as Draft</span>
                </>
              )}
            </Button>
          )}
          <Button
            type="button"
            onClick={onSubmit}
            disabled={loading || !canProceed}
            className="bg-green-500 hover:bg-green-600 text-white flex items-center justify-center space-x-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isEdit ? "Updating..." : "Publishing..."}</span>
              </>
            ) : (
              <>
                <UploadIcon className="w-4 h-4" />
                <span>{submitLabel}</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
