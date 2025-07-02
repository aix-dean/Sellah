"use client"

import type React from "react"
import type { ReactElement } from "react"
import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, ArrowLeft, Loader2, ImageIcon, FileVideo, Building2, AlertCircle } from "lucide-react"
import DashboardLayout from "./dashboard-layout"
import { useAnimatedSuccess } from "@/hooks/use-animated-success"
import { AnimatedSuccessMessage } from "./animated-success-message"
import { useUserData } from "@/hooks/use-user-data"
import {
  type ProductFormData,
  type CompanyData,
  STEPS,
  UNIT_OPTIONS,
  validateStep,
  StepNavigation,
  CategorySelection,
  VariationItem,
  NavigationButtons,
} from "./product-form-shared"

import { useRouter } from "next/navigation"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

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

export default function AddProductPage(): ReactElement {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({})
  const [generalError, setGeneralError] = useState("")
  const [success, setSuccess] = useState("")
  const [showCompanyModal, setShowCompanyModal] = useState(false)
  const [savingCompany, setSavingCompany] = useState(false)
  const [categoryNames, setCategoryNames] = useState<{ [key: string]: string }>({})
  const [isInitialized, setIsInitialized] = useState(false)
  const [collapsedVariations, setCollapsedVariations] = useState<Set<string>>(new Set())
  const [currentStepValid, setCurrentStepValid] = useState(true)

  // Use real authentication and data hooks
  const { currentUser, userData, loading: userLoading } = useUserData()
  const [categories, setCategories] = useState<any[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)

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
    per_order_days: "",
    payment_methods: {
      ewallet: false,
      bank_transfer: false,
      gcash: false,
      maya: false,
      manual: true, // Add this line
    },
    variations: [],
  })

  const [companyData, setCompanyData] = useState<CompanyData>({
    name: "",
    address_street: "",
    address_city: "",
    address_province: "",
    website: "",
  })

  // Use the animated success hook
  const { showSuccessAnimation, successMessage, isSuccessVisible, showAnimatedSuccess } = useAnimatedSuccess()

  const router = useRouter()

  // Initialize component
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  // Update category names when categories load
  useEffect(() => {
    if (categories && categories.length > 0) {
      const nameMap: { [key: string]: string } = {}
      categories.forEach((category) => {
        nameMap[category.id] = category.name
      })
      setCategoryNames(nameMap)
    }
  }, [categories])

  const fetchCategories = useFetchCategories()

  // Add this useEffect after the existing useEffects:
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

  // Add validation effect to check current step whenever form data changes
  useEffect(() => {
    const validation = validateStep(currentStep, formData)
    setCurrentStepValid(validation.isValid)

    // Update field errors only if there are validation errors
    if (!validation.isValid) {
      setFieldErrors(validation.errors)
    } else {
      // Clear field errors when step becomes valid
      setFieldErrors({})
    }
  }, [currentStep, formData])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))

      // Clear field error when user starts typing
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

  const handleCompanyInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCompanyData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }, [])

  const handleCategoryChange = useCallback((categoryId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      categories: checked ? [...prev.categories, categoryId] : prev.categories.filter((id) => id !== categoryId),
    }))
  }, [])

  const handleDeliveryOptionChange = useCallback((option: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      delivery_options: {
        ...prev.delivery_options,
        [option]: checked,
      },
    }))
  }, [])

  const handleDeliveryNoteChange = useCallback((option: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      delivery_options: {
        ...prev.delivery_options,
        [`${option}_note`]: value,
      },
    }))
  }, [])

  const handlePaymentMethodChange = useCallback((method: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      payment_methods: {
        ...prev.payment_methods,
        [method]: checked,
      },
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
      media: null, // Initialize as null string
    }
    setFormData((prev) => ({
      ...prev,
      variations: [...prev.variations, newVariation],
    }))
  }, [])

  const removeVariation = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      variations: prev.variations.filter((variation) => variation.id !== id),
    }))
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

      // Only take the first file for single media
      const file = files[0]

      setUploading(true)
      setGeneralError("")

      try {
        const url = await uploadFileToFirebaseStorage(file)

        setFormData((prev) => ({
          ...prev,
          variations: prev.variations.map((variation) =>
            variation.id === variationId
              ? {
                  ...variation,
                  images: [file], // Replace with single file
                  media: url, // Store just the URL string
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
    [showAnimatedSuccess],
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

        const uploadPromises = files.map(async (file) => {
          const url = await uploadFileToFirebaseStorage(file)
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
    [showAnimatedSuccess],
  )

  const handleVideoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Check if a video already exists
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

        const url = await uploadFileToFirebaseStorage(file)

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
    [showAnimatedSuccess],
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
        newMedia.splice(mediaIndexToRemove, 1)
      }
      newImages.splice(index, 1)

      return {
        ...prev,
        product_images: newImages,
        media: newMedia,
      }
    })
  }, [])

  const removeVideo = useCallback(() => {
    setFormData((prev) => {
      const newMedia = prev.media.filter((item) => !item.isVideo)

      return {
        ...prev,
        product_video: null,
        media: newMedia,
      }
    })
  }, [])

  const retryLoadCategories = useCallback(async () => {
    setCategoriesLoading(true)
    setCategoriesError(null)

    try {
      const fetchedCategories = await fetchCategories()
      setCategories(fetchedCategories)
    } catch (error) {
      console.error("Failed to retry loading categories:", error)
      setCategoriesError("Failed to load categories. Please try again.")
    } finally {
      setCategoriesLoading(false)
    }
  }, [fetchCategories])

  const uploadFileToFirebaseStorage = async (file: File): Promise<string> => {
    try {
      const { getStorage, ref, uploadBytes, getDownloadURL } = await import("firebase/storage")
      const { storage } = await import("@/lib/firebase")

      const storageRef = ref(storage, `products/${currentUser?.uid}/${Date.now()}-${file.name}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)
      return downloadURL
    } catch (error) {
      console.error("Error uploading file to Firebase Storage:", error)
      setGeneralError("Failed to upload file. Please try again.")
      throw error
    }
  }

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

  const goToStep = (step: number) => {
    setCurrentStep(step)
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  // Update the nextStep function to validate before proceeding
  const nextStep = () => {
    const validation = validateStep(currentStep, formData)
    if (validation.isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
      setFieldErrors({}) // Clear errors when moving to next step
      setGeneralError("") // Clear general error
    } else {
      setFieldErrors(validation.errors)
      setGeneralError("Please fill in all required fields before proceeding.")
    }
  }

  // Update the handleSubmit function to validate all steps
  const handleSubmit = async (isDraft: boolean) => {
    setLoading(true)
    setFieldErrors({})
    setGeneralError("")
    setSuccess("")

    try {
      // Validate current step first
      const currentStepValidation = validateStep(currentStep, formData)
      if (!currentStepValidation.isValid) {
        setFieldErrors(currentStepValidation.errors)
        setGeneralError("Please correct the errors in this step.")
        return
      }

      // Validate all steps if submitting (not draft)
      if (!isDraft) {
        for (let i = 1; i <= STEPS.length; i++) {
          const stepValidation = validateStep(i, formData)
          if (!stepValidation.isValid) {
            setCurrentStep(i) // Go to the step with errors
            setFieldErrors(stepValidation.errors)
            setGeneralError(`Please correct the errors in step ${i} (${STEPS[i - 1].title}) before submitting.`)
            return
          }
        }
      }

      if (!currentUser) {
        setGeneralError("You must be logged in to add products.")
        return
      }

      if (!userData?.company_id) {
        setGeneralError("Company information is required to add products. Please complete your company profile first.")
        setShowCompanyModal(true)
        return
      }

      // Prepare product data for Firestore
      const productData = {
        name: formData.name,
        description: formData.description,
        categories: formData.categories,
        unit: formData.unit,
        delivery_options: formData.delivery_options,
        media: formData.media,
        delivery_days: formData.delivery_days || "",
        condition: formData.condition,
        availability_type: formData.availability_type,
        per_order_days: formData.per_order_days || "",
        payment_methods: {
          ...formData.payment_methods,
          manual: true, // Force manual to true
        },
        variations: formData.variations.map((variation) => ({
          id: variation.id,
          name: variation.name,
          color: variation.color || "",
          weight: variation.weight || "",
          height: variation.height || "",
          length: variation.length || "",
          price: Number.parseFloat(variation.price) || 0,
          stock: Number.parseInt(variation.stock) || 0,
          media: variation.media || null,
          sku: `${formData.name.substring(0, 3).toUpperCase()}-${variation.name.substring(0, 3).toUpperCase()}-${Date.now()}`,
        })),
        seller_id: currentUser.uid,
        created_by: currentUser.uid,
        company_id: userData.company_id, // Add company_id from user data
        type: "MERCHANDISE",
        status: isDraft ? "draft" : "published",
        active: !isDraft,
        deleted: false,
        views: 0,
        likes: 0,
        sales: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      }

      // Save to Firestore
      const docRef = await addDoc(collection(db, "products"), productData)
      console.log("Product saved with ID: ", docRef.id)
      console.log("Company ID included: ", userData.company_id)

      // Show success message
      if (!isDraft) {
        showAnimatedSuccess("Product saved and published successfully!")
        // Wait for animation then redirect
        setTimeout(() => {
          router.push("/dashboard/products")
        }, 2000)
      } else {
        showAnimatedSuccess("Product saved as draft!")
        // Reset form for draft
        setFormData({
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
          per_order_days: "",
          payment_methods: {
            ewallet: false,
            bank_transfer: false,
            gcash: false,
            maya: false,
            manual: true,
          },
          variations: [],
        })
        setCurrentStep(1)
      }
    } catch (error) {
      console.error("Error saving product:", error)
      setGeneralError("Failed to save product. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingCompany(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Close modal and show success message
      setShowCompanyModal(false)
      showAnimatedSuccess("Company information saved successfully!")
    } catch (error) {
      console.error("Error saving company information:", error)
      setGeneralError("Failed to save company information. Please try again.")
    } finally {
      setSavingCompany(false)
    }
  }

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <DashboardLayout activeItem="products">
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            <p className="text-gray-600">Initializing add product page...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Add validation indicator at the top of each step
  const renderStepContent = () => {
    const validation = validateStep(currentStep, formData)
    const hasErrors = !validation.isValid

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">Product Details</h2>
              {hasErrors && (
                <div className="flex items-center text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  <span>Required fields missing</span>
                </div>
              )}
            </div>

            <div className="space-y-4 sm:space-y-6">
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
                  className={`w-full text-sm sm:text-base ${fieldErrors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                  required
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                    {fieldErrors.name}
                  </p>
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
                  placeholder="Enter product description"
                  rows={3}
                  className={`w-full text-sm sm:text-base resize-none sm:resize-y ${fieldErrors.description ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                  required
                />
                {fieldErrors.description && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                    {fieldErrors.description}
                  </p>
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
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
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
                <p>No variations added. Pricing will be handled in the final step.</p>
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">Shipping</h2>

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
                    <div>
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
                    name="availability_type"
                    value="stock"
                    checked={formData.availability_type === "stock"}
                    onChange={handleInputChange}
                    className="text-red-500 focus:ring-red-500"
                  />
                  <span className="text-gray-700">On Stock</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="availability_type"
                    value="per_order"
                    checked={formData.availability_type === "per_order"}
                    onChange={handleInputChange}
                    className="text-red-500 focus:ring-red-500"
                  />
                  <span className="text-gray-700">Per Order</span>
                </label>
              </div>

              {formData.availability_type === "per_order" && (
                <div>
                  <Label htmlFor="per_order_days">Delivery Days for Per Order *</Label>
                  <Input
                    id="per_order_days"
                    name="per_order_days"
                    type="number"
                    value={formData.per_order_days}
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
  }

  return (
    <DashboardLayout activeItem="products">
      {/* Animated Success Message */}
      <AnimatedSuccessMessage show={showSuccessAnimation} message={successMessage} isVisible={isSuccessVisible} />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => window.history.back()} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Add New Product</h1>
        </div>

        {/* Main Content - Responsive Layout */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Left Sidebar - Steps */}
          <div className="w-full lg:w-80 xl:w-96">
            <StepNavigation currentStep={currentStep} steps={STEPS} />
          </div>

          {/* Right Content - Form */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border">
            <div className="p-4 sm:p-6">
              {/* Error and Success Messages */}
              {generalError && (
                <Alert variant="destructive" className="mb-4 sm:mb-6">
                  <AlertDescription className="text-sm">{generalError}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-4 sm:mb-6 border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800 text-sm">{success}</AlertDescription>
                </Alert>
              )}

              {/* Step Content */}
              <div className="min-h-[400px] sm:min-h-[500px]">{renderStepContent()}</div>
            </div>

            <NavigationButtons
              currentStep={currentStep}
              totalSteps={STEPS.length}
              loading={loading}
              canProceed={currentStepValid} // Add this prop
              onPrevious={prevStep}
              onNext={nextStep}
              onSaveDraft={() => handleSubmit(true)}
              onSubmit={() => handleSubmit(false)}
              submitLabel="Save & Publish"
              isEdit={false}
            />
          </div>
        </div>
      </div>

      {/* Company Information Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-900">Company Information Required</h3>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-6">
                To add products, we need your company information first. Please fill out the details below.
              </p>

              <form onSubmit={handleCompanySubmit} className="space-y-4">
                <div>
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    name="name"
                    value={companyData.name}
                    onChange={handleCompanyInputChange}
                    placeholder="Enter company name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="address_street">Street Address</Label>
                  <Input
                    id="address_street"
                    name="address_street"
                    value={companyData.address_street}
                    onChange={handleCompanyInputChange}
                    placeholder="Enter street address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="address_city">City</Label>
                    <Input
                      id="address_city"
                      name="address_city"
                      value={companyData.address_city}
                      onChange={handleCompanyInputChange}
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address_province">Province</Label>
                    <Input
                      id="address_province"
                      name="address_province"
                      value={companyData.address_province}
                      onChange={handleCompanyInputChange}
                      placeholder="Enter province"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="website">Website (optional)</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    value={companyData.website}
                    onChange={handleCompanyInputChange}
                    placeholder="https://www.example.com"
                  />
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={savingCompany}
                    className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto"
                  >
                    {savingCompany ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Building2 className="w-4 h-4 mr-2" />
                        Save Company Info
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
