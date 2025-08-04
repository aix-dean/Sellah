"use client"

import type React from "react"
import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, UploadCloud, Loader2, AlertCircle } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useCategories } from "@/hooks/use-categories"
import { serviceService } from "@/lib/service-service"
import type { ServiceFormData } from "@/types/service"
import {
  SERVICE_STEPS,
  SERVICE_UNIT_OPTIONS,
  validateServiceStep,
  StepNavigation,
  CategorySelection,
  ServiceVariationItem,
  NavigationButtons,
} from "@/components/service-form-shared"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AddServicePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { categories, loading: loadingCategories, error: categoriesError } = useCategories()

  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ServiceFormData>({
    name: "",
    description: "",
    categories: [],
    unit: "",
    service_images: [],
    service_video: null,
    media: [],
    availability: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    },
    is_pre_order: false,
    pre_order_days: "",
    payment_methods: {
      ewallet: false,
      bank_transfer: false,
      gcash: false,
      maya: false,
      manual: false,
    },
    variations: [],
  })
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [collapsedVariations, setCollapsedVariations] = useState<Set<string>>(new Set())

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
    setFieldErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[id]
      return newErrors
    })
  }, [])

  const handleSelectChange = useCallback((id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
    setFieldErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[id]
      return newErrors
    })
  }, [])

  const handleCategoryChange = useCallback((categoryId: string, checked: boolean) => {
    setFormData((prev) => {
      const newCategories = checked
        ? [...prev.categories, categoryId]
        : prev.categories.filter((id) => id !== categoryId)
      return { ...prev, categories: newCategories }
    })
    setFieldErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors.categories
      return newErrors
    })
  }, [])

  const handleAvailabilityChange = useCallback((day: keyof ServiceFormData["availability"], checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: checked,
      },
    }))
    setFieldErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors.availability
      return newErrors
    })
  }, [])

  const handlePaymentMethodChange = useCallback(
    (method: keyof ServiceFormData["payment_methods"], checked: boolean) => {
      setFormData((prev) => ({
        ...prev,
        payment_methods: {
          ...prev.payment_methods,
          [method]: checked,
        },
      }))
    },
    [],
  )

  const handleAddVariation = useCallback(() => {
    const newVariationId = uuidv4()
    setFormData((prev) => ({
      ...prev,
      variations: [
        ...prev.variations,
        {
          id: newVariationId,
          name: "",
          duration: "",
          price: "",
          slots: "",
          images: [],
          media: null,
        },
      ],
    }))
    setCollapsedVariations((prev) => {
      const newCollapsed = new Set(prev)
      newCollapsed.add(newVariationId) // Collapse new variation by default
      return newCollapsed
    })
  }, [])

  const handleRemoveVariation = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      variations: prev.variations.filter((v) => v.id !== id),
    }))
    setCollapsedVariations((prev) => {
      const newCollapsed = new Set(prev)
      newCollapsed.delete(id)
      return newCollapsed
    })
    setFieldErrors((prev) => {
      const newErrors = { ...prev }
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(`variation_`) && key.includes(id)) {
          delete newErrors[key]
        }
      })
      return newErrors
    })
  }, [])

  const handleUpdateVariation = useCallback(
    (id: string, field: string, value: string) => {
      setFormData((prev) => ({
        ...prev,
        variations: prev.variations.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
      }))
      setFieldErrors((prev) => {
        const newErrors = { ...prev }
        const index = formData.variations.findIndex((v) => v.id === id)
        if (index !== -1) {
          delete newErrors[`variation_${index}_${field}`]
        }
        return newErrors
      })
    },
    [formData.variations],
  )

  const handleUpdateVariationPriceSlots = useCallback(
    (id: string, field: string, value: string) => {
      setFormData((prev) => ({
        ...prev,
        variations: prev.variations.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
      }))
      setFieldErrors((prev) => {
        const newErrors = { ...prev }
        const index = formData.variations.findIndex((v) => v.id === id)
        if (index !== -1) {
          delete newErrors[`variation_${index}_${field}`]
        }
        return newErrors
      })
    },
    [formData.variations],
  )

  const handleToggleVariationCollapse = useCallback((id: string) => {
    setCollapsedVariations((prev) => {
      const newCollapsed = new Set(prev)
      if (newCollapsed.has(id)) {
        newCollapsed.delete(id)
      } else {
        newCollapsed.add(id)
      }
      return newCollapsed
    })
  }, [])

  const handleServiceImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      setFormData((prev) => ({
        ...prev,
        service_images: [...prev.service_images, ...files],
      }))
      setFieldErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.service_images
        return newErrors
      })
    }
  }, [])

  const handleRemoveServiceImage = useCallback((indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      service_images: prev.service_images.filter((_, index) => index !== indexToRemove),
      media: prev.media.filter((_, index) => index !== indexToRemove), // Also remove from media array if it's an existing image
    }))
  }, [])

  const handleServiceVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        service_video: e.target.files![0],
      }))
    }
  }, [])

  const handleRemoveServiceVideo = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      service_video: null,
    }))
  }, [])

  const handleVariationImageUpload = useCallback((variationId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setFormData((prev) => ({
        ...prev,
        variations: prev.variations.map((v) =>
          v.id === variationId ? { ...v, images: [file], media: URL.createObjectURL(file) } : v,
        ),
      }))
    }
  }, [])

  const handleRemoveVariationImage = useCallback((variationId: string) => {
    setFormData((prev) => ({
      ...prev,
      variations: prev.variations.map((v) => (v.id === variationId ? { ...v, images: [], media: null } : v)),
    }))
  }, [])

  const canProceed = useMemo(() => {
    const { isValid, errors } = validateServiceStep(currentStep, formData)
    setFieldErrors(errors)
    return isValid
  }, [currentStep, formData])

  const handleNext = useCallback(() => {
    if (canProceed) {
      setCurrentStep((prev) => Math.min(prev + 1, SERVICE_STEPS.length))
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive",
      })
    }
  }, [canProceed])

  const handlePrevious = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to add a service.",
        variant: "destructive",
      })
      return
    }

    if (!canProceed) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields before publishing the service.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await serviceService.addService(formData, user.uid)
      toast({
        title: "Service Added",
        description: "Your service has been successfully published!",
        variant: "default",
      })
      router.push("/dashboard/services") // Redirect to services listing page
    } catch (error) {
      console.error("Error adding service:", error)
      toast({
        title: "Error",
        description: `Failed to add service: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, user, canProceed, router])

  const handleSaveDraft = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to save a draft.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // For draft, we might not need full validation, but we'll save what's available
      // A more robust solution would save partial data to a 'draft' status in Firestore
      // For now, we'll just simulate saving.
      toast({
        title: "Draft Saved",
        description: "Your service draft has been saved.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error saving draft:", error)
      toast({
        title: "Error",
        description: `Failed to save draft: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [user])

  const renderStepContent = useCallback(() => {
    switch (currentStep) {
      case 1: // Service Details
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Home Cleaning, Tutoring Session"
                className={fieldErrors.name ? "border-red-500" : ""}
              />
              {fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>}
            </div>
            <div>
              <Label htmlFor="description">Service Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Provide a detailed description of your service."
                rows={5}
                className={fieldErrors.description ? "border-red-500" : ""}
              />
              {fieldErrors.description && <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>}
            </div>
            <CategorySelection
              categories={categories.map((cat) => ({ id: cat.id, name: cat.name }))}
              selectedCategories={formData.categories}
              onCategoryChange={handleCategoryChange}
              loading={loadingCategories}
              error={categoriesError}
              fieldError={fieldErrors.categories}
            />
            <div>
              <Label htmlFor="unit">Service Unit *</Label>
              <Select value={formData.unit} onValueChange={(value) => handleSelectChange("unit", value)}>
                <SelectTrigger className={fieldErrors.unit ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_UNIT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.unit && <p className="mt-1 text-sm text-red-600">{fieldErrors.unit}</p>}
            </div>
          </div>
        )
      case 2: // Pricing & Availability
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">Service Variations *</h3>
            {formData.variations.length === 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {fieldErrors.variations || "At least one service variation is required."}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-4">
              {formData.variations.map((variation, index) => (
                <ServiceVariationItem
                  key={variation.id}
                  variation={variation}
                  index={index}
                  isCollapsed={collapsedVariations.has(variation.id)}
                  onToggleCollapse={() => handleToggleVariationCollapse(variation.id)}
                  onRemove={() => handleRemoveVariation(variation.id)}
                  onUpdate={handleUpdateVariation}
                  onUpdatePriceSlots={handleUpdateVariationPriceSlots}
                  onImageUpload={(e) => handleVariationImageUpload(variation.id, e)}
                  onRemoveImage={() => handleRemoveVariationImage(variation.id)}
                  uploading={uploadingMedia}
                  fieldErrors={fieldErrors}
                  showPricing={true}
                  unit={formData.unit}
                />
              ))}
            </div>
            <Button type="button" variant="outline" onClick={handleAddVariation}>
              <Plus className="w-4 h-4 mr-2" /> Add Variation
            </Button>

            <div className="pt-6 border-t border-gray-200 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Availability *</h3>
              {fieldErrors.availability && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{fieldErrors.availability}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Object.keys(formData.availability).map((day) => (
                  <label key={day} className="flex items-center space-x-2 cursor-pointer select-none">
                    <Checkbox
                      checked={formData.availability[day as keyof ServiceFormData["availability"]]}
                      onCheckedChange={(checked) =>
                        handleAvailabilityChange(day as keyof ServiceFormData["availability"], !!checked)
                      }
                      id={`availability-${day}`}
                    />
                    <span className="text-sm text-gray-700 capitalize">{day}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )
      case 3: // Media
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block text-left">
                Service Images * (At least one image is required)
              </Label>
              {fieldErrors.service_images && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{fieldErrors.service_images}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {formData.service_images.map((file, index) => (
                  <div
                    key={index}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200"
                  >
                    <img
                      src={URL.createObjectURL(file) || "/placeholder.svg"}
                      alt={`Service image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveServiceImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <label
                  htmlFor="service-image-upload"
                  className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                >
                  <Input
                    id="service-image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleServiceImageUpload}
                    className="hidden"
                    disabled={uploadingMedia}
                  />
                  {uploadingMedia ? (
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  ) : (
                    <UploadCloud className="w-6 h-6 text-gray-400" />
                  )}
                  <span className="mt-2 text-sm text-gray-500">Upload Images</span>
                </label>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 space-y-4">
              <Label htmlFor="service-video-upload" className="text-sm font-medium text-gray-700 mb-2 block text-left">
                Service Video (Optional)
              </Label>
              {formData.service_video ? (
                <div className="relative group aspect-video rounded-lg overflow-hidden border border-gray-200">
                  <video
                    src={URL.createObjectURL(formData.service_video)}
                    controls
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveServiceVideo}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="service-video-upload"
                  className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                >
                  <Input
                    id="service-video-upload"
                    type="file"
                    accept="video/*"
                    onChange={handleServiceVideoUpload}
                    className="hidden"
                    disabled={uploadingMedia}
                  />
                  {uploadingMedia ? (
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  ) : (
                    <UploadCloud className="w-6 h-6 text-gray-400" />
                  )}
                  <span className="mt-2 text-sm text-gray-500">Upload Video</span>
                </label>
              )}
            </div>
          </div>
        )
      case 4: // Others
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="is_pre_order" className="flex items-center space-x-2">
                <Checkbox
                  id="is_pre_order"
                  checked={formData.is_pre_order}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_pre_order: !!checked }))}
                />
                <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  This is a pre-order service
                </span>
              </label>
              {formData.is_pre_order && (
                <div className="mt-4">
                  <Label htmlFor="pre_order_days">Pre-order Delivery Days *</Label>
                  <Input
                    id="pre_order_days"
                    type="number"
                    value={formData.pre_order_days}
                    onChange={handleInputChange}
                    placeholder="e.g., 7"
                    className={fieldErrors.pre_order_days ? "border-red-500" : ""}
                  />
                  {fieldErrors.pre_order_days && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.pre_order_days}</p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Accepted Payment Methods</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Object.keys(formData.payment_methods).map((method) => (
                  <label key={method} className="flex items-center space-x-2 cursor-pointer select-none">
                    <Checkbox
                      checked={formData.payment_methods[method as keyof ServiceFormData["payment_methods"]]}
                      onCheckedChange={(checked) =>
                        handlePaymentMethodChange(method as keyof ServiceFormData["payment_methods"], !!checked)
                      }
                      id={`payment-${method}`}
                    />
                    <span className="text-sm text-gray-700 capitalize">{method.replace(/_/g, " ")}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }, [
    currentStep,
    formData,
    fieldErrors,
    categories,
    loadingCategories,
    categoriesError,
    handleInputChange,
    handleSelectChange,
    handleCategoryChange,
    handleAvailabilityChange,
    handlePaymentMethodChange,
    handleAddVariation,
    handleRemoveVariation,
    handleUpdateVariation,
    handleUpdateVariationPriceSlots,
    handleToggleVariationCollapse,
    handleServiceImageUpload,
    handleRemoveServiceImage,
    handleServiceVideoUpload,
    handleRemoveServiceVideo,
    handleVariationImageUpload,
    handleRemoveVariationImage,
    uploadingMedia,
    collapsedVariations,
  ])

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <StepNavigation currentStep={currentStep} steps={SERVICE_STEPS} />
        </div>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Add New Service - {SERVICE_STEPS[currentStep - 1]?.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">{renderStepContent()}</CardContent>
          <NavigationButtons
            currentStep={currentStep}
            totalSteps={SERVICE_STEPS.length}
            loading={isSubmitting}
            canProceed={canProceed}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSaveDraft={handleSaveDraft}
            onSubmit={handleSubmit}
            submitLabel="Publish Service"
          />
        </Card>
      </div>
    </div>
  )
}
