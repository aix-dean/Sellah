"use client"

import type React from "react"
import type { ReactElement } from "react"
import { useState, useCallback, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, ArrowLeft, Loader2, ImageIcon, FileVideo, AlertCircle, Shield, Lock } from "lucide-react"
import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
} from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { db } from "@/lib/firebase"
import DashboardLayout from "./dashboard-layout"
import { useUserData } from "@/hooks/use-user-data"
import { useAnimatedSuccess } from "@/hooks/use-animated-success"
import { AnimatedSuccessMessage } from "./animated-success-message"
import { useProducts } from "@/hooks/use-products"
import { firestoreCache } from "@/hooks/use-firestore-cache"
import { Badge } from "@/components/ui/badge"
import {
  type ProductFormData,
  STEPS,
  UNIT_OPTIONS,
  validateStep,
  StepNavigation,
  CategorySelection,
  VariationItem,
  NavigationButtons,
} from "./product-form-shared"

export default function AddProductPage(): ReactElement {
  // ALL HOOKS MUST BE CALLED FIRST - NO CONDITIONAL LOGIC BEFORE THIS POINT

  // State hooks
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({})
  const [generalError, setGeneralError] = useState("")
  const [success, setSuccess] = useState("")
  const [categoryNames, setCategoryNames] = useState<{ [key: string]: string }>({})
  const [collapsedVariations, setCollapsedVariations] = useState<Set<string>>(new Set())
  const [currentStepValid, setCurrentStepValid] = useState(true)
  const [categories, setCategories] = useState<any[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [checkingLimits, setCheckingLimits] = useState(true)
  const [productLimitInfo, setProductLimitInfo] = useState<{
    canAdd: boolean
    currentCount: number
    limit: number
    status: string
    message?: string
  } | null>(null)

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
      couriers: {
        lalamove: false,
        transportify: false,
      },
    },
    product_images: [],
    product_video: null,
    media: [],
    delivery_days: "",
    condition: "",
    is_pre_order: false,
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

  // Custom hooks
  const { currentUser, userData, loading: userLoading, error: userError } = useUserData()
  const { invalidateProducts } = useProducts(currentUser?.uid)
  const { showSuccessAnimation, successMessage, isSuccessVisible, showAnimatedSuccess } = useAnimatedSuccess()

  // All callback functions
  const checkProductLimits = useCallback(async () => {
    if (!currentUser || !userData) return

    try {
      setCheckingLimits(true)
      const currentCount = userData.product_count || 0
      let limit = 1
      let canAdd = false
      let message = ""
      const userStatus = userData.status || "UNKNOWN"

      switch (userStatus) {
        case "VERIFIED":
          limit = Number.POSITIVE_INFINITY
          canAdd = true
          break
        case "BASIC":
          limit = 5
          canAdd = currentCount < limit
          if (!canAdd) {
            message = `You have reached the maximum of ${limit} products for BASIC status. Upgrade to VERIFIED status for unlimited products.`
          }
          break
        case "INCOMPLETE":
          limit = 5
          canAdd = currentCount < limit
          if (!canAdd) {
            message = `You have reached the maximum of ${limit} products for INCOMPLETE status. Complete your verification to increase your limit.`
          }
          break
        default:
          limit = 1
          canAdd = currentCount < limit
          if (!canAdd) {
            message = `You have reached the maximum of ${limit} product for new accounts. Complete your profile to upgrade to BASIC status and create up to 5 products.`
          }
          break
      }

      setProductLimitInfo({
        canAdd,
        currentCount,
        limit,
        status: userStatus,
        message,
      })
    } catch (error) {
      console.error("Error checking product limits:", error)
      setProductLimitInfo({
        canAdd: false,
        currentCount: 0,
        limit: 0,
        status: "ERROR",
        message: "Failed to check product limits. Please try again.",
      })
    } finally {
      setCheckingLimits(false)
    }
  }, [currentUser, userData])

  const fetchCategories = useCallback(async () => {
    try {
      const categoriesRef = collection(db, "categories")
      const q = query(
        categoriesRef,
        where("type", "==", "MERCHANDISE"),
        where("active", "==", true),
        where("deleted", "==", false),
        orderBy("name", "asc"),
      )
      const querySnapshot = await getDocs(q)
      const fetchedCategories: any[] = []
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
      return fetchedCategories
    } catch (error) {
      throw error
    }
  }, [])

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

  const getStoragePathFromUrl = useCallback((url: string): string | null => {
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
  }, [])

  const deleteFileFromStorage = useCallback(
    async (url: string): Promise<boolean> => {
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
    },
    [getStoragePathFromUrl],
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
      if (fieldErrors[name]) {
        setFieldErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[name]
          return newErrors
        })
      }
    },
    [fieldErrors],
  )

  const handleCategoryChange = useCallback(
    (categoryId: string, checked: boolean) => {
      setFormData((prev) => ({
        ...prev,
        categories: checked ? [...prev.categories, categoryId] : prev.categories.filter((id) => id !== categoryId),
      }))
      if (generalError) setGeneralError("")
    },
    [generalError],
  )

  const handleDeliveryOptionChange = useCallback(
    (option: string, checked: boolean) => {
      setFormData((prev) => {
        const newDeliveryOptions = {
          ...prev.delivery_options,
          [option]: checked,
        }

        if (option === "delivery" && !checked) {
          newDeliveryOptions.couriers = {
            lalamove: false,
            transportify: false,
          }
        }

        return {
          ...prev,
          delivery_options: newDeliveryOptions,
        }
      })
      if (generalError) setGeneralError("")
    },
    [generalError],
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
      if (generalError) setGeneralError("")
    },
    [generalError],
  )

  const handleCourierChange = useCallback((courier: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      delivery_options: {
        ...prev.delivery_options,
        couriers: {
          ...prev.delivery_options.couriers,
          [courier]: checked,
        },
      },
    }))
  }, [])

  const toggleVariationCollapse = useCallback((variationId: string) => {
    setCollapsedVariations((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(variationId)) {
        newSet.delete(variationId)
      } else {
        newSet.add(variationId)
      }
      return newSet
    })
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
      media: null,
    }
    setFormData((prev) => ({
      ...prev,
      variations: [...prev.variations, newVariation],
    }))
    setCollapsedVariations((prev) => {
      const newSet = new Set(prev)
      newSet.delete(newVariation.id)
      return newSet
    })
  }, [])

  const removeVariation = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      variations: prev.variations.filter((variation) => variation.id !== id),
    }))
    setCollapsedVariations((prev) => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
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

  const handleVariationImageUpload = useCallback(
    async (variationId: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length === 0) return

      const file = files[0]
      setUploading(true)
      setGeneralError("")

      try {
        const path = `products/${currentUser?.uid}/variations/${variationId}/${Date.now()}_${file.name.split(".").pop()}`
        const url = await uploadFileToStorage(file, path)

        setFormData((prev) => ({
          ...prev,
          variations: prev.variations.map((variation) =>
            variation.id === variationId
              ? {
                  ...variation,
                  images: [file],
                  media: url,
                }
              : variation,
          ),
        }))

        showAnimatedSuccess("Variation image uploaded successfully!")
      } catch (error) {
        console.error("Error uploading variation image:", error)
        setGeneralError("Failed to upload variation image. Please try again.")
      } finally {
        setUploading(false)
      }
    },
    [currentUser?.uid, uploadFileToStorage, showAnimatedSuccess],
  )

  const removeVariationImage = useCallback((variationId: string) => {
    setFormData((prev) => ({
      ...prev,
      variations: prev.variations.map((variation) =>
        variation.id === variationId
          ? {
              ...variation,
              images: [],
              media: null,
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
      setGeneralError("")

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
        setGeneralError("Failed to upload images. Please try again.")
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

      const existingVideo = formData.media.find((item) => item.isVideo)
      if (existingVideo) {
        setGeneralError("Only one video can be uploaded per product. Please remove the existing video first.")
        return
      }

      setUploading(true)
      setGeneralError("")

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
        setGeneralError("Failed to upload video. Please try again.")
      } finally {
        setUploading(false)
      }
    },
    [currentUser?.uid, uploadFileToStorage, showAnimatedSuccess, formData.media],
  )

  const removeImage = useCallback(
    (index: number) => {
      setFormData((prev) => {
        const newImages = [...prev.product_images]
        const newMedia = [...prev.media]

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
    },
    [deleteFileFromStorage],
  )

  const removeVideo = useCallback(() => {
    setFormData((prev) => {
      const videoItem = prev.media.find((item) => item.isVideo)
      if (videoItem) {
        deleteFileFromStorage(videoItem.url)
      }

      const newMedia = prev.media.filter((item) => !item.isVideo)

      return {
        ...prev,
        product_video: null,
        media: newMedia,
      }
    })
  }, [deleteFileFromStorage])

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step)
  }, [])

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }, [])

  const nextStep = useCallback(() => {
    const validation = validateStep(currentStep, formData)
    if (validation.isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
      setFieldErrors({})
      setGeneralError("")
    } else {
      setFieldErrors(validation.errors)
      setGeneralError("Please fill in all required fields before proceeding.")
    }
  }, [currentStep, formData])

  const handleSubmit = useCallback(
    async (isDraft = false) => {
      if (!currentUser) {
        setGeneralError("You must be logged in to create a product.")
        return
      }

      if (!productLimitInfo?.canAdd) {
        setGeneralError(productLimitInfo?.message || "You have reached your product limit.")
        return
      }

      if (!isDraft) {
        for (let i = 1; i <= STEPS.length; i++) {
          const stepValidation = validateStep(i, formData)
          if (!stepValidation.isValid) {
            setCurrentStep(i)
            setFieldErrors(stepValidation.errors)
            setGeneralError(`Please correct the errors in step ${i} (${STEPS[i - 1].title}) before submitting.`)
            return
          }
        }
      }

      if (!userData?.company_id) {
        setGeneralError("Company information is required. Please set up your company profile first.")
        return
      }

      setLoading(true)
      setGeneralError("")

      try {
        const deliveryOptions = {
          ...formData.delivery_options,
          couriers: formData.delivery_options.delivery
            ? formData.delivery_options.couriers
            : { lalamove: false, transportify: false },
        }

        const productData = {
          name: formData.name,
          description: formData.description,
          deleted: false,
          categories: formData.categories,
          unit: formData.unit,
          price: formData.variations.length > 0 ? 0 : 0,
          delivery_options: deliveryOptions,
          condition: formData.condition,
          is_pre_order: formData.is_pre_order,
          availability_type: formData.is_pre_order ? "pre_order" : "stock",
          pre_order_days: formData.is_pre_order ? Number.parseInt(formData.pre_order_days) || 0 : null,
          payment_methods: {
            ...formData.payment_methods,
            manual: true,
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
          created: serverTimestamp(),
          updated: serverTimestamp(),
          created_by: currentUser.uid,
          updated_by: currentUser.uid,
        }

        const productsRef = collection(db, "products")
        await addDoc(productsRef, productData)

        const userRef = doc(db, "iboard_users", currentUser.uid)
        await updateDoc(userRef, {
          product_count: increment(1),
        })

        showAnimatedSuccess(isDraft ? "Product saved as draft!" : "Product created successfully!")

        invalidateProducts()
        firestoreCache.invalidate(`products_${currentUser.uid}`)

        setTimeout(() => {
          window.location.href = "/dashboard/products"
        }, 2000)
      } catch (error) {
        console.error("Error creating product:", error)

        let errorMessage = "Failed to create product. "

        if (error.code === "permission-denied") {
          errorMessage += "You don't have permission to create products. Please check your account permissions."
        } else if (error.code === "auth/network-request-failed") {
          errorMessage += "Network connection failed. Please check your internet connection and try again."
        } else if (error.code === "storage/unauthorized") {
          errorMessage += "File upload failed due to insufficient permissions. Please contact support."
        } else if (error.message) {
          errorMessage += error.message
        } else {
          errorMessage += "Please try again or contact support if the problem persists."
        }

        setGeneralError(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    [currentUser, userData, formData, showAnimatedSuccess, invalidateProducts, productLimitInfo],
  )

  // All useEffect hooks
  useEffect(() => {
    if (currentUser && userData) {
      checkProductLimits()
    }
  }, [currentUser, userData, checkProductLimits])

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

  useEffect(() => {
    if (categories && categories.length > 0) {
      const nameMap: { [key: string]: string } = {}
      categories.forEach((category) => {
        nameMap[category.id] = category.name
      })
      setCategoryNames(nameMap)
    }
  }, [categories])

  useEffect(() => {
    const validation = validateStep(currentStep, formData)
    setCurrentStepValid(validation.isValid)

    if (!validation.isValid) {
      setFieldErrors(validation.errors)
    } else {
      setFieldErrors({})
    }
  }, [currentStep, formData])

  // Memoized step content renderer
  const renderStepContent = useMemo(() => {
    const validation = validateStep(currentStep, formData)
    const hasErrors = !validation.isValid

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Product Details</h2>
              {hasErrors && (
                <div className="flex items-center text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  <span>Required fields missing</span>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block text-left">
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  className={`w-full ${fieldErrors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300"}`}
                  required
                />
                {fieldErrors.name && (
                  <div className="mt-1 flex items-center text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span>{fieldErrors.name}</span>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2 block text-left">
                  Product Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter product description"
                  rows={4}
                  className={`w-full resize-none ${fieldErrors.description ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300"}`}
                  required
                />
                {fieldErrors.description && (
                  <div className="mt-1 flex items-center text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span>{fieldErrors.description}</span>
                  </div>
                )}
              </div>

              <CategorySelection
                categories={categories}
                selectedCategories={formData.categories}
                onCategoryChange={handleCategoryChange}
                loading={categoriesLoading}
                error={categoriesError}
                fieldError={fieldErrors.categories}
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Specification</h2>
              {hasErrors && (
                <div className="flex items-center text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  <span>Required fields missing</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="unit">Unit *</Label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  fieldErrors.unit ? "border-red-500" : ""
                }`}
                required
              >
                {UNIT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {fieldErrors.unit && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                  {fieldErrors.unit}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">
                    Product Variations <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">Add at least one variation to proceed</p>
                </div>
                <Button
                  type="button"
                  onClick={addVariation}
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent"
                >
                  Add Variation
                </Button>
              </div>

              {fieldErrors.variations && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{fieldErrors.variations}</span>
                </div>
              )}

              {formData.variations.map((variation, index) => (
                <VariationItem
                  key={variation.id}
                  variation={variation}
                  index={index}
                  isCollapsed={collapsedVariations.has(variation.id)}
                  onToggleCollapse={() => toggleVariationCollapse(variation.id)}
                  onRemove={() => removeVariation(variation.id)}
                  onUpdate={(field, value) => updateVariation(variation.id, field, value)}
                  onUpdatePriceStock={(field, value) => updateVariationPriceStock(variation.id, field, value)}
                  onImageUpload={(e) => handleVariationImageUpload(variation.id, e)}
                  onRemoveImage={() => removeVariationImage(variation.id)}
                  uploading={uploading}
                  fieldErrors={fieldErrors}
                  showPricing={currentStep === 3}
                  showMedia={currentStep === 5}
                  unit={formData.unit}
                />
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">Sales Information</h2>

            {formData.variations.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-700">Variation Pricing & Stock</h3>
                <p className="text-sm text-gray-600">Set the price and stock quantity for each variation.</p>

                <div className="space-y-4">
                  {formData.variations.map((variation, index) => (
                    <div key={variation.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-gray-800">{variation.name || `Variation ${index + 1}`}</h4>
                          <p className="text-sm text-gray-500">
                            {formData.unit.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                            {variation.color && ` • Color: ${variation.color}`}
                            {variation.weight && ` • Weight: ${variation.weight}kg`}
                            {variation.height && ` • Height: ${variation.height}cm`}
                            {variation.length && ` • Length: ${variation.length}cm`}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`variation-price-${variation.id}`}>Price (₱) *</Label>
                          <Input
                            id={`variation-price-${variation.id}`}
                            type="number"
                            step="0.01"
                            value={variation.price}
                            onChange={(e) => updateVariationPriceStock(variation.id, "price", e.target.value)}
                            placeholder="0.00"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor={`variation-stock-${variation.id}`}>Stock Quantity *</Label>
                          <Input
                            id={`variation-stock-${variation.id}`}
                            type="number"
                            value={variation.stock}
                            onChange={(e) => updateVariationPriceStock(variation.id, "stock", e.target.value)}
                            placeholder="0"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No variations added. Please add at least one variation in the previous step.</p>
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Shipping</h2>
              {hasErrors && (
                <div className="flex items-center text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  <span>Required fields missing</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">Delivery Options * (Select at least one)</Label>

              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <label className="flex items-center space-x-2 cursor-pointer mb-3 select-none">
                    <input
                      type="checkbox"
                      checked={formData.delivery_options.delivery}
                      onChange={(e) => handleDeliveryOptionChange("delivery", e.target.checked)}
                      className="rounded border-gray-300 text-red-500 focus:ring-red-500"
                    />
                    <span className="font-medium text-gray-700">Delivery</span>
                  </label>

                  {formData.delivery_options.delivery && (
                    <div className="ml-6 space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Select Courier * (Choose at least one)
                        </Label>
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={formData.delivery_options.couriers?.lalamove || false}
                              onChange={(e) => handleCourierChange("lalamove", e.target.checked)}
                              className="rounded border-gray-300 text-red-500 focus:ring-red-500"
                            />
                            <span className="text-sm text-gray-700">Lalamove</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={formData.delivery_options.couriers?.transportify || false}
                              onChange={(e) => handleCourierChange("transportify", e.target.checked)}
                              className="rounded border-gray-300 text-red-500 focus:ring-red-500"
                            />
                            <span className="text-sm text-gray-700">Transportify</span>
                          </label>
                        </div>
                        {fieldErrors.couriers && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                            {fieldErrors.couriers}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="delivery_note">Delivery Note</Label>
                        <Textarea
                          id="delivery_note"
                          value={formData.delivery_options.delivery_note}
                          onChange={(e) => handleDeliveryNoteChange("delivery", e.target.value)}
                          placeholder="Add delivery instructions, fees, or special conditions..."
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <label className="flex items-center space-x-2 cursor-pointer mb-3 select-none">
                    <input
                      type="checkbox"
                      checked={formData.delivery_options.pickup}
                      onChange={(e) => handleDeliveryOptionChange("pickup", e.target.checked)}
                      className="rounded border-gray-300 text-red-500 focus:ring-red-500"
                    />
                    <span className="font-medium text-gray-700">Pick up</span>
                  </label>
                  {formData.delivery_options.pickup && (
                    <div className="ml-6">
                      <Label htmlFor="pickup_note">Pickup Note</Label>
                      <Textarea
                        id="pickup_note"
                        value={formData.delivery_options.pickup_note}
                        onChange={(e) => handleDeliveryNoteChange("pickup", e.target.value)}
                        placeholder="Add pickup location, hours, or special instructions..."
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Media</h2>

            <div className="flex flex-col xl:flex-row gap-6 xl:gap-8">
              <div className="flex-1 space-y-4 sm:space-y-6">
                <div>
                  <Label className="text-sm sm:text-base font-medium mb-2 sm:mb-3 block">
                    Product Images <span className="text-red-500">*</span> (At least one image required)
                  </Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 sm:p-12 text-center ${
                      fieldErrors.product_images ? "border-red-300 bg-red-50" : "border-gray-300"
                    }`}
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
                      <span className="hidden sm:inline">Drag and drop images here, or </span>
                      <span className="sm:hidden">Tap to </span>
                      <span>click to select</span>
                    </p>
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
                      className="bg-white border-gray-300 text-sm sm:text-base"
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

                  {fieldErrors.product_images && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                      {fieldErrors.product_images}
                    </p>
                  )}

                  {formData.media.filter((item) => !item.isVideo).length > 0 && (
                    <div className="mt-4 sm:mt-6">
                      <h3 className="text-sm sm:text-base font-medium text-gray-800 mb-3">Uploaded Images:</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                        {formData.media
                          .filter((item) => !item.isVideo)
                          .map((mediaItem, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={mediaItem.url || "/placeholder.svg"}
                                alt={`Product ${index + 1}`}
                                className="w-full h-24 sm:h-32 object-cover rounded-lg border"
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
                                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-base font-medium mb-2 sm:mb-3 block">Product Video (Optional)</Label>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload one video to showcase your product (maximum 1 video allowed)
                  </p>

                  {formData.media.find((item) => item.isVideo) ? (
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
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-12 text-center hover:border-gray-400 transition-colors">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FileVideo className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 mb-2 text-sm sm:text-base">Upload a product video (optional)</p>
                      <p className="text-xs text-gray-500 mb-3 sm:mb-4">
                        Maximum 1 video • Supported formats: MP4, MOV, AVI
                      </p>
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
                        className="bg-white border-gray-300 text-sm sm:text-base"
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

              {formData.variations.length > 0 && (
                <div className="w-full xl:w-80 bg-gray-50 rounded-lg p-4 sm:p-6">
                  <h3 className="text-sm sm:text-base font-medium text-gray-800 mb-4">Variation Photos</h3>
                  <div className="space-y-4">
                    {formData.variations.map((variation, index) => (
                      <div key={variation.id} className="bg-white rounded-lg p-3 sm:p-4 border">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                            Variation {index + 1} - {variation.name || "Unnamed"}
                          </h4>
                        </div>

                        {variation.media ? (
                          <div className="space-y-3">
                            <div className="relative group">
                              <img
                                src={variation.media || "/placeholder.svg"}
                                alt={`${variation.name} image`}
                                className="w-full h-16 sm:h-20 object-cover rounded border"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg?height=80&width=80"
                                }}
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeVariationImage(variation.id)}
                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-2 h-2" />
                              </Button>
                            </div>
                            <input
                              type="file"
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
                              Replace Image
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400" />
                            </div>
                            <input
                              type="file"
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
            <h2 className="text-xl font-semibold text-gray-800">Others</h2>

            <div className="space-y-4">
              <Label className="text-base font-medium">Availability *</Label>
              <div className="space-y-3">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="is_pre_order"
                    value="false"
                    checked={!formData.is_pre_order}
                    onChange={() => setFormData((prev) => ({ ...prev, is_pre_order: false }))}
                    className="text-red-500 focus:ring-red-500"
                  />
                  <span className="text-gray-700">In Stock</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="is_pre_order"
                    value="true"
                    checked={formData.is_pre_order}
                    onChange={() => setFormData((prev) => ({ ...prev, is_pre_order: true }))}
                    className="text-red-500 focus:ring-red-500"
                  />
                  <span className="text-gray-700">Pre-Order</span>
                </label>
              </div>

              {formData.is_pre_order && (
                <div>
                  <Label htmlFor="pre_order_days">Delivery Days for Pre-Order *</Label>
                  <Input
                    id="pre_order_days"
                    name="pre_order_days"
                    type="number"
                    value={formData.pre_order_days}
                    onChange={handleInputChange}
                    placeholder="Number of days to deliver"
                    required
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="condition">Condition *</Label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              >
                <option value="">Select condition</option>
                <option value="new">New</option>
                <option value="used">Used</option>
              </select>
            </div>
          </div>
        )

      default:
        return <div>Step content for step {currentStep}</div>
    }
  }, [
    currentStep,
    formData,
    fieldErrors,
    handleInputChange,
    handleCategoryChange,
    categories,
    categoriesLoading,
    categoriesError,
    addVariation,
    collapsedVariations,
    toggleVariationCollapse,
    removeVariation,
    updateVariation,
    updateVariationPriceStock,
    handleVariationImageUpload,
    removeVariationImage,
    uploading,
    handleDeliveryOptionChange,
    handleCourierChange,
    handleDeliveryNoteChange,
    handleImageUpload,
    removeImage,
    handleVideoUpload,
    removeVideo,
  ])

  // NOW WE CAN USE CONDITIONAL RENDERING IN THE RETURN STATEMENT

  // Show loading state while checking limits
  if (userLoading || checkingLimits) {
    return (
      <DashboardLayout activeItem="products">
        <div className="flex items-center justify-center min-h-96">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            <p className="text-gray-600">{userLoading ? "Loading user data..." : "Checking product limits..."}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Show limit reached message if user can't add products
  if (productLimitInfo && !productLimitInfo.canAdd) {
    return (
      <DashboardLayout activeItem="products">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => window.history.back()} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-bold text-gray-800">Add New Product</h1>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
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
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/dashboard/products")}
                  className="flex-1"
                >
                  Back to Products
                </Button>
                <Button onClick={() => (window.location.href = "/dashboard/account")} className="flex-1">
                  <Shield className="h-4 w-4 mr-2" />
                  Complete Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

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

  return (
    <DashboardLayout activeItem="products">
      <AnimatedSuccessMessage show={showSuccessAnimation} message={successMessage} isVisible={isSuccessVisible} />

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => window.history.back()} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Add New Product</h1>
        </div>

        {productLimitInfo && (
          <Alert className="border-blue-200 bg-blue-50">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span className="text-blue-800">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <StepNavigation currentStep={currentStep} steps={STEPS} onStepClick={goToStep} />
          </div>

          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border">
            <div className="p-6 text-left">
              {generalError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription className="text-sm">{generalError}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-6 border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800 text-sm">{success}</AlertDescription>
                </Alert>
              )}

              <div className="min-h-[500px]">{renderStepContent}</div>
            </div>

            <NavigationButtons
              currentStep={currentStep}
              totalSteps={STEPS.length}
              loading={loading}
              canProceed={currentStepValid}
              onPrevious={prevStep}
              onNext={nextStep}
              onSaveDraft={() => handleSubmit(true)}
              onSubmit={() => handleSubmit(false)}
              submitLabel="Create & Publish"
              isEdit={false}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
