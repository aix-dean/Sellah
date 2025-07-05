"use client"

import React, { useState, useCallback, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  X,
  Plus,
  ImageIcon,
  Star,
  Eye,
  EyeOff,
  Package,
  DollarSign,
  Tag,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Lock,
} from "lucide-react"
import { createProduct, uploadProductImage, generateSKU, canUserAddProduct, type Product } from "@/lib/product-service"
import { auth } from "@/lib/firebase"
import { useAuthState } from "react-firebase-hooks/auth"
import { useUserData } from "@/hooks/use-user-data"

interface ProductFormData {
  name: string
  description: string
  category: string
  brand: string
  sku: string
  price: number
  comparePrice: number
  costPrice: number
  trackQuantity: boolean
  quantity: number
  lowStockThreshold: number
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
    unit: "cm" | "in"
  }
  images: string[]
  mainImage: string
  tags: string[]
  specifications: Record<string, string>
  seoTitle: string
  seoDescription: string
  seoKeywords: string[]
  status: "active" | "draft" | "archived"
  visibility: "public" | "private"
  featured: boolean
  condition: "new" | "used" | "refurbished"
}

const initialFormData: ProductFormData = {
  name: "",
  description: "",
  category: "",
  brand: "",
  sku: "",
  price: 0,
  comparePrice: 0,
  costPrice: 0,
  trackQuantity: true,
  quantity: 0,
  lowStockThreshold: 5,
  weight: 0,
  dimensions: {
    length: 0,
    width: 0,
    height: 0,
    unit: "cm",
  },
  images: [],
  mainImage: "",
  tags: [],
  specifications: {},
  seoTitle: "",
  seoDescription: "",
  seoKeywords: [],
  status: "draft",
  visibility: "public",
  featured: false,
  condition: "new",
}

const categories = [
  "Electronics",
  "Clothing & Fashion",
  "Home & Garden",
  "Sports & Outdoors",
  "Books & Media",
  "Health & Beauty",
  "Toys & Games",
  "Automotive",
  "Food & Beverages",
  "Other",
]

const steps = [
  { id: 1, title: "Basic Info", icon: Package, description: "Product name, description, and category" },
  { id: 2, title: "Pricing", icon: DollarSign, description: "Price, cost, and inventory settings" },
  { id: 3, title: "Images", icon: ImageIcon, description: "Upload product photos" },
  { id: 4, title: "Details", icon: Tag, description: "Specifications and physical properties" },
  { id: 5, title: "SEO", icon: Eye, description: "Search engine optimization" },
  { id: 6, title: "Settings", icon: Settings, description: "Status, visibility, and features" },
  { id: 7, title: "Review", icon: CheckCircle, description: "Review and submit" },
]

export default function AddProductPage() {
  const [user] = useAuthState(auth)
  const { userData, loading: userLoading } = useUserData()
  const router = useRouter()
  const { toast } = useToast()

  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [newTag, setNewTag] = useState("")
  const [newSpecKey, setNewSpecKey] = useState("")
  const [newSpecValue, setNewSpecValue] = useState("")
  const [newKeyword, setNewKeyword] = useState("")

  // Product limit state
  const [productLimitInfo, setProductLimitInfo] = useState<{
    canAdd: boolean
    currentCount: number
    limit: number
    status: string
    message?: string
  } | null>(null)
  const [checkingLimit, setCheckingLimit] = useState(true)

  // Check product limits when component mounts
  useEffect(() => {
    const checkProductLimits = async () => {
      if (!user) {
        setCheckingLimit(false)
        return
      }

      try {
        const limitInfo = await canUserAddProduct(user.uid)
        setProductLimitInfo(limitInfo)

        if (!limitInfo.canAdd) {
          toast({
            title: "Product Limit Reached",
            description: limitInfo.message,
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error checking product limits:", error)
        toast({
          title: "Error",
          description: "Failed to check product limits. Please try again.",
          variant: "destructive",
        })
      } finally {
        setCheckingLimit(false)
      }
    }

    checkProductLimits()
  }, [user, toast])

  // Memoized validation to prevent infinite re-renders
  const stepValidation = useMemo(() => {
    const validation: Record<number, () => boolean> = {
      1: () => {
        const stepErrors: Record<string, string> = {}
        if (!formData.name.trim()) stepErrors.name = "Product name is required"
        if (!formData.description.trim()) stepErrors.description = "Description is required"
        if (!formData.category) stepErrors.category = "Category is required"

        setErrors((prev) => ({ ...prev, ...stepErrors }))
        return Object.keys(stepErrors).length === 0
      },
      2: () => {
        const stepErrors: Record<string, string> = {}
        if (formData.price <= 0) stepErrors.price = "Price must be greater than 0"
        if (formData.trackQuantity && formData.quantity < 0) stepErrors.quantity = "Quantity cannot be negative"

        setErrors((prev) => ({ ...prev, ...stepErrors }))
        return Object.keys(stepErrors).length === 0
      },
      3: () => {
        const stepErrors: Record<string, string> = {}
        if (formData.images.length === 0) stepErrors.images = "At least one image is required"

        setErrors((prev) => ({ ...prev, ...stepErrors }))
        return Object.keys(stepErrors).length === 0
      },
      4: () => true, // Details are optional
      5: () => true, // SEO is optional
      6: () => true, // Settings have defaults
      7: () => true, // Review step
    }

    return validation
  }, [formData])

  const updateFormData = useCallback((updates: Partial<ProductFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
    // Clear related errors when field is updated
    const updatedFields = Object.keys(updates)
    setErrors((prev) => {
      const newErrors = { ...prev }
      updatedFields.forEach((field) => {
        delete newErrors[field]
      })
      return newErrors
    })
  }, [])

  // Auto-generate SKU when name or category changes
  React.useEffect(() => {
    if (formData.name && formData.category && !formData.sku) {
      const generatedSKU = generateSKU(formData.name, formData.category)
      updateFormData({ sku: generatedSKU })
    }
  }, [formData.name, formData.category, formData.sku, updateFormData])

  const handleImageUpload = async (files: FileList) => {
    if (!user) return

    const maxImages = 10
    const currentImageCount = formData.images.length

    if (currentImageCount + files.length > maxImages) {
      toast({
        title: "Upload limit exceeded",
        description: `You can only upload up to ${maxImages} images. You currently have ${currentImageCount} images.`,
        variant: "destructive",
      })
      return
    }

    setUploadProgress(0)
    const uploadedUrls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const url = await uploadProductImage(file, user.uid)
        uploadedUrls.push(url)
        setUploadProgress(((i + 1) / files.length) * 100)
      }

      const newImages = [...formData.images, ...uploadedUrls]
      updateFormData({
        images: newImages,
        mainImage: formData.mainImage || uploadedUrls[0], // Set first uploaded image as main if none selected
      })

      toast({
        title: "Images uploaded successfully",
        description: `${uploadedUrls.length} image(s) uploaded.`,
      })
    } catch (error) {
      console.error("Error uploading images:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadProgress(0)
    }
  }

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index)
    const removedImage = formData.images[index]

    updateFormData({
      images: newImages,
      mainImage: formData.mainImage === removedImage ? newImages[0] || "" : formData.mainImage,
    })
  }

  const setMainImage = (imageUrl: string) => {
    updateFormData({ mainImage: imageUrl })
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      updateFormData({ tags: [...formData.tags, newTag.trim()] })
      setNewTag("")
    }
  }

  const removeTag = (index: number) => {
    updateFormData({ tags: formData.tags.filter((_, i) => i !== index) })
  }

  const addSpecification = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      updateFormData({
        specifications: {
          ...formData.specifications,
          [newSpecKey.trim()]: newSpecValue.trim(),
        },
      })
      setNewSpecKey("")
      setNewSpecValue("")
    }
  }

  const removeSpecification = (key: string) => {
    const newSpecs = { ...formData.specifications }
    delete newSpecs[key]
    updateFormData({ specifications: newSpecs })
  }

  const addKeyword = () => {
    if (newKeyword.trim() && !formData.seoKeywords.includes(newKeyword.trim())) {
      updateFormData({ seoKeywords: [...formData.seoKeywords, newKeyword.trim()] })
      setNewKeyword("")
    }
  }

  const removeKeyword = (index: number) => {
    updateFormData({ seoKeywords: formData.seoKeywords.filter((_, i) => i !== index) })
  }

  const nextStep = () => {
    if (stepValidation[currentStep]()) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length))
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a product.",
        variant: "destructive",
      })
      return
    }

    // Check product limits again before submitting
    if (!productLimitInfo?.canAdd) {
      toast({
        title: "Product Limit Reached",
        description: productLimitInfo?.message || "You have reached your product limit.",
        variant: "destructive",
      })
      return
    }

    // Validate all steps
    for (let step = 1; step <= 6; step++) {
      if (!stepValidation[step]()) {
        setCurrentStep(step)
        toast({
          title: "Validation failed",
          description: `Please fix the errors in step ${step} before submitting.`,
          variant: "destructive",
        })
        return
      }
    }

    setIsSubmitting(true)

    try {
      const productData: Omit<Product, "id" | "createdAt" | "updatedAt"> = {
        ...formData,
        userId: user.uid,
      }

      const productId = await createProduct(productData)

      toast({
        title: "Product created successfully!",
        description: "Your product has been added to your inventory.",
      })

      router.push(`/dashboard/products/${productId}`)
    } catch (error: any) {
      console.error("Error creating product:", error)
      toast({
        title: "Failed to create product",
        description: error.message || "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state while checking limits
  if (checkingLimit || userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            <span>Checking product limits...</span>
          </div>
        </div>
      </div>
    )
  }

  // Show limit reached message if user can't add products
  if (productLimitInfo && !productLimitInfo.canAdd) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <Lock className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Limit Reached</h2>
                <p className="text-gray-600 mb-4">{productLimitInfo.message}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Current Status:</span>
                  <Badge
                    variant={
                      productLimitInfo.status === "VERIFIED"
                        ? "default"
                        : productLimitInfo.status === "INCOMPLETE"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {productLimitInfo.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="font-medium">Products:</span>
                  <span>
                    {productLimitInfo.currentCount} /{" "}
                    {productLimitInfo.limit === Number.POSITIVE_INFINITY ? "∞" : productLimitInfo.limit}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {productLimitInfo.status === "UNKNOWN" && (
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 mb-2">To increase your limit:</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Complete your profile information</li>
                      <li>• Verify your email address</li>
                      <li>• Add company details</li>
                    </ul>
                  </div>
                )}

                {productLimitInfo.status === "INCOMPLETE" && (
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 mb-2">To remove the limit:</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Complete account verification</li>
                      <li>• Submit required documents</li>
                      <li>• Wait for admin approval</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button variant="outline" onClick={() => router.push("/dashboard/products")} className="flex-1">
                  Back to Products
                </Button>
                <Button onClick={() => router.push("/dashboard/account")} className="flex-1">
                  <Shield className="h-4 w-4 mr-2" />
                  Complete Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                placeholder="Enter product name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                placeholder="Describe your product"
                rows={4}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => updateFormData({ category: value })}>
                  <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => updateFormData({ brand: e.target.value })}
                  placeholder="Enter brand name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => updateFormData({ sku: e.target.value })}
                  placeholder="Auto-generated"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value: "new" | "used" | "refurbished") => updateFormData({ condition: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                    <SelectItem value="refurbished">Refurbished</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => updateFormData({ price: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className={errors.price ? "border-red-500" : ""}
                />
                {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="comparePrice">Compare Price</Label>
                <Input
                  id="comparePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.comparePrice}
                  onChange={(e) => updateFormData({ comparePrice: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.costPrice}
                  onChange={(e) => updateFormData({ costPrice: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="trackQuantity"
                  checked={formData.trackQuantity}
                  onCheckedChange={(checked) => updateFormData({ trackQuantity: checked })}
                />
                <Label htmlFor="trackQuantity">Track quantity</Label>
              </div>

              {formData.trackQuantity && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => updateFormData({ quantity: Number.parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      className={errors.quantity ? "border-red-500" : ""}
                    />
                    {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lowStockThreshold">Low Stock Alert</Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      min="0"
                      value={formData.lowStockThreshold}
                      onChange={(e) => updateFormData({ lowStockThreshold: Number.parseInt(e.target.value) || 5 })}
                      placeholder="5"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">Upload product images</p>
                  <p className="text-sm text-gray-500">
                    Drag and drop or click to select files (Max 10 images, 5MB each)
                  </p>
                </label>
              </div>

              {uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {errors.images && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.images}</AlertDescription>
                </Alert>
              )}
            </div>

            {formData.images.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Uploaded Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                        <Button
                          size="sm"
                          variant={formData.mainImage === image ? "default" : "secondary"}
                          onClick={() => setMainImage(image)}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => removeImage(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {formData.mainImage === image && (
                        <Badge className="absolute top-2 left-2 bg-yellow-500">Main</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                min="0"
                value={formData.weight}
                onChange={(e) => updateFormData({ weight: Number.parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-4">
              <Label>Dimensions</Label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="length">Length</Label>
                  <Input
                    id="length"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.dimensions.length}
                    onChange={(e) =>
                      updateFormData({
                        dimensions: { ...formData.dimensions, length: Number.parseFloat(e.target.value) || 0 },
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="width">Width</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.dimensions.width}
                    onChange={(e) =>
                      updateFormData({
                        dimensions: { ...formData.dimensions, width: Number.parseFloat(e.target.value) || 0 },
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.dimensions.height}
                    onChange={(e) =>
                      updateFormData({
                        dimensions: { ...formData.dimensions, height: Number.parseFloat(e.target.value) || 0 },
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    value={formData.dimensions.unit}
                    onValueChange={(value: "cm" | "in") =>
                      updateFormData({ dimensions: { ...formData.dimensions, unit: value } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cm">cm</SelectItem>
                      <SelectItem value="in">in</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(index)} />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === "Enter" && addTag()}
                />
                <Button type="button" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Specifications</Label>
              <div className="space-y-2">
                {Object.entries(formData.specifications).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="font-medium">{key}:</span>
                    <span>{value}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeSpecification(key)}
                      className="ml-auto"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                  value={newSpecKey}
                  onChange={(e) => setNewSpecKey(e.target.value)}
                  placeholder="Specification name"
                />
                <Input
                  value={newSpecValue}
                  onChange={(e) => setNewSpecValue(e.target.value)}
                  placeholder="Specification value"
                />
                <Button type="button" onClick={addSpecification}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="seoTitle">SEO Title</Label>
              <Input
                id="seoTitle"
                value={formData.seoTitle}
                onChange={(e) => updateFormData({ seoTitle: e.target.value })}
                placeholder="Enter SEO title (leave empty to use product name)"
              />
              <p className="text-sm text-gray-500">{formData.seoTitle.length}/60 characters (recommended: 50-60)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seoDescription">SEO Description</Label>
              <Textarea
                id="seoDescription"
                value={formData.seoDescription}
                onChange={(e) => updateFormData({ seoDescription: e.target.value })}
                placeholder="Enter SEO description (leave empty to use product description)"
                rows={3}
              />
              <p className="text-sm text-gray-500">
                {formData.seoDescription.length}/160 characters (recommended: 150-160)
              </p>
            </div>

            <div className="space-y-4">
              <Label>SEO Keywords</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.seoKeywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {keyword}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeKeyword(index)} />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="Add a keyword"
                  onKeyPress={(e) => e.key === "Enter" && addKeyword()}
                />
                <Button type="button" onClick={addKeyword}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "draft" | "archived") => updateFormData({ status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value: "public" | "private") => updateFormData({ visibility: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Public
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <EyeOff className="h-4 w-4" />
                        Private
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => updateFormData({ featured: checked })}
                />
                <Label htmlFor="featured" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Featured product
                </Label>
              </div>
            </div>
          </div>
        )

      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-2xl font-bold mb-2">Review Your Product</h3>
              <p className="text-gray-600">Please review all the information before submitting.</p>
            </div>

            {/* Product limit info */}
            {productLimitInfo && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>
                      Product limit: {productLimitInfo.currentCount + 1} /{" "}
                      {productLimitInfo.limit === Number.POSITIVE_INFINITY ? "∞" : productLimitInfo.limit}
                    </span>
                    <Badge
                      variant={
                        productLimitInfo.status === "VERIFIED"
                          ? "default"
                          : productLimitInfo.status === "INCOMPLETE"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {productLimitInfo.status}
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">Name:</span> {formData.name}
                  </div>
                  <div>
                    <span className="font-medium">Category:</span> {formData.category}
                  </div>
                  <div>
                    <span className="font-medium">Brand:</span> {formData.brand || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">SKU:</span> {formData.sku}
                  </div>
                  <div>
                    <span className="font-medium">Condition:</span> {formData.condition}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pricing & Inventory</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">Price:</span> ${formData.price.toFixed(2)}
                  </div>
                  {formData.comparePrice > 0 && (
                    <div>
                      <span className="font-medium">Compare Price:</span> ${formData.comparePrice.toFixed(2)}
                    </div>
                  )}
                  {formData.trackQuantity && (
                    <div>
                      <span className="font-medium">Quantity:</span> {formData.quantity}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Track Quantity:</span> {formData.trackQuantity ? "Yes" : "No"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {formData.images.slice(0, 6).map((image, index) => (
                      <div key={index} className="aspect-square rounded overflow-hidden bg-gray-100 relative">
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {formData.mainImage === image && (
                          <Badge className="absolute top-1 left-1 text-xs bg-yellow-500">Main</Badge>
                        )}
                      </div>
                    ))}
                    {formData.images.length > 6 && (
                      <div className="aspect-square rounded bg-gray-100 flex items-center justify-center">
                        <span className="text-sm text-gray-500">+{formData.images.length - 6} more</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    <Badge variant={formData.status === "active" ? "default" : "secondary"}>{formData.status}</Badge>
                  </div>
                  <div>
                    <span className="font-medium">Visibility:</span>{" "}
                    <Badge variant={formData.visibility === "public" ? "default" : "secondary"}>
                      {formData.visibility}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Featured:</span> {formData.featured ? "Yes" : "No"}
                  </div>
                </CardContent>
              </Card>
            </div>

            {formData.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {Object.keys(formData.specifications).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Specifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(formData.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="font-medium">{key}:</span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600 mt-2">Create a new product for your inventory</p>
        </div>

        {/* Product Limit Info */}
        {productLimitInfo && (
          <Alert className="mb-6">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>
                  Product limit: {productLimitInfo.currentCount} /{" "}
                  {productLimitInfo.limit === Number.POSITIVE_INFINITY ? "∞" : productLimitInfo.limit}
                </span>
                <Badge
                  variant={
                    productLimitInfo.status === "VERIFIED"
                      ? "default"
                      : productLimitInfo.status === "INCOMPLETE"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {productLimitInfo.status}
                </Badge>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id
              const isAccessible = currentStep >= step.id

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      isCompleted
                        ? "bg-green-500 border-green-500 text-white"
                        : isActive
                          ? "bg-blue-500 border-blue-500 text-white"
                          : isAccessible
                            ? "border-gray-300 text-gray-500 hover:border-blue-500 cursor-pointer"
                            : "border-gray-200 text-gray-300"
                    }`}
                    onClick={() => isAccessible && setCurrentStep(step.id)}
                  >
                    {isCompleted ? <CheckCircle className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-2 ${currentStep > step.id ? "bg-green-500" : "bg-gray-200"}`} />
                  )}
                </div>
              )
            })}
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">{steps[currentStep - 1].title}</h2>
            <p className="text-gray-600 text-sm">{steps[currentStep - 1].description}</p>
          </div>
        </div>

        {/* Form Content */}
        <Card className="mb-8">
          <CardContent className="p-6">{renderStepContent()}</CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep < steps.length ? (
            <Button onClick={nextStep}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Product...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Product
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
