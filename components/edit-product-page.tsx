"use client"

import type React from "react"
import type { ReactElement } from "react"
import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  ImageIcon,
  FileVideo,
  Save,
  UploadIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { db } from "@/lib/firebase"
import DashboardLayout from "./dashboard-layout"
import { useUserData } from "@/hooks/use-user-data"
import { useAnimatedSuccess } from "@/hooks/use-animated-success"
import { AnimatedSuccessMessage } from "./animated-success-message"
import { useProducts } from "@/hooks/use-products"
import { firestoreCache } from "@/hooks/use-firestore-cache"
import { loggedGetDoc } from "@/lib/firestore-logger"
import { CategorySelection } from "./product-form-shared"

interface ProductFormData {
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
  availability_type: "stock" | "pre_order"
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
    color?: string
    weight?: string
    height?: string
    length?: string
    price: string
    stock: string
    images: File[]
    media: Array<{
      distance: string
      isVideo: boolean
      type: string
      url: string
    }>
  }>
}

interface EditProductPageProps {
  productId: string
}

const STEPS = [
  { id: 1, title: "Details", description: "Basic product information" },
  { id: 2, title: "Specification", description: "Product variations and unit" },
  { id: 3, title: "Sales Information", description: "Pricing and inventory" },
  { id: 4, title: "Shipping", description: "Delivery options" },
  { id: 5, title: "Media", description: "Product images and videos" },
  { id: 6, title: "Others", description: "Additional information" },
]

const UNIT_OPTIONS = [
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

// Real Firestore query function for categories
const useFetchCategories = () => {
  return useCallback(async () => {
    try {
      const { collection, query, where, getDocs, orderBy } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase")

      const categoriesRef = collection(db, "categories")
      const q = query(
        categoriesRef,
        where("type", "==", "MERCHANDISE"),
        where("active", "==", true),
        where("deleted", "==", false),
        orderBy("name", "asc"),
      )
      console.log(categoriesRef)
      const querySnapshot = await getDocs(q)
      const fetchedCategories: any[] = []
      console.log(q)
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        fetchedCategories.push({
          id: doc.id,
          name: data.name || "Unnamed Category",
          description: data.description || "",
          type: data.type || "MERCHANDISE",
          active: data.active !== false,
          deleted: data.deleted === true ? true : false,
        })
      })

      console.log(`Fetched ${fetchedCategories.length} categories:`, fetchedCategories)
      return fetchedCategories
    } catch (error) {
      console.error("Error fetching categories:", error)
      throw error
    }
  }, [])
}

export default function EditProductPage({ productId }: EditProductPageProps): ReactElement {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [productLoading, setProductLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [categoryNames, setCategoryNames] = useState<{ [key: string]: string }>({})
  const [expandedVariations, setExpandedVariations] = useState<{ [key: string]: boolean }>({})

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    categories: [],
    unit: "per_piece",
    delivery_options: {
      delivery: false,
      pickup: false,
      delivery_note: "",
      pickup_note: "",
    },
    product_images: [],
    product_video: null,
    media: [],
    delivery_days: "",
    condition: "",
    availability_type: "stock",
    pre_order_days: "",
    payment_methods: {
      ewallet: false,
      bank_transfer: false,
      gcash: false,
      maya: false,
      manual: true,
    },
    variations: [],
  })

  const [categories, setCategories] = useState<any[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)

  // Use custom hooks for data fetching with caching
  const { currentUser, userData, loading: userLoading, error: userError } = useUserData()
  const { invalidateProducts } = useProducts(currentUser?.uid)

  // Use the animated success hook
  const { showSuccessAnimation, successMessage, isSuccessVisible, showAnimatedSuccess } = useAnimatedSuccess()

  // Fetch product data for editing
  const fetchProduct = useCallback(async () => {
    if (!currentUser || !productId) return

    try {
      setProductLoading(true)
      const productRef = doc(db, "products", productId)
      const productSnap = await loggedGetDoc(productRef)

      if (!productSnap.exists()) {
        setError("Product not found.")
        return
      }

      const productData = productSnap.data()

      // Check if current user owns this product
      if (productData.seller_id !== currentUser.uid) {
        setError("You don't have permission to edit this product.")
        return
      }

      // Convert legacy media format to new format
      let mediaArray: Array<{
        distance: string
        isVideo: boolean
        type: string
        url: string
      }> = []

      // Handle media - check if new format exists, otherwise convert from legacy
      if (productData.media && Array.isArray(productData.media)) {
        // New format exists
        mediaArray = productData.media
      } else {
        // Convert from legacy format
        if (productData.photo_url && Array.isArray(productData.photo_url)) {
          productData.photo_url.forEach((url: string) => {
            mediaArray.push({ distance: "", isVideo: false, type: "", url })
          })
        }
        if (productData.media_url && typeof productData.media_url === "string") {
          mediaArray.push({ distance: "", isVideo: true, type: "", url: productData.media_url })
        }
      }

      // Convert variations to match the new format
      const convertedVariations = (productData.variations || []).map((variation: any, index: number) => ({
        id: variation.id || `variation_${index}`,
        name: variation.name || "",
        color: variation.color || "",
        weight: variation.weight?.toString() || "",
        height: variation.height?.toString() || "",
        length: variation.length?.toString() || "",
        price: variation.price?.toString() || "",
        stock: variation.stock?.toString() || "",
        images: [], // Will be empty for existing variations
        media: variation.media || [],
      }))

      // Map delivery options
      const deliveryOptions = {
        delivery: productData.delivery_options?.delivery || false,
        pickup: productData.delivery_options?.pickup || false,
        delivery_note: productData.delivery_options?.delivery_note || "",
        pickup_note: productData.delivery_options?.pickup_note || "",
      }

      // Map payment methods
      const paymentMethods = {
        ewallet: productData.payment_methods?.ewallet || false,
        bank_transfer: productData.payment_methods?.bank_transfer || false,
        gcash: productData.payment_methods?.gcash || false,
        maya: productData.payment_methods?.maya || false,
        manual: true, // Always set to true
      }

      setFormData({
        name: productData.name || "",
        description: productData.description || "",
        categories: productData.categories || [],
        unit: productData.unit || "per_piece",
        delivery_options: deliveryOptions,
        product_images: [], // Will be empty for existing media
        product_video: null, // Will be null for existing media
        media: mediaArray,
        delivery_days: productData.delivery_days?.toString() || "",
        condition: productData.condition || "",
        availability_type: productData.availability_type || "stock",
        pre_order_days: productData.pre_order_days?.toString() || "",
        payment_methods: paymentMethods,
        variations: convertedVariations,
      })

      // Initialize expanded state for variations
      const initialExpanded: { [key: string]: boolean } = {}
      convertedVariations.forEach((variation) => {
        initialExpanded[variation.id] = false
      })
      setExpandedVariations(initialExpanded)
    } catch (error) {
      console.error("Error fetching product:", error)
      setError("Failed to load product data. Please try again.")
    } finally {
      setProductLoading(false)
    }
  }, [currentUser, productId])

  // Fetch data when user is available
  useEffect(() => {
    if (currentUser) {
      fetchProduct()
    }
  }, [currentUser, fetchProduct])

  // Load categories
  const fetchCategories = useFetchCategories()

  useEffect(() => {
    const loadCategories = async () => {
      setCategoriesLoading(true)
      setCategoriesError(null)

      try {
        const fetchedCategories = await fetchCategories()
        setCategories(fetchedCategories)
      } catch (error) {
        console.error("Failed to load categories:", error)
        setCategoriesError("Failed to load categories. Please try again.")
      } finally {
        setCategoriesLoading(false)
      }
    }

    loadCategories()
  }, [fetchCategories])

  // Update the existing useEffect for categories to also store names
  useEffect(() => {
    if (categories && categories.length > 0) {
      const nameMap: { [key: string]: string } = {}
      categories.forEach((category) => {
        nameMap[category.id] = category.name
      })
      setCategoryNames(nameMap)
    }
  }, [categories])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
      // Clear error when user starts typing
      if (error) setError("")
    },
    [error],
  )

  const handleCategoryChange = useCallback(
    (categoryId: string, checked: boolean) => {
      setFormData((prev) => ({
        ...prev,
        categories: checked ? [...prev.categories, categoryId] : prev.categories.filter((id) => id !== categoryId),
      }))
      // Clear error when user makes selection
      if (error) setError("")
    },
    [error],
  )

  const handleDeliveryOptionChange = useCallback(
    (option: string, checked: boolean) => {
      setFormData((prev) => ({
        ...prev,
        delivery_options: {
          ...prev.delivery_options,
          [option]: checked,
        },
      }))
      // Clear error when user makes selection
      if (error) setError("")
    },
    [error],
  )

  const handleDeliveryNoteChange = useCallback((option: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      delivery_options: {
        ...prev.delivery_options,
        [`${option}_note`]: value,
      },
    }))
  }, [])

  const handlePaymentMethodChange = useCallback(
    (method: string, checked: boolean) => {
      setFormData((prev) => ({
        ...prev,
        payment_methods: {
          ...prev.payment_methods,
          [method]: checked,
        },
      }))
      // Clear error when user makes selection
      if (error) setError("")
    },
    [error],
  )

  const toggleVariationExpansion = useCallback((variationId: string) => {
    setExpandedVariations((prev) => ({
      ...prev,
      [variationId]: !prev[variationId],
    }))
  }, [])

  const addVariation = useCallback(() => {
    const newVariation = {
      id: Date.now().toString(),
      name: "",
      color: "",
      weight: "",
      height: "",
      length: "",
      price: "",
      stock: "",
      images: [],
      media: [],
    }
    setFormData((prev) => ({
      ...prev,
      variations: [...prev.variations, newVariation],
    }))
    // Auto-expand new variation
    setExpandedVariations((prev) => ({
      ...prev,
      [newVariation.id]: true,
    }))
  }, [])

  const removeVariation = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      variations: prev.variations.filter((variation) => variation.id !== id),
    }))
    // Remove from expanded state
    setExpandedVariations((prev) => {
      const newState = { ...prev }
      delete newState[id]
      return newState
    })
  }, [])

  const updateVariation = useCallback((id: string, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      variations: prev.variations.map((variation) =>
        variation.id === id ? { ...variation, [field]: value } : variation,
      ),
    }))
  }, [])

  const updateVariationPriceStock = useCallback((id: string, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      variations: prev.variations.map((variation) =>
        variation.id === id ? { ...variation, [field]: value } : variation,
      ),
    }))
  }, [])

  // Upload file to Firebase Storage
  const uploadFileToStorage = useCallback(async (file: File, path: string): Promise<string> => {
    try {
      const storage = getStorage()
      const storageRef = ref(storage, path)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)
      return downloadURL
    } catch (error) {
      console.error("Error uploading file:", error)
      throw error
    }
  }, [])

  // Extract file path from Firebase Storage URL
  const getStoragePathFromUrl = (url: string): string | null => {
    try {
      const match = url.match(/\/o\/(.+?)\?/)
      if (match && match[1]) {
        return decodeURIComponent(match[1])
      }
      return null
    } catch (error) {
      console.error("Error extracting path from URL:", error)
      return null
    }
  }

  // Delete file from Firebase Storage
  const deleteFileFromStorage = async (url: string): Promise<boolean> => {
    try {
      const path = getStoragePathFromUrl(url)
      if (!path) return false

      const storage = getStorage()
      const fileRef = ref(storage, path)
      await deleteObject(fileRef)
      return true
    } catch (error) {
      console.error("Error deleting file:", error)
      return false
    }
  }

  const handleVariationImageUpload = useCallback(
    async (variationId: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length === 0) return

      setUploading(true)
      setError("")

      try {
        const uploadPromises = files.map(async (file, index) => {
          const path = `products/${currentUser?.uid}/variations/${variationId}/${Date.now()}_${index}.${file.name.split(".").pop()}`
          const url = await uploadFileToStorage(file, path)
          return {
            distance: "",
            isVideo: false,
            type: "",
            url: url,
          }
        })

        const mediaObjects = await Promise.all(uploadPromises)

        setFormData((prev) => ({
          ...prev,
          variations: prev.variations.map((variation) =>
            variation.id === variationId
              ? {
                  ...variation,
                  images: [...variation.images, ...files],
                  media: [...variation.media, ...mediaObjects],
                }
              : variation,
          ),
        }))

        showAnimatedSuccess("Variation images uploaded successfully!")
      } catch (error) {
        console.error("Error uploading variation images:", error)
        setError("Failed to upload variation images. Please try again.")
      } finally {
        setUploading(false)
      }
    },
    [currentUser?.uid, uploadFileToStorage, showAnimatedSuccess],
  )

  const removeVariationImage = useCallback((variationId: string, imageIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      variations: prev.variations.map((variation) =>
        variation.id === variationId
          ? {
              ...variation,
              images: variation.images.filter((_, index) => index !== imageIndex),
              media: variation.media.filter((_, index) => index !== imageIndex),
            }
          : variation,
      ),
    }))
  }, [])

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length === 0) return

      setUploading(true)
      setError("")

      try {
        setFormData((prev) => ({
          ...prev,
          product_images: [...prev.product_images, ...files],
        }))

        const uploadPromises = files.map(async (file, index) => {
          const path = `products/${currentUser?.uid}/${Date.now()}_${index}.${file.name.split(".").pop()}`
          const url = await uploadFileToStorage(file, path)
          return {
            distance: "",
            isVideo: false,
            type: "",
            url: url,
          }
        })

        const mediaObjects = await Promise.all(uploadPromises)

        setFormData((prev) => ({
          ...prev,
          media: [...prev.media, ...mediaObjects],
        }))

        showAnimatedSuccess("Images uploaded successfully!")
      } catch (error) {
        console.error("Error uploading images:", error)
        setError("Failed to upload images. Please try again.")
      } finally {
        setUploading(false)
      }
    },
    [currentUser?.uid, uploadFileToStorage, showAnimatedSuccess],
  )

  const handleVideoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Check if a video already exists
      const existingVideo = formData.media.find((item) => item.isVideo)
      if (existingVideo) {
        setError("Only one video can be uploaded per product. Please remove the existing video first.")
        return
      }

      setUploading(true)
      setError("")

      try {
        setFormData((prev) => ({
          ...prev,
          product_video: file,
        }))

        const path = `products/${currentUser?.uid}/videos/${Date.now()}_${file.name}`
        const url = await uploadFileToStorage(file, path)

        const videoObject = {
          distance: "",
          isVideo: true,
          type: "",
          url: url,
        }

        setFormData((prev) => ({
          ...prev,
          media: [...prev.media, videoObject],
        }))

        showAnimatedSuccess("Video uploaded successfully!")
      } catch (error) {
        console.error("Error uploading video:", error)
        setError("Failed to upload video. Please try again.")
      } finally {
        setUploading(false)
      }
    },
    [currentUser?.uid, uploadFileToStorage, showAnimatedSuccess],
  )

  const removeImage = useCallback((index: number) => {
    setFormData((prev) => {
      const newImages = [...prev.product_images]
      const newMedia = [...prev.media]

      // Find the corresponding media item (only images, not videos)
      let imageIndex = 0
      let mediaIndexToRemove = -1

      for (let i = 0; i < newMedia.length; i++) {
        if (!newMedia[i].isVideo) {
          if (imageIndex === index) {
            mediaIndexToRemove = i
            break
          }
          imageIndex++
        }
      }

      if (mediaIndexToRemove !== -1) {
        // Try to delete from storage
        deleteFileFromStorage(newMedia[mediaIndexToRemove].url)
        newMedia.splice(mediaIndexToRemove, 1)
      }

      if (index < newImages.length) {
        newImages.splice(index, 1)
      }

      return {
        ...prev,
        product_images: newImages,
        media: newMedia,
      }
    })
  }, [])

  const removeVideo = useCallback(() => {
    setFormData((prev) => {
      const videoItem = prev.media.find((item) => item.isVideo)
      if (videoItem) {
        // Try to delete from storage
        deleteFileFromStorage(videoItem.url)
      }

      const newMedia = prev.media.filter((item) => !item.isVideo)

      return {
        ...prev,
        product_video: null,
        media: newMedia,
      }
    })
  }, [])

  const validateStep = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 1:
          return formData.name.trim() !== "" && formData.description.trim() !== "" && formData.categories.length > 0
        case 2:
          // Check if variations are valid and unit is selected
          const variationsValid =
            formData.variations.length === 0 || formData.variations.every((variation) => variation.name.trim() !== "")
          return variationsValid && formData.unit.trim() !== ""
        case 3:
          // If variations exist, check their price and stock, otherwise check main price and stock
          if (formData.variations.length > 0) {
            return formData.variations.every(
              (variation) => variation.price.trim() !== "" && variation.stock.trim() !== "",
            )
          }
          return true // No base price/stock needed if variations exist
        case 4:
          return formData.delivery_options.delivery || formData.delivery_options.pickup
        case 5:
          // Check if main product has images or all variations have images
          if (formData.variations.length > 0) {
            return formData.variations.every((variation) => variation.media.length > 0)
          }
          return formData.media.filter((item) => !item.isVideo).length > 0
        case 6:
          const availabilityValid =
            formData.availability_type === "stock" ||
            (formData.availability_type === "pre_order" && formData.pre_order_days.trim() !== "")
          return formData.condition.trim() !== "" && availabilityValid
        default:
          return true
      }
    },
    [formData],
  )

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
      setError("")
    } else {
      setError("Please fill in all required fields before proceeding.")
    }
  }, [currentStep, validateStep])

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    setError("")
  }, [])

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step)
    setError("")
  }, [])

  const handleSubmit = useCallback(
    async (isDraft = false) => {
      if (!currentUser) {
        setError("You must be logged in to update a product.")
        return
      }

      if (!isDraft && !validateStep(6)) {
        setError("Please fill in all required fields.")
        return
      }

      if (!userData?.company_id) {
        setError("Company information is required. Please set up your company profile first.")
        return
      }

      setLoading(true)
      setError("")

      try {
        // Create product data object
        const productData = {
          name: formData.name,
          description: formData.description,
          categories: formData.categories,
          unit: formData.unit,
          price: formData.variations.length > 0 ? 0 : 0, // Base price is 0 if variations exist
          delivery_options: formData.delivery_options,
          condition: formData.condition,
          availability_type: formData.availability_type,
          pre_order_days:
            formData.availability_type === "pre_order" ? Number.parseInt(formData.pre_order_days) || 0 : null,
          payment_methods: {
            ...formData.payment_methods,
            manual: true, // Force manual to true
          },
          media: formData.media,
          variations: formData.variations.map((variation) => ({
            id: variation.id,
            name: variation.name,
            color: variation.color || null,
            weight: variation.weight ? Number.parseFloat(variation.weight) : null,
            height: variation.height ? Number.parseInt(variation.height) : null,
            length: variation.length ? Number.parseInt(variation.length) : null,
            price: Number.parseFloat(variation.price) || 0,
            stock: Number.parseInt(variation.stock) || 0,
            media: variation.media,
          })),
          seller_id: currentUser.uid,
          seller_name: `${userData.first_name || ""} ${userData.last_name || ""}`.trim(),
          company_id: userData.company_id,
          type: "MERCHANDISE",
          active: !isDraft,
          status: isDraft ? "draft" : "published",
          updated: serverTimestamp(),
          updated_by: currentUser.uid,
        }

        const productRef = doc(db, "products", productId)
        await updateDoc(productRef, productData)

        showAnimatedSuccess(isDraft ? "Product saved as draft!" : "Product updated successfully!")

        // Invalidate the products cache to ensure the updated product appears immediately
        invalidateProducts()

        // Also invalidate the global cache key for this user's products
        firestoreCache.invalidate(`products_${currentUser.uid}`)

        setTimeout(() => {
          window.location.href = "/dashboard/products"
        }, 2000)
      } catch (error) {
        console.error("Error updating product:", error)

        // Provide detailed error information
        let errorMessage = "Failed to update product. "

        if (error.code === "permission-denied") {
          errorMessage += "You don't have permission to update products. Please check your account permissions."
        } else if (error.code === "auth/network-request-failed") {
          errorMessage += "Network connection failed. Please check your internet connection and try again."
        } else if (error.code === "storage/unauthorized") {
          errorMessage += "File upload failed due to insufficient permissions. Please contact support."
        } else if (error.message) {
          errorMessage += error.message
        } else {
          errorMessage += "Please try again or contact support if the problem persists."
        }

        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    [currentUser, userData, formData, validateStep, showAnimatedSuccess, invalidateProducts, productId],
  )

  if (userError) {
    return (
      <DashboardLayout activeItem="products">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Error</h3>
            <p className="text-gray-500 mb-4">{userError}</p>
            <Button onClick={() => (window.location.href = "/login")}>Go to Login</Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (productLoading) {
    return (
      <DashboardLayout activeItem="products">
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          <span className="ml-2 text-gray-600">Loading product...</span>
        </div>
      </DashboardLayout>
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-xl font-semibold text-gray-900">Product Details</h2>
              <p className="text-sm text-gray-600 mt-1">Enter the basic information about your product</p>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  className={`w-full ${error && !formData.name.trim() ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
                  required
                />
                {error && !formData.name.trim() && (
                  <p className="text-red-500 text-xs mt-1">Product name is required</p>
                )}
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2 block">
                  Product Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your product in detail..."
                  rows={4}
                  className={`w-full resize-none ${error && !formData.description.trim() ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
                  required
                />
                {error && !formData.description.trim() && (
                  <p className="text-red-500 text-xs mt-1">Product description is required</p>
                )}
              </div>

              <CategorySelection
                categories={categories}
                selectedCategories={formData.categories}
                onCategoryChange={handleCategoryChange}
                loading={categoriesLoading}
                error={categoriesError}
                fieldError={
                  error && formData.categories.length === 0 ? "Please select at least one category" : undefined
                }
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-xl font-semibold text-gray-900">Specification</h2>
              <p className="text-sm text-gray-600 mt-1">Define product variations and unit of measurement</p>
            </div>

            {/* Unit Selection */}
            <div>
              <Label htmlFor="unit" className="text-sm font-medium text-gray-700 mb-2 block">
                Unit <span className="text-red-500">*</span>
              </Label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              >
                {UNIT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Variations Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium text-gray-900">Product Variations</Label>
                  <p className="text-sm text-gray-600 mt-1">Add different versions of your product (optional)</p>
                </div>
                <Button
                  type="button"
                  onClick={addVariation}
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  Add Variation
                </Button>
              </div>

              {formData.variations.length > 0 && (
                <div className="space-y-4">
                  {formData.variations.map((variation, index) => (
                    <div key={variation.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div
                        className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => toggleVariationExpansion(variation.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{variation.name || `Variation ${index + 1}`}</h4>
                            <p className="text-sm text-gray-500">
                              {variation.color && `Color: ${variation.color}`}
                              {variation.price && ` • Price: ₱${variation.price}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeVariation(variation.id)
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          {expandedVariations[variation.id] ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {expandedVariations[variation.id] && (
                        <div className="p-4 space-y-4 border-t border-gray-200">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label
                                htmlFor={`variation-name-${variation.id}`}
                                className="text-sm font-medium text-gray-700 mb-1 block"
                              >
                                Variation Name <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id={`variation-name-${variation.id}`}
                                value={variation.name}
                                onChange={(e) => updateVariation(variation.id, "name", e.target.value)}
                                placeholder="e.g., Small, Large, Red, Blue"
                                className={
                                  error && !variation.name.trim()
                                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                                    : ""
                                }
                                required
                              />
                              {error && !variation.name.trim() && (
                                <p className="text-red-500 text-xs mt-1">Variation name is required</p>
                              )}
                            </div>

                            <div>
                              <Label
                                htmlFor={`variation-color-${variation.id}`}
                                className="text-sm font-medium text-gray-700 mb-1 block"
                              >
                                Color
                              </Label>
                              <Input
                                id={`variation-color-${variation.id}`}
                                value={variation.color}
                                onChange={(e) => updateVariation(variation.id, "color", e.target.value)}
                                placeholder="e.g., Red, Blue, Green"
                              />
                            </div>

                            <div>
                              <Label
                                htmlFor={`variation-weight-${variation.id}`}
                                className="text-sm font-medium text-gray-700 mb-1 block"
                              >
                                Weight (kg)
                              </Label>
                              <Input
                                id={`variation-weight-${variation.id}`}
                                type="number"
                                step="0.01"
                                value={variation.weight}
                                onChange={(e) => updateVariation(variation.id, "weight", e.target.value)}
                                placeholder="0.00"
                              />
                            </div>

                            <div>
                              <Label
                                htmlFor={`variation-height-${variation.id}`}
                                className="text-sm font-medium text-gray-700 mb-1 block"
                              >
                                Height (cm)
                              </Label>
                              <Input
                                id={`variation-height-${variation.id}`}
                                type="number"
                                value={variation.height}
                                onChange={(e) => updateVariation(variation.id, "height", e.target.value)}
                                placeholder="0"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <Label
                                htmlFor={`variation-length-${variation.id}`}
                                className="text-sm font-medium text-gray-700 mb-1 block"
                              >
                                Length (cm)
                              </Label>
                              <Input
                                id={`variation-length-${variation.id}`}
                                type="number"
                                value={variation.length}
                                onChange={(e) => updateVariation(variation.id, "length", e.target.value)}
                                placeholder="0"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {formData.variations.length === 0 && (
                <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                  <p>No variations added yet. Click "Add Variation" to create different versions of your product.</p>
                </div>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-xl font-semibold text-gray-900">Sales Information</h2>
              <p className="text-sm text-gray-600 mt-1">Set pricing and inventory for your product</p>
            </div>

            {formData.variations.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-blue-900 mb-2">Variation Pricing & Stock</h3>
                  <p className="text-sm text-blue-700">Set the price and stock quantity for each variation.</p>
                </div>

                <div className="space-y-4">
                  {formData.variations.map((variation, index) => (
                    <div key={variation.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900">{variation.name || `Variation ${index + 1}`}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {formData.unit.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                            {variation.color && ` • Color: ${variation.color}`}
                            {variation.weight && ` • Weight: ${variation.weight}kg`}
                            {variation.height && ` • Height: ${variation.height}cm`}
                            {variation.length && ` • Length: ${variation.length}cm`}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label
                            htmlFor={`variation-price-${variation.id}`}
                            className="text-sm font-medium text-gray-700 mb-1 block"
                          >
                            Price (₱) <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id={`variation-price-${variation.id}`}
                            type="number"
                            step="0.01"
                            value={variation.price}
                            onChange={(e) => updateVariationPriceStock(variation.id, "price", e.target.value)}
                            placeholder="0.00"
                            className={
                              error && !variation.price.trim()
                                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                                : ""
                            }
                            required
                          />
                          {error && !variation.price.trim() && (
                            <p className="text-red-500 text-xs mt-1">Price is required</p>
                          )}
                        </div>

                        <div>
                          <Label
                            htmlFor={`variation-stock-${variation.id}`}
                            className="text-sm font-medium text-gray-700 mb-1 block"
                          >
                            Stock Quantity <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id={`variation-stock-${variation.id}`}
                            type="number"
                            value={variation.stock}
                            onChange={(e) => updateVariationPriceStock(variation.id, "stock", e.target.value)}
                            placeholder="0"
                            className={
                              error && !variation.stock.trim()
                                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                                : ""
                            }
                            required
                          />
                          {error && !variation.stock.trim() && (
                            <p className="text-red-500 text-xs mt-1">Stock quantity is required</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                <p className="text-lg font-medium mb-2">No variations added</p>
                <p className="text-sm">Pricing will be handled in the final step if no variations are created.</p>
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-xl font-semibold text-gray-900">Shipping</h2>
              <p className="text-sm text-gray-600 mt-1">Configure delivery and pickup options</p>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium text-gray-900 block">
                Delivery Options <span className="text-red-500">*</span>
              </Label>
              <p className="text-sm text-gray-600 mb-4">Select at least one delivery option</p>

              <div className="space-y-4">
                <div
                  className={`border rounded-lg p-4 ${error && !formData.delivery_options.delivery && !formData.delivery_options.pickup ? "border-red-300" : "border-gray-200"}`}
                >
                  <label className="flex items-center space-x-3 cursor-pointer mb-3 select-none">
                    <input
                      type="checkbox"
                      checked={formData.delivery_options.delivery}
                      onChange={(e) => handleDeliveryOptionChange("delivery", e.target.checked)}
                      className="rounded border-gray-300 text-red-500 focus:ring-red-500 h-4 w-4 flex-shrink-0"
                    />
                    <div>
                      <span className="font-medium text-gray-900">Delivery</span>
                      <p className="text-sm text-gray-500">Ship products to customer's address</p>
                    </div>
                  </label>
                  {formData.delivery_options.delivery && (
                    <div className="ml-7">
                      <Label htmlFor="delivery_note" className="text-sm font-medium text-gray-700 mb-1 block">
                        Delivery Note
                      </Label>
                      <Textarea
                        id="delivery_note"
                        value={formData.delivery_options.delivery_note}
                        onChange={(e) => handleDeliveryNoteChange("delivery", e.target.value)}
                        placeholder="Add delivery instructions, fees, or special conditions..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  )}
                </div>

                <div
                  className={`border rounded-lg p-4 ${error && !formData.delivery_options.delivery && !formData.delivery_options.pickup ? "border-red-300" : "border-gray-200"}`}
                >
                  <label className="flex items-center space-x-3 cursor-pointer mb-3 select-none">
                    <input
                      type="checkbox"
                      checked={formData.delivery_options.pickup}
                      onChange={(e) => handleDeliveryOptionChange("pickup", e.target.checked)}
                      className="rounded border-gray-300 text-red-500 focus:ring-red-500 h-4 w-4 flex-shrink-0"
                    />
                    <div>
                      <span className="font-medium text-gray-900">Pick up</span>
                      <p className="text-sm text-gray-500">Customer picks up from your location</p>
                    </div>
                  </label>
                  {formData.delivery_options.pickup && (
                    <div className="ml-7">
                      <Label htmlFor="pickup_note" className="text-sm font-medium text-gray-700 mb-1 block">
                        Pickup Note
                      </Label>
                      <Textarea
                        id="pickup_note"
                        value={formData.delivery_options.pickup_note}
                        onChange={(e) => handleDeliveryNoteChange("pickup", e.target.value)}
                        placeholder="Add pickup location, hours, or special instructions..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {error && !formData.delivery_options.delivery && !formData.delivery_options.pickup && (
                <p className="text-red-500 text-sm">Please select at least one delivery option</p>
              )}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-xl font-semibold text-gray-900">Media</h2>
              <p className="text-sm text-gray-600 mt-1">Upload images and videos for your product</p>
            </div>

            {/* Responsive Media Layout */}
            <div className="flex flex-col xl:flex-row gap-8">
              {/* Main Media Section */}
              <div className="flex-1 space-y-6">
                {/* Product Images */}
                <div>
                  <Label className="text-base font-medium text-gray-900 mb-3 block">
                    Product Images <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-sm text-gray-600 mb-4">Upload high-quality images of your product</p>

                  <div
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                      error && formData.media.filter((item) => !item.isVideo).length === 0
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 mb-4">Drag and drop images here, or click to select</p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("image-upload")?.click()}
                      disabled={uploading}
                      className="bg-white border-gray-300"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Choose Images"
                      )}
                    </Button>
                  </div>

                  {error && formData.media.filter((item) => !item.isVideo).length === 0 && (
                    <p className="text-red-500 text-sm mt-2">At least one product image is required</p>
                  )}

                  {formData.media.filter((item) => !item.isVideo).length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-base font-medium text-gray-900 mb-3">Uploaded Images</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {formData.media
                          .filter((item) => !item.isVideo)
                          .map((mediaItem, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={mediaItem.url || "/placeholder.svg"}
                                alt={`Product ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg?height=128&width=128"
                                }}
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Video */}
                <div>
                  <Label className="text-base font-medium text-gray-900 mb-3 block">Product Video</Label>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload one video to showcase your product (maximum 1 video allowed)
                  </p>

                  {formData.media.find((item) => item.isVideo) ? (
                    // Show existing video with replace option
                    <div className="space-y-4">
                      <div className="relative inline-block w-full max-w-md">
                        <video
                          src={formData.media.find((item) => item.isVideo)?.url}
                          className="w-full h-48 object-cover rounded-lg border"
                          controls
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={removeVideo}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center space-x-3 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">1</span>
                        </div>
                        <span>Maximum video limit reached. Remove the current video to upload a different one.</span>
                      </div>

                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                        id="video-replace"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("video-replace")?.click()}
                        disabled={uploading}
                        className="bg-white border-gray-300"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Replacing...
                          </>
                        ) : (
                          "Replace Video"
                        )}
                      </Button>
                    </div>
                  ) : (
                    // Show upload area when no video exists
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FileVideo className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 mb-2">Upload a product video (optional)</p>
                      <p className="text-xs text-gray-500 mb-4">Maximum 1 video • Supported formats: MP4, MOV, AVI</p>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                        id="video-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("video-upload")?.click()}
                        disabled={uploading}
                        className="bg-white border-gray-300"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          "Choose Video"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Variation Photos Sidebar */}
              {formData.variations.length > 0 && (
                <div className="w-full xl:w-80 bg-gray-50 rounded-lg p-6">
                  <h3 className="text-base font-medium text-gray-900 mb-4">Variation Photos</h3>
                  <p className="text-sm text-gray-600 mb-4">Upload specific images for each variation</p>

                  <div className="space-y-4">
                    {formData.variations.map((variation, index) => (
                      <div key={variation.id} className="bg-white rounded-lg p-4 border">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {variation.name || `Variation ${index + 1}`}
                          </h4>
                        </div>

                        {(Array.isArray(variation.media) ? variation.media.length > 0 : !!variation.media) ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              {(Array.isArray(variation.media)
                                ? variation.media
                                : variation.media
                                  ? [{ distance: "", isVideo: false, type: "", url: variation.media }]
                                  : []
                              )
                                .slice(0, 4)
                                .map((mediaItem, mediaIndex) => (
                                  <div key={mediaIndex} className="relative group">
                                    <img
                                      src={mediaItem.url || "/placeholder.svg"}
                                      alt={`${variation.name} ${mediaIndex + 1}`}
                                      className="w-full h-16 object-cover rounded border"
                                      onError={(e) => {
                                        e.currentTarget.src = "/placeholder.svg?height=64&width=64"
                                      }}
                                    />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => removeVariationImage(variation.id, mediaIndex)}
                                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="w-2 h-2" />
                                    </Button>
                                  </div>
                                ))}
                            </div>
                            {(Array.isArray(variation.media) ? variation.media.length : variation.media ? 1 : 0) >
                              4 && (
                              <p className="text-xs text-gray-500">
                                +
                                {(Array.isArray(variation.media) ? variation.media.length : variation.media ? 1 : 0) -
                                  4}{" "}
                                more images
                              </p>
                            )}
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => handleVariationImageUpload(variation.id, e)}
                              className="hidden"
                              id={`variation-upload-${variation.id}`}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById(`variation-upload-${variation.id}`)?.click()}
                              disabled={uploading}
                              className="w-full text-xs"
                            >
                              Add More Images
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            </div>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => handleVariationImageUpload(variation.id, e)}
                              className="hidden"
                              id={`variation-upload-${variation.id}`}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById(`variation-upload-${variation.id}`)?.click()}
                              disabled={uploading}
                              className="w-full text-xs"
                            >
                              {uploading ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <ImageIcon className="w-3 h-3 mr-1" />
                                  Add Images
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-xl font-semibold text-gray-900">Others</h2>
              <p className="text-sm text-gray-600 mt-1">Additional product information and settings</p>
            </div>

            {/* Availability Type */}
            <div className="space-y-4">
              <Label className="text-base font-medium">
                Availability <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-3">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="availability_type"
                    value="stock"
                    checked={formData.availability_type === "stock"}
                    onChange={handleInputChange}
                    className="text-red-500 focus:ring-red-500"
                  />
                  <div>
                    <span className="text-gray-700">On Stock</span>
                  </div>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="availability_type"
                    value="pre_order"
                    checked={formData.availability_type === "pre_order"}
                    onChange={handleInputChange}
                    className="text-red-500 focus:ring-red-500"
                  />
                  <div>
                    <span className="text-gray-700">Pre-Order</span>
                  </div>
                </label>
              </div>

              {formData.availability_type === "pre_order" && (
                <div>
                  <Label htmlFor="pre_order_days">
                    Delivery Days for Pre-Order <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pre_order_days"
                    name="pre_order_days"
                    type="number"
                    value={formData.pre_order_days}
                    onChange={handleInputChange}
                    placeholder="Number of days to deliver"
                    className={
                      error && formData.availability_type === "pre_order" && !formData.pre_order_days.trim()
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }
                    required
                  />
                  {error && formData.availability_type === "pre_order" && !formData.pre_order_days.trim() && (
                    <p className="text-red-500 text-xs mt-1">Delivery days is required for per order items</p>
                  )}
                </div>
              )}
            </div>

            {/* Condition */}
            <div>
              <Label htmlFor="condition" className="text-sm font-medium text-gray-700 mb-2 block">
                Condition <span className="text-red-500">*</span>
              </Label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  error && !formData.condition.trim() ? "border-red-300" : "border-gray-300"
                }`}
                required
              >
                <option value="">Select condition</option>
                <option value="new">New</option>
                <option value="used">Used</option>
              </select>
              {error && !formData.condition.trim() && (
                <p className="text-red-500 text-xs mt-1">Please select a condition</p>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <DashboardLayout activeItem="products">
      {/* Animated Success Message */}
      <AnimatedSuccessMessage show={showSuccessAnimation} message={successMessage} isVisible={isSuccessVisible} />

      <div className="max-w-7xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => window.history.back()} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
        </div>

        {/* Main Content - Responsive Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Steps */}
          <div className="w-full lg:w-80 xl:w-96">
            {/* Mobile: Horizontal scrollable steps */}
            <div className="lg:hidden bg-white rounded-lg shadow-sm border p-4 mb-4">
              <div className="flex space-x-4 overflow-x-auto pb-2">
                {STEPS.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => goToStep(step.id)}
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
                    Step {currentStep} of {STEPS.length}
                  </span>
                  <span>{Math.round((currentStep / STEPS.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Desktop: Vertical sidebar */}
            <div className="hidden lg:block bg-white rounded-lg shadow-sm border p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Product Update Steps</h3>

              <div className="space-y-3">
                {STEPS.map((step, index) => (
                  <div key={step.id} className="relative">
                    <button
                      onClick={() => goToStep(step.id)}
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
                          <p
                            className={`text-sm font-medium ${
                              currentStep === step.id ? "text-red-600" : "text-gray-900"
                            }`}
                          >
                            {step.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 hidden xl:block">{step.description}</p>
                        </div>
                      </div>
                    </button>
                    {/* Connector line for desktop */}
                    {index < STEPS.length - 1 && <div className="absolute left-7 top-14 w-0.5 h-4 bg-gray-200" />}
                  </div>
                ))}
              </div>

              {/* Desktop Progress Summary */}
              <div className="mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-2">
                    Progress: {currentStep} of {STEPS.length}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Form */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border">
            <div className="p-6 text-left">
              {/* Error and Success Messages */}
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-6 border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              {/* Step Content */}
              <div className="min-h-[500px]">{renderStepContent()}</div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center p-6 lg:p-8 border-t bg-gray-50 rounded-b-lg gap-3 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800 order-2 sm:order-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>

              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-red-500 hover:bg-red-600 text-white flex items-center justify-center space-x-2 px-6 order-1 sm:order-2"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 order-1 sm:order-2">
                  <Button
                    type="button"
                    onClick={() => handleSubmit(true)}
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
                  <Button
                    type="button"
                    onClick={() => handleSubmit(false)}
                    disabled={loading}
                    className="bg-green-500 hover:bg-green-600 text-white flex items-center justify-center space-x-2 px-6"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <UploadIcon className="w-4 h-4" />
                        <span>Update Product</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
