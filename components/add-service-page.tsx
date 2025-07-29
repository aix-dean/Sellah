"use client"

import type React from "react"
import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { v4 as uuidv4 } from "uuid"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { useCategories } from "@/hooks/use-categories"
import {
  SERVICE_STEPS,
  SERVICE_UNIT_OPTIONS,
  validateServiceStep,
  StepNavigation,
  CategorySelection,
  ServiceVariationItem,
  NavigationButtons,
} from "@/components/service-form-shared"
import type { ServiceFormData } from "@/types/service"
import { createService, uploadServiceImage } from "@/lib/service-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, UploadCloud, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AddServicePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories()

  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ServiceFormData>({
    name: "",
    description: "",
    categories: [],
    unit: "per_hour",
    duration: "",
    availability: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    },
    service_images: [],
    service_video: null,
    media: [],
    is_pre_order: false,
    pre_order_days: "",
    payment_methods: {
      ewallet: false,
      bank_transfer: false,
      gcash: false,
      maya: false,
      manual: false,
    },
    variations: [
      {
        id: uuidv4(),
        name: "Default",
        duration: "",
        price: "",
        slots: "",
        images: [],
        media: null,
      },
    ],
  })
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [collapsedVariations, setCollapsedVariations] = useState<Set<string>>(new Set())

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
    setFormErrors((prev) => {
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
    setFormErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors.categories
      return newErrors
    })
  }, [])

  const handleUnitChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, unit: value }))
    setFormErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors.unit
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
    setFormErrors((prev) => {
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

  const handlePreOrderChange = useCallback((checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      is_pre_order: checked,
      pre_order_days: checked ? prev.pre_order_days : "",
    }))
    setFormErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors.pre_order_days
      return newErrors
    })
  }, [])

  const addVariation = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      variations: [
        ...prev.variations,
        {
          id: uuidv4(),
          name: "",
          duration: "",
          price: "",
          slots: "",
          images: [],
          media: null,
        },
      ],
    }))
  }, [])

  const removeVariation = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      variations: prev.variations.filter((v) => v.id !== id),
    }))
    setCollapsedVariations((prev) => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }, [])

  const updateVariation = useCallback(
    (id: string, field: string, value: string) => {
      setFormData((prev) => ({
        ...prev,
        variations: prev.variations.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
      }))
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        // Clear specific variation error if input changes
        const index = formData.variations.findIndex((v) => v.id === id)
        if (index !== -1) {
          delete newErrors[`variation_${index}_${field}`]
        }
        return newErrors
      })
    },
    [formData.variations],
  )

  const updateVariationPriceSlots = useCallback(
    (id: string, field: string, value: string) => {
      setFormData((prev) => ({
        ...prev,
        variations: prev.variations.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
      }))
      setFormErrors((prev) => {
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

  const handleServiceImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!user?.uid) {
        toast({
          title: "Authentication Required",
          description: "Please log in to upload images.",
          variant: "destructive",
        })
        return
      }

      const files = Array.from(e.target.files || [])
      if (files.length === 0) return

      setUploadingImages(true)
      try {
        const uploadPromises = files.map((file) => uploadServiceImage(file, user.uid))
        const urls = await Promise.all(uploadPromises)

        setFormData((prev) => ({
          ...prev,
          service_images: [...prev.service_images, ...urls],
          media: [...prev.media, ...urls.map((url) => ({ url, isVideo: false, type: "image", distance: "" }))],
        }))
        toast({
          title: "Image Uploaded",
          description: `${files.length} image(s) uploaded successfully.`,
        })
        setFormErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.service_images
          return newErrors
        })
      } catch (error) {
        console.error("Error uploading images:", error)
        toast({
          title: "Upload Failed",
          description: "Failed to upload images. Please try again.",
          variant: "destructive",
        })
      } finally {
        setUploadingImages(false)
        e.target.value = "" // Clear the input
      }
    },
    [user?.uid, toast],
  )

  const handleRemoveServiceImage = useCallback(async (urlToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      service_images: prev.service_images.filter((url) => url !== urlToRemove),
      media: prev.media.filter((item) => item.url !== urlToRemove),
    }))
    // Optionally, delete from storage immediately
    // if (user?.uid) {
    //   try {
    //     await deleteServiceImages([urlToRemove]);
    //     toast({ title: "Image Removed", description: "Image deleted from storage." });
    //   } catch (error) {
    //     console.error("Error deleting image from storage:", error);
    //     toast({ title: "Error", description: "Failed to delete image from storage.", variant: "destructive" });
    //   }
    // }
  }, [])

  const handleVariationImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, variationId: string) => {
      if (!user?.uid) {
        toast({
          title: "Authentication Required",
          description: "Please log in to upload images.",
          variant: "destructive",
        })
        return
      }

      const file = e.target.files?.[0]
      if (!file) return

      setUploadingImages(true)
      try {
        const url = await uploadServiceImage(file, user.uid)
        setFormData((prev) => ({
          ...prev,
          variations: prev.variations.map((v) => (v.id === variationId ? { ...v, media: url } : v)),
        }))
        toast({ title: "Image Uploaded", description: "Variation image uploaded successfully." })
      } catch (error) {
        console.error("Error uploading variation image:", error)
        toast({
          title: "Upload Failed",
          description: "Failed to upload variation image. Please try again.",
          variant: "destructive",
        })
      } finally {
        setUploadingImages(false)
        e.target.value = ""
      }
    },
    [user?.uid, toast],
  )

  const handleRemoveVariationImage = useCallback((variationId: string) => {
    setFormData((prev) => ({
      ...prev,
      variations: prev.variations.map((v) => (v.id === variationId ? { ...v, media: null } : v)),
    }))
  }, [])

  const toggleVariationCollapse = useCallback((id: string) => {
    setCollapsedVariations((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const handleNext = useCallback(() => {
    const { isValid, errors } = validateServiceStep(currentStep, formData)
    if (!isValid) {
      setFormErrors(errors)
      toast({
        title: "Validation Error",
        description: "Please correct the errors before proceeding.",
        variant: "destructive",
      })
      return
    }
    setCurrentStep((prev) => Math.min(prev + 1, SERVICE_STEPS.length))
  }, [currentStep, formData, toast])

  const handlePrevious = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }, [])

  const handleSaveDraft = useCallback(async () => {
    if (!user?.uid) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save a draft.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const serviceDataToSave = {
        ...formData,
        userId: user.uid,
        price: Number.parseFloat(formData.variations[0]?.price || "0"), // Use first variation price as main price
        unit: formData.unit,
        status: "draft", // Always save as draft
        service_images: formData.service_images,
        mainImage: formData.service_images[0] || formData.media.find((m) => !m.isVideo)?.url || "",
        tags: [], // Add tags if needed
        availability: formData.availability,
        variations: formData.variations.map((v) => ({
          ...v,
          price: Number.parseFloat(v.price || "0"),
          slots: Number.parseInt(v.slots || "0"),
          images: [], // Images are handled separately
          media: v.media,
        })),
      }

      // Remove File objects before saving to Firestore
      const { service_images, service_video, ...restFormData } = serviceDataToSave
      const finalServiceData = {
        ...restFormData,
        service_images: service_images, // Store URLs
      }

      await createService(finalServiceData as any) // Cast to any to bypass strict type checking for now
      toast({
        title: "Draft Saved",
        description: "Your service draft has been saved successfully.",
      })
      router.push("/dashboard/services") // Redirect to services list
    } catch (error: any) {
      console.error("Error saving service draft:", error)
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save service draft. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, user?.uid, toast, router])

  const handleSubmit = useCallback(async () => {
    if (!user?.uid) {
      toast({
        title: "Authentication Required",
        description: "Please log in to publish a service.",
        variant: "destructive",
      })
      return
    }

    const { isValid, errors } = validateServiceStep(SERVICE_STEPS.length, formData)
    if (!isValid) {
      setFormErrors(errors)
      toast({
        title: "Validation Error",
        description: "Please correct all errors before publishing.",
        variant: "destructive",
      })
      setCurrentStep(Object.keys(errors).length > 0 ? 1 : SERVICE_STEPS.length) // Go back to first step with error
      return
    }

    setIsSubmitting(true)
    try {
      const serviceDataToPublish = {
        ...formData,
        userId: user.uid,
        price: Number.parseFloat(formData.variations[0]?.price || "0"),
        unit: formData.unit,
        status: "active", // Publish as active
        service_images: formData.service_images,
        mainImage: formData.service_images[0] || formData.media.find((m) => !m.isVideo)?.url || "",
        tags: [],
        availability: formData.availability,
        variations: formData.variations.map((v) => ({
          ...v,
          price: Number.parseFloat(v.price || "0"),
          slots: Number.parseInt(v.slots || "0"),
          images: [],
          media: v.media,
        })),
      }

      const { service_images, service_video, ...restFormData } = serviceDataToPublish
      const finalServiceData = {
        ...restFormData,
        service_images: service_images,
      }

      await createService(finalServiceData as any)
      toast({
        title: "Service Published",
        description: "Your service has been published successfully!",
      })
      router.push("/dashboard/services")
    } catch (error: any) {
      console.error("Error publishing service:", error)
      toast({
        title: "Publish Failed",
        description: error.message || "Failed to publish service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, user?.uid, toast, router])

  const canProceed = useMemo(() => {
    const { isValid } = validateServiceStep(currentStep, formData)
    return isValid
  }, [currentStep, formData])

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>Please log in to add a new service.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <StepNavigation currentStep={currentStep} steps={SERVICE_STEPS} />
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">Add New Service</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-800">Service Details</h3>
                  <div>
                    <Label htmlFor="name">Service Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Web Design Consultation"
                      className={formErrors.name ? "border-red-500" : ""}
                    />
                    {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Provide a detailed description of your service."
                      rows={5}
                      className={formErrors.description ? "border-red-500" : ""}
                    />
                    {formErrors.description && <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>}
                  </div>
                  <CategorySelection
                    categories={categories}
                    selectedCategories={formData.categories}
                    onCategoryChange={handleCategoryChange}
                    loading={categoriesLoading}
                    error={categoriesError}
                    fieldError={formErrors.categories}
                  />
                  <div>
                    <Label htmlFor="unit">Unit *</Label>
                    <Select value={formData.unit} onValueChange={handleUnitChange}>
                      <SelectTrigger className={formErrors.unit ? "border-red-500" : ""}>
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
                    {formErrors.unit && <p className="mt-1 text-sm text-red-600">{formErrors.unit}</p>}
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800">Service Variations *</h4>
                    {formData.variations.map((variation, index) => (
                      <ServiceVariationItem
                        key={variation.id}
                        variation={variation}
                        index={index}
                        isCollapsed={collapsedVariations.has(variation.id)}
                        onToggleCollapse={() => toggleVariationCollapse(variation.id)}
                        onRemove={() => removeVariation(variation.id)}
                        onUpdate={updateVariation}
                        onUpdatePriceSlots={updateVariationPriceSlots}
                        onImageUpload={(e) => handleVariationImageUpload(e, variation.id)}
                        onRemoveImage={() => handleRemoveVariationImage(variation.id)}
                        uploading={uploadingImages}
                        fieldErrors={formErrors}
                        unit={formData.unit}
                      />
                    ))}
                    <Button type="button" variant="outline" onClick={addVariation} className="w-full bg-transparent">
                      Add Variation
                    </Button>
                    {formErrors.variations && <p className="mt-1 text-sm text-red-600">{formErrors.variations}</p>}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-800">Pricing & Availability</h3>
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800">Variation Pricing & Slots *</h4>
                    {formData.variations.map((variation, index) => (
                      <ServiceVariationItem
                        key={variation.id}
                        variation={variation}
                        index={index}
                        isCollapsed={collapsedVariations.has(variation.id)}
                        onToggleCollapse={() => toggleVariationCollapse(variation.id)}
                        onRemove={() => removeVariation(variation.id)}
                        onUpdate={updateVariation}
                        onUpdatePriceSlots={updateVariationPriceSlots}
                        onImageUpload={(e) => handleVariationImageUpload(e, variation.id)}
                        onRemoveImage={() => handleRemoveVariationImage(variation.id)}
                        uploading={uploadingImages}
                        fieldErrors={formErrors}
                        showPricing={true}
                        unit={formData.unit}
                      />
                    ))}
                    {formErrors.variations && <p className="mt-1 text-sm text-red-600">{formErrors.variations}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block text-left">
                      Availability * (Select at least one day)
                    </Label>
                    <div
                      className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4 rounded-lg border ${formErrors.availability ? "border-red-500" : "border-gray-300"}`}
                    >
                      {Object.entries(formData.availability).map(([day, checked]) => (
                        <label key={day} className="flex items-center space-x-2 cursor-pointer select-none">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) =>
                              handleAvailabilityChange(day as keyof ServiceFormData["availability"], !!c)
                            }
                            id={`availability-${day}`}
                          />
                          <span className="text-sm text-gray-700 capitalize">{day}</span>
                        </label>
                      ))}
                    </div>
                    {formErrors.availability && (
                      <div className="mt-1 flex items-center text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span>{formErrors.availability}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-800">Media</h3>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block text-left">
                      Service Images * (At least one image is required)
                    </Label>
                    <div
                      className={`border rounded-lg p-4 min-h-[120px] flex flex-wrap items-center gap-3 ${formErrors.service_images ? "border-red-500" : "border-gray-300"}`}
                    >
                      {formData.service_images.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url || "/placeholder.svg"}
                            alt={`Service image ${index + 1}`}
                            className="w-24 h-24 object-cover rounded-md border"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg?height=96&width=96"
                            }}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveServiceImage(url)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      <label
                        htmlFor="service-image-upload"
                        className={`flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors ${uploadingImages ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        {uploadingImages ? (
                          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        ) : (
                          <UploadCloud className="w-6 h-6 text-gray-400" />
                        )}
                        <span className="text-xs text-gray-500 mt-1">Upload</span>
                        <input
                          id="service-image-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleServiceImageUpload}
                          className="hidden"
                          disabled={uploadingImages}
                        />
                      </label>
                    </div>
                    {formErrors.service_images && (
                      <div className="mt-1 flex items-center text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span>{formErrors.service_images}</span>
                      </div>
                    )}
                  </div>
                  {/* Service Video upload can be added here if needed */}
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-800">Others</h3>
                  <div className="space-y-2">
                    <Label htmlFor="payment-methods" className="text-sm font-medium text-gray-700 mb-2 block text-left">
                      Payment Methods
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Object.entries(formData.payment_methods).map(([method, checked]) => (
                        <label key={method} className="flex items-center space-x-2 cursor-pointer select-none">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) =>
                              handlePaymentMethodChange(method as keyof ServiceFormData["payment_methods"], !!c)
                            }
                            id={`payment-${method}`}
                          />
                          <span className="text-sm text-gray-700 capitalize">{method.replace(/_/g, " ")}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block text-left">Pre-order</Label>
                    <div className="flex items-center space-x-4">
                      <RadioGroup
                        value={formData.is_pre_order ? "yes" : "no"}
                        onValueChange={(value) => handlePreOrderChange(value === "yes")}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="pre-order-no" />
                          <Label htmlFor="pre-order-no">No</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="pre-order-yes" />
                          <Label htmlFor="pre-order-yes">Yes</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    {formData.is_pre_order && (
                      <div className="mt-4">
                        <Label htmlFor="pre-order-days">Pre-order Delivery Days *</Label>
                        <Input
                          id="pre_order_days"
                          type="number"
                          value={formData.pre_order_days}
                          onChange={handleInputChange}
                          placeholder="e.g., 7"
                          className={formErrors.pre_order_days ? "border-red-500" : ""}
                        />
                        {formErrors.pre_order_days && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.pre_order_days}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <NavigationButtons
              currentStep={currentStep}
              totalSteps={SERVICE_STEPS.length}
              loading={isSubmitting || uploadingImages}
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
    </div>
  )
}
