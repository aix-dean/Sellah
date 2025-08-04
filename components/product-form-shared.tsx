"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useForm, Controller, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Plus, X, UploadCloud, Loader2, Trash2 } from "lucide-react"
import type { Product } from "@/lib/product-service"
import { useToast } from "@/hooks/use-toast"
import { getProductCategories, getProductBrands, uploadProductImage, deleteProductImages } from "@/lib/product-service"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  brand: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  comparePrice: z.coerce.number().optional(),
  costPrice: z.coerce.number().optional(),
  trackQuantity: z.boolean().default(false),
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
  images: z.array(z.string()).max(5, "You can upload a maximum of 5 images").min(1, "At least one image is required"),
  mainImage: z.string().optional(),
  tags: z.array(z.string()).optional(),
  specifications: z.record(z.string(), z.string()).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).optional(),
  status: z.enum(["active", "draft", "archived"]).default("draft"),
  visibility: z.enum(["public", "private"]).default("public"),
  featured: z.boolean().default(false),
  condition: z.enum(["new", "used", "refurbished"]).default("new"),
  variations: z
    .array(
      z.object({
        id: z.string().optional(), // For existing variations
        name: z.string().min(1, "Variation name is required"),
        price: z.coerce.number().min(0.01, "Price must be greater than 0"),
        stock: z.coerce.number().min(0, "Stock cannot be negative"),
        sku: z.string().optional(),
      }),
    )
    .optional(),
})

type ProductFormValues = z.infer<typeof productFormSchema>

interface ProductFormSharedProps {
  initialData?: Product | null
  onSubmit: (data: ProductFormValues) => Promise<void>
  isSubmitting: boolean
}

export function ProductFormShared({ initialData, onSubmit, isSubmitting }: ProductFormSharedProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [categories, setCategories] = useState<string[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageUploadError, setImageUploadError] = useState<string | null>(null)

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      category: initialData?.category || "",
      brand: initialData?.brand || "",
      sku: initialData?.sku || "",
      price: initialData?.price || 0.01,
      comparePrice: initialData?.comparePrice || undefined,
      costPrice: initialData?.costPrice || undefined,
      trackQuantity: initialData?.trackQuantity ?? false,
      quantity: initialData?.quantity || 0,
      lowStockThreshold: initialData?.lowStockThreshold || 5,
      weight: initialData?.weight || undefined,
      dimensions: initialData?.dimensions || { length: undefined, width: undefined, height: undefined, unit: "cm" },
      images: initialData?.images || [],
      mainImage: initialData?.mainImage || undefined,
      tags: initialData?.tags || [],
      specifications: initialData?.specifications || {},
      seoTitle: initialData?.seoTitle || "",
      seoDescription: initialData?.seoDescription || "",
      seoKeywords: initialData?.seoKeywords || [],
      status: initialData?.status || "draft",
      visibility: initialData?.visibility || "public",
      featured: initialData?.featured ?? false,
      condition: initialData?.condition || "new",
      variations: initialData?.variations || [],
    },
  })

  const {
    fields: variationFields,
    append: appendVariation,
    remove: removeVariation,
  } = useFieldArray({
    control: form.control,
    name: "variations",
  })

  useEffect(() => {
    const fetchCategoriesAndBrands = async () => {
      try {
        const fetchedCategories = await getProductCategories()
        setCategories(fetchedCategories)
        const fetchedBrands = await getProductBrands()
        setBrands(fetchedBrands)
      } catch (error) {
        console.error("Failed to fetch categories or brands:", error)
        toast({
          title: "Error",
          description: "Failed to load categories or brands.",
          variant: "destructive",
        })
      }
    }
    fetchCategoriesAndBrands()
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
        const downloadURL = await uploadProductImage(file, user.uid, initialData?.id)
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
        await deleteProductImages([imageUrl])
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

  const handleAddTag = () => {
    if (newTag.trim() && !form.getValues("tags")?.includes(newTag.trim())) {
      form.setValue("tags", [...(form.getValues("tags") || []), newTag.trim()], { shouldValidate: true })
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    form.setValue("tags", form.getValues("tags")?.filter((tag) => tag !== tagToRemove) || [], { shouldValidate: true })
  }

  const handleAddVariation = () => {
    appendVariation({ name: "", price: 0.01, stock: 0 })
  }

  const handleRemoveVariation = (index: number) => {
    removeVariation(index)
  }

  const handleSetMainImage = (imageUrl: string) => {
    form.setValue("mainImage", imageUrl)
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
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Organic Honey" {...field} />
                </FormControl>
                <FormDescription>The name of your product.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., HONEY001" {...field} />
                </FormControl>
                <FormDescription>Stock Keeping Unit for your product.</FormDescription>
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
                  <Textarea placeholder="Tell us about your product..." {...field} />
                </FormControl>
                <FormDescription>A detailed description of your product.</FormDescription>
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
                <FormDescription>The category your product belongs to.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a brand (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>The brand of your product.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Pricing */}
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
                <FormDescription>The selling price of your product.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="comparePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Compare at Price (PHP)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormDescription>Original price for comparison (e.g., sale price).</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="costPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost per Item (PHP)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormDescription>Cost of the product to you (not shown to customers).</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Inventory */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="trackQuantity"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Track Quantity</FormLabel>
                  <FormDescription>Enable to manage inventory levels for this product.</FormDescription>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.watch("trackQuantity") && (
            <>
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormDescription>Current stock level.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lowStockThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Low Stock Threshold</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5" {...field} />
                    </FormControl>
                    <FormDescription>Alert when stock falls below this number.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>

        {/* Variations */}
        <div>
          <h3 className="text-lg font-medium mb-2">Variations</h3>
          <FormDescription className="mb-4">
            Add different versions of your product (e.g., sizes, colors).
          </FormDescription>
          {variationFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 border p-4 rounded-md mb-4">
              <FormField
                control={form.control}
                name={`variations.${index}.name`}
                render={({ field: variationField }) => (
                  <FormItem>
                    <FormLabel>Variation Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Small, Red" {...variationField} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`variations.${index}.price`}
                render={({ field: variationField }) => (
                  <FormItem>
                    <FormLabel>Price (PHP)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...variationField} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`variations.${index}.stock`}
                render={({ field: variationField }) => (
                  <FormItem>
                    <FormLabel>Stock</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...variationField} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-end">
                <Button type="button" variant="destructive" onClick={() => handleRemoveVariation(index)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Remove
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={handleAddVariation}>
            <Plus className="h-4 w-4 mr-2" /> Add Variation
          </Button>
        </div>

        {/* Media */}
        <div>
          <h3 className="text-lg font-medium mb-2">Media</h3>
          <FormDescription className="mb-4">Upload images for your product (max 5).</FormDescription>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
            {form.watch("images").map((imageUrl, index) => (
              <div key={index} className="relative group aspect-square rounded-md overflow-hidden border">
                <img
                  src={imageUrl || "/placeholder.svg"}
                  alt={`Product image ${index + 1}`}
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
          <FormDescription className="mb-4">Add keywords to help customers find your product.</FormDescription>
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
                <FormDescription>The current status of your product.</FormDescription>
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
                <FormDescription>Who can see this product.</FormDescription>
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
                  <FormLabel>Featured Product</FormLabel>
                  <FormDescription>Mark this product as featured on your store.</FormDescription>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="condition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condition</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                    <SelectItem value="refurbished">Refurbished</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>The condition of the product.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* SEO */}
        <div>
          <h3 className="text-lg font-medium mb-2">Search Engine Optimization</h3>
          <FormDescription className="mb-4">Improve your product's visibility on search engines.</FormDescription>
          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="seoTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SEO Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Best Organic Honey for Sale" {...field} />
                  </FormControl>
                  <FormDescription>Title for search engine results (max 60 characters).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="seoDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SEO Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A brief, keyword-rich description for search engines." {...field} />
                  </FormControl>
                  <FormDescription>Description for search engine results (max 160 characters).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <FormLabel>SEO Keywords</FormLabel>
              <FormDescription className="mb-2">Keywords for search engines (comma-separated).</FormDescription>
              <Controller
                control={form.control}
                name="seoKeywords"
                render={({ field }) => (
                  <>
                    <Input
                      placeholder="e.g., honey, organic, natural"
                      value={field.value?.join(", ") || ""}
                      onChange={(e) => field.onChange(e.target.value.split(",").map((s) => s.trim()))}
                    />
                    <FormMessage />
                  </>
                )}
              />
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Product"
          )}
        </Button>
      </form>
    </Form>
  )
}
