"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useUserData } from "@/hooks/use-user-data"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import {
  ImageUpload,
  TagInput,
  SeoFields,
  ServiceVariationInput,
  ServiceStatusAndVisibility,
  serviceFormSchema,
  type ServiceFormData,
} from "@/components/service-form-shared"
import { createService, uploadServiceImage, deleteServiceImage, canUserAddService } from "@/lib/service-service"
import { useCategories } from "@/hooks/use-categories"
import { z } from "zod" // Import zod for z.ZodError

export default function AddServicePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { userData, loading: userLoading } = useUserData(user?.uid)
  const { toast } = useToast()
  const { categories: fetchedCategories, loading: categoriesLoading } = useCategories("SERVICE")

  const [formData, setFormData] = useState<ServiceFormData>({
    name: "",
    description: "",
    category: "",
    price: "",
    duration: "",
    durationUnit: "minutes",
    images: [],
    mainImage: undefined,
    tags: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    status: "draft",
    visibility: "public",
    featured: false,
    variations: [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [canAddMore, setCanAddMore] = useState(true)
  const [limitMessage, setLimitMessage] = useState("")

  useEffect(() => {
    if (user?.uid && !userLoading) {
      const checkLimit = async () => {
        try {
          const { canAdd, message } = await canUserAddService(user.uid)
          setCanAddMore(canAdd)
          if (!canAdd) {
            setLimitMessage(message || "You have reached your service creation limit.")
          }
        } catch (err) {
          console.error("Error checking service limit:", err)
          setLimitMessage("Failed to check service limit. Please try again.")
          setCanAddMore(false)
        }
      }
      checkLimit()
    }
  }, [user, userLoading])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSelectChange = (name: keyof ServiceFormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleImageUpload = async (file: File): Promise<string> => {
    if (!user?.uid) throw new Error("User not authenticated.")
    try {
      const downloadURL = await uploadServiceImage(file, user.uid)
      setFormData((prev) => {
        const newImages = [...prev.images, downloadURL]
        return {
          ...prev,
          images: newImages,
          mainImage: prev.mainImage || newImages[0], // Set as main if no main image exists
        }
      })
      return downloadURL
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Image Upload Failed",
        description: "There was an error uploading your image. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleImageRemove = async (urlToRemove: string) => {
    setFormData((prev) => {
      const newImages = prev.images.filter((url) => url !== urlToRemove)
      let newMainImage = prev.mainImage
      if (newMainImage === urlToRemove) {
        newMainImage = newImages.length > 0 ? newImages[0] : undefined
      }
      return { ...prev, images: newImages, mainImage: newMainImage }
    })
    // Optionally delete from storage immediately, or handle on final submit
    try {
      await deleteServiceImage([urlToRemove])
    } catch (error) {
      console.error("Error deleting image from storage:", error)
    }
  }

  const handleSetMainImage = (url: string) => {
    setFormData((prev) => ({ ...prev, mainImage: url }))
  }

  const handleTagsChange = (newTags: string[]) => {
    setFormData((prev) => ({ ...prev, tags: newTags.join(", ") }))
  }

  const handleSeoKeywordsChange = (newKeywords: string[]) => {
    setFormData((prev) => ({ ...prev, seoKeywords: newKeywords.join(", ") }))
  }

  const handleVariationsChange = (
    newVariations: Array<{ name: string; price: number; duration: number; durationUnit: "minutes" | "hours" | "days" }>,
  ) => {
    setFormData((prev) => ({ ...prev, variations: newVariations }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.uid || !userData?.company_id) {
      toast({
        title: "Authentication Required",
        description: "Please log in and ensure your company information is complete.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const parsedData = serviceFormSchema.parse({
        ...formData,
        price: Number.parseFloat(formData.price),
        duration: Number.parseInt(formData.duration),
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        seoKeywords: formData.seoKeywords
          .split(",")
          .map((keyword) => keyword.trim())
          .filter(Boolean),
      })

      const serviceDataToSave = {
        ...parsedData,
        userId: user.uid,
        companyId: userData.company_id,
        tags: parsedData.tags, // Already array from parsing
        seoKeywords: parsedData.seoKeywords, // Already array from parsing
      }

      const serviceId = await createService(serviceDataToSave)

      toast({
        title: "Service Added",
        description: "Your new service has been successfully added!",
        variant: "default",
      })
      router.push(`/dashboard/services/${serviceId}`) // Redirect to service details page
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            newErrors[err.path[0]] = err.message
          }
        })
        setErrors(newErrors)
        toast({
          title: "Validation Error",
          description: "Please correct the errors in the form.",
          variant: "destructive",
        })
      } else {
        console.error("Error adding service:", error)
        toast({
          title: "Failed to Add Service",
          description: error.message || "An unexpected error occurred. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (userLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-red-500" />
      </div>
    )
  }

  if (!canAddMore) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-red-600">Service Limit Reached</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{limitMessage}</p>
            <Button
              onClick={() => router.push("/dashboard/account/upgrade")}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Upgrade Account
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-left">
      <div className="w-full max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Service</h1>
        <p className="text-gray-600 mb-6">Fill in the details below to create a new service listing.</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Service Information</CardTitle>
              <CardDescription>Basic details about your service.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Service Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Premium Web Design Package"
                  disabled={isSubmitting}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide a detailed description of your service"
                  rows={5}
                  disabled={isSubmitting}
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={handleSelectChange("category")}
                  disabled={isSubmitting || categoriesLoading}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading categories...
                      </SelectItem>
                    ) : (
                      fetchedCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    disabled={isSubmitting}
                  />
                  {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                </div>
                <div>
                  <Label htmlFor="duration">Duration *</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    step="1"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="e.g., 60"
                    disabled={isSubmitting}
                  />
                  {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
                </div>
                <div>
                  <Label htmlFor="durationUnit">Duration Unit *</Label>
                  <Select
                    value={formData.durationUnit}
                    onValueChange={handleSelectChange("durationUnit")}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="durationUnit">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.durationUnit && <p className="text-red-500 text-sm mt-1">{errors.durationUnit}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Media</CardTitle>
              <CardDescription>Upload images for your service.</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                images={formData.images}
                onImageUpload={handleImageUpload}
                onImageRemove={handleImageRemove}
                onSetMainImage={handleSetMainImage}
                mainImage={formData.mainImage}
                disabled={isSubmitting}
              />
              {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Variations</CardTitle>
              <CardDescription>Define different options for your service (e.g., Basic, Premium).</CardDescription>
            </CardHeader>
            <CardContent>
              <ServiceVariationInput
                variations={formData.variations}
                onVariationsChange={handleVariationsChange}
                disabled={isSubmitting}
              />
              {errors.variations && <p className="text-red-500 text-sm mt-1">{errors.variations}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
              <CardDescription>Categorize and tag your service for better discoverability.</CardDescription>
            </CardHeader>
            <CardContent>
              <TagInput
                tags={formData.tags
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean)}
                onTagsChange={handleTagsChange}
                disabled={isSubmitting}
              />
              {errors.tags && <p className="text-red-500 text-sm mt-1">{errors.tags}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Search Engine Optimization (SEO)</CardTitle>
              <CardDescription>Optimize your service listing for search engines.</CardDescription>
            </CardHeader>
            <CardContent>
              <SeoFields
                seoTitle={formData.seoTitle || ""}
                onSeoTitleChange={(value) => setFormData((prev) => ({ ...prev, seoTitle: value }))}
                seoDescription={formData.seoDescription || ""}
                onSeoDescriptionChange={(value) => setFormData((prev) => ({ ...prev, seoDescription: value }))}
                seoKeywords={formData.seoKeywords
                  .split(",")
                  .map((keyword) => keyword.trim())
                  .filter(Boolean)}
                onSeoKeywordsChange={handleSeoKeywordsChange}
                disabled={isSubmitting}
              />
              {errors.seoTitle && <p className="text-red-500 text-sm mt-1">{errors.seoTitle}</p>}
              {errors.seoDescription && <p className="text-red-500 text-sm mt-1">{errors.seoDescription}</p>}
              {errors.seoKeywords && <p className="text-red-500 text-sm mt-1">{errors.seoKeywords}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status & Visibility</CardTitle>
              <CardDescription>Control how your service appears to customers.</CardDescription>
            </CardHeader>
            <CardContent>
              <ServiceStatusAndVisibility
                status={formData.status}
                onStatusChange={handleSelectChange("status")}
                visibility={formData.visibility}
                onVisibilityChange={handleSelectChange("visibility")}
                featured={formData.featured}
                onFeaturedChange={(checked) => setFormData((prev) => ({ ...prev, featured: checked }))}
                disabled={isSubmitting}
              />
              {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status}</p>}
              {errors.visibility && <p className="text-red-500 text-sm mt-1">{errors.visibility}</p>}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-red-500 hover:bg-red-600 text-white">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Add Service"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
