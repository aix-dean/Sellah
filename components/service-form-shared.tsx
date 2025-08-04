"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Plus, X, UploadCloud, Loader2 } from "lucide-react"
import type { Service } from "@/types/service"
import { useToast } from "@/hooks/use-toast"
import { getServiceCategories, uploadServiceImage, deleteServiceImage } from "@/lib/service-service"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

const serviceFormSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  duration: z.coerce.number().min(1, "Duration must be at least 1"),
  durationUnit: z.enum(["minutes", "hours", "days"]).default("hours"),
  images: z.array(z.string()).max(5, "You can upload a maximum of 5 images").min(1, "At least one image is required"),
  mainImage: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["active", "draft", "archived"]).default("draft"),
  visibility: z.enum(["public", "private"]).default("public"),
  featured: z.boolean().default(false),
})

type ServiceFormValues = z.infer<typeof serviceFormSchema>

interface ServiceFormSharedProps {
  initialData?: Service | null
  onSubmit: (data: ServiceFormValues) => Promise<void>
  isSubmitting: boolean
}

export function ServiceFormShared({ initialData, onSubmit, isSubmitting }: ServiceFormSharedProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [categories, setCategories] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageUploadError, setImageUploadError] = useState<string | null>(null)

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      category: initialData?.category || "",
      price: initialData?.price || 0.01,
      duration: initialData?.duration || 60,
      durationUnit: initialData?.durationUnit || "hours",
      images: initialData?.images || [],
      mainImage: initialData?.mainImage || undefined,
      tags: initialData?.tags || [],
      status: initialData?.status || "draft",
      visibility: initialData?.visibility || "public",
      featured: initialData?.featured ?? false,
    },
  })

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getServiceCategories()
        setCategories(fetchedCategories)
      } catch (error) {
        console.error("Failed to fetch categories:", error)
        toast({
          title: "Error",
          description: "Failed to load categories.",
          variant: "destructive",
        })
      }
    }
    fetchCategories()
  }, [toast])

  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!user?.uid) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to upload images.",
          variant: "destructive",
        })
        return
      }

      const file = event.target.files?.[0]
      if (!file) return

      if (file.size > MAX_FILE_SIZE) {
        setImageUploadError("File size exceeds 5MB limit.")
        return
      }

      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setImageUploadError("Invalid file type. Only JPG, PNG, WEBP images are allowed.")
        return
      }

      setImageUploadError(null)
      setUploadingImage(true)

      try {
        const downloadURL = await uploadServiceImage(file, user.uid, initialData?.id)
        const currentImages = form.getValues("images")
        const updatedImages = [...currentImages, downloadURL]
        form.setValue("images", updatedImages, { shouldValidate: true })
        if (updatedImages.length === 1) {
          form.setValue("mainImage", downloadURL)
        }
        toast({
          title: "Image Uploaded",
          description: "Image uploaded successfully.",
        })
      } catch (error) {
        console.error("Error uploading image:", error)
        setImageUploadError("Failed to upload image. Please try again.")
        toast({
          title: "Upload Failed",
          description: "There was an error uploading your image.",
          variant: "destructive",
        })
      } finally {
        setUploadingImage(false)
        event.target.value = "" // Clear the input
      }
    },
    [user?.uid, form, initialData?.id, toast],
  )

  const handleRemoveImage = useCallback(
    async (imageUrl: string) => {
      const currentImages = form.getValues("images")
      const updatedImages = currentImages.filter((img) => img !== imageUrl)
      form.setValue("images", updatedImages, { shouldValidate: true })

      // If the removed image was the main image, set a new main image or clear it
      if (form.getValues("mainImage") === imageUrl) {
        form.setValue("mainImage", updatedImages.length > 0 ? updatedImages[0] : undefined)
      }

      // Optionally delete from storage (consider if this should be a soft delete or hard delete)
      try {
        await deleteServiceImage([imageUrl])
        toast({
          title: "Image Removed",
          description: "Image removed successfully.",
        })
      } catch (error) {
        console.error("Error deleting image from storage:", error)
        toast({
          title: "Error",
          description: "Failed to delete image from storage.",
          variant: "destructive",
        })
      }
    },
    [form, toast],
  )

  const handleSetMainImage = useCallback(
    (imageUrl: string) => {
      form.setValue("mainImage", imageUrl)
    },
    [form],
  )

  const handleAddTag = () => {
    if (newTag.trim() && !form.getValues("tags")?.includes(newTag.trim())) {
      form.setValue("tags", [...(form.getValues("tags") || []), newTag.trim()], { shouldValidate: true })
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    form.setValue("tags", form.getValues("tags")?.filter((tag) => tag !== tagToRemove) || [], { shouldValidate: true })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* General Information */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Web Design Consultation" {...field} />
                </FormControl>
                <FormDescription>The name of your service.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>The category your service belongs to.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Tell us about your service..." {...field} />
                </FormControl>
                <FormDescription>A detailed description of your service.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Pricing & Duration */}
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (PHP)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormDescription>The selling price of your service.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="60" {...field} />
                </FormControl>
                <FormDescription>How long the service typically takes.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="durationUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration Unit</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Unit for the service duration.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Media */}
        <div>
          <h3 className="text-lg font-medium mb-2">Media</h3>
          <FormDescription className="mb-4">Upload images for your service (max 5).</FormDescription>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
            {form.watch("images").map((imageUrl, index) => (
              <div key={index} className="relative group aspect-square rounded-md overflow-hidden border">
                <img
                  src={imageUrl || "/placeholder.svg"}
                  alt={`Service image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="mr-2"
                    onClick={() => handleRemoveImage(imageUrl)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove image</span>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSetMainImage(imageUrl)}
                    className={cn(
                      "text-xs",
                      form.watch("mainImage") === imageUrl && "bg-primary text-primary-foreground",
                    )}
                  >
                    {form.watch("mainImage") === imageUrl ? "Main" : "Set Main"}
                  </Button>
                </div>
                {form.watch("mainImage") === imageUrl && (
                  <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">Main</Badge>
                )}
              </div>
            ))}
            {form.watch("images").length < 5 && (
              <div className="aspect-square rounded-md border-2 border-dashed flex items-center justify-center relative">
                <Input
                  id="image-upload"
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                />
                {uploadingImage ? (
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <UploadCloud className="h-8 w-8" />
                    <span className="text-sm mt-2">Upload Image</span>
                  </div>
                )}
              </div>
            )}
          </div>
          {imageUploadError && <p className="text-red-500 text-sm mt-2">{imageUploadError}</p>}
          <FormField
            control={form.control}
            name="images"
            render={() => (
              <FormItem>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Tags */}
        <div>
          <h3 className="text-lg font-medium mb-2">Tags</h3>
          <FormDescription className="mb-4">Add keywords to help customers find your service.</FormDescription>
          <div className="flex flex-wrap gap-2 mb-4">
            {form.watch("tags")?.map((tag, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {tag}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0"
                  onClick={() => handleRemoveTag(tag)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove tag</span>
                </Button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add a new tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddTag()
                }
              }}
            />
            <Button type="button" onClick={handleAddTag}>
              <Plus className="h-4 w-4 mr-2" /> Add Tag
            </Button>
          </div>
        </div>

        {/* Status & Visibility */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>The current status of your service.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="visibility"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visibility</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Who can see this service.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="featured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Featured Service</FormLabel>
                  <FormDescription>Mark this service as featured on your store.</FormDescription>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Service"
          )}
        </Button>
      </form>
    </Form>
  )
}
