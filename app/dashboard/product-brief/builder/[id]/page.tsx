"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Plus,
  Save,
  Eye,
  Trash2,
  GripVertical,
  Type,
  List,
  CheckSquare,
  ChevronDown,
  Calendar,
  Mail,
  Phone,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon, // Renamed to avoid conflict with HTML ImageElement
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUserData } from "@/hooks/use-user-data"
import { useToast } from "@/hooks/use-toast"
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore"
import { db, storage } from "@/lib/firebase" // Import storage
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage" // Import storage functions

interface Question {
  id: string
  type: "text" | "textarea" | "multiple_choice" | "checkbox" | "dropdown" | "email" | "phone" | "date" | "image"
  title: string // keeping for backward compatibility but will be hidden in UI
  description?: string
  required: boolean
  options?: { text: string; imageUrl?: string }[]
  imageUrl?: string // Added for image upload questions
  order: number
}

interface Page {
  id: string
  title: string
  description?: string
  questions: Question[]
  order: number
}

interface FormData {
  id: string
  title: string
  description: string
  pages: Page[] // Changed from questions array to pages array
  isActive: boolean
  theme?: {
    name: string
    primaryColor: string
    secondaryColor: string
    accentColor: string
  }
  linkedProductId?: string
  linkedProductName?: string
}

interface LinkedProduct {
  id: string
  name: string
  description: string
  media?: { url: string }[]
  imageUrls?: string[]
}

const questionTypes = [
  { value: "text", label: "Short Text", icon: Type },
  { value: "textarea", label: "Long Text", icon: Type },
  { value: "multiple_choice", label: "Multiple Choice", icon: List },
  { value: "checkbox", label: "Checkboxes", icon: CheckSquare },
  { value: "dropdown", label: "Dropdown", icon: ChevronDown },
  { value: "email", label: "Email", icon: Mail },
  { value: "phone", label: "Phone", icon: Phone },
  { value: "date", label: "Date", icon: Calendar },
  { value: "image", label: "Image Upload", icon: ImageIcon }, // Added image upload type
]

const uploadImageToFirebase = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

const colorThemes = [
  {
    name: "Ocean Blue",
    primaryColor: "#2563eb", // blue-600
    secondaryColor: "#3b82f6", // blue-500
    accentColor: "#1d4ed8", // blue-700
  },
  {
    name: "Forest Green",
    primaryColor: "#059669", // emerald-600
    secondaryColor: "#10b981", // emerald-500
    accentColor: "#047857", // emerald-700
  },
  {
    name: "Sunset Orange",
    primaryColor: "#ea580c", // orange-600
    secondaryColor: "#f97316", // orange-500
    accentColor: "#c2410c", // orange-700
  },
  {
    name: "Royal Purple",
    primaryColor: "#9333ea", // purple-600
    secondaryColor: "#a855f7", // purple-500
    accentColor: "#7c3aed", // purple-700
  },
  {
    name: "Rose Pink",
    primaryColor: "#e11d48", // rose-600
    secondaryColor: "#f43f5e", // rose-500
    accentColor: "#be123c", // rose-700
  },
  {
    name: "Slate Gray",
    primaryColor: "#475569", // slate-600
    secondaryColor: "#64748b", // slate-500
    accentColor: "#334155", // slate-700
  },
]

export default function FormBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const { userData } = useUserData()
  const { toast } = useToast()

  const [formData, setFormData] = useState<FormData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [currentPageIndex, setCurrentPageIndex] = useState(0) // Added current page tracking
  const [responses, setResponses] = useState<{ [key: string]: any }>({})
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [linkedProduct, setLinkedProduct] = useState<LinkedProduct | null>(null)

  useEffect(() => {
    if (params.id && userData?.company_id) {
      fetchFormData()
    }
  }, [params.id, userData?.company_id])

  useEffect(() => {
    if (formData?.linkedProductId) {
      fetchLinkedProduct(formData.linkedProductId)
    }
  }, [formData?.linkedProductId])

  const fetchLinkedProduct = async (productId: string) => {
    try {
      const docRef = doc(db, "products", productId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        setLinkedProduct({
          id: docSnap.id,
          name: data.name || data.title || "Unnamed Product",
          description: data.description || "No description available",
          media: data.media || [],
          imageUrls: data.imageUrls || [],
        })
      }
    } catch (error) {
      console.error("Error fetching linked product:", error)
    }
  }

  const fetchFormData = async () => {
    try {
      setIsLoading(true)
      const docRef = doc(db, "products_brief", params.id as string)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()

        let pages: Page[] = []
        if (data.pages && Array.isArray(data.pages)) {
          pages = data.pages
        } else if (data.questions && Array.isArray(data.questions)) {
          // Migrate old format to new format
          pages = [
            {
              id: `page_${Date.now()}`,
              title: "Page 1",
              description: "",
              questions: data.questions,
              order: 0,
            },
          ]
        } else {
          // Create default empty page
          pages = [
            {
              id: `page_${Date.now()}`,
              title: "Page 1",
              description: "",
              questions: [],
              order: 0,
            },
          ]
        }

        setFormData({
          id: docSnap.id,
          title: data.title || "",
          description: data.description || "",
          pages: pages,
          isActive: data.isActive !== false,
          theme: data.theme || colorThemes[0], // Default to Ocean Blue
          linkedProductId: data.linkedProductId || null, // Ensure it's not undefined
          linkedProductName: data.linkedProductName || null, // Ensure it's not undefined
        })
      } else {
        toast({
          title: "Form Not Found",
          description: "The requested form could not be found",
          variant: "destructive",
        })
        router.push("/dashboard/product-brief")
      }
    } catch (error) {
      console.error("Error fetching form data:", error)
      toast({
        title: "Error",
        description: "Failed to load form data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateId = () => {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const addPage = () => {
    if (!formData) return

    const newPage: Page = {
      id: `page_${generateId()}`,
      title: `Page ${formData.pages.length + 1}`,
      description: "",
      questions: [],
      order: formData.pages.length,
    }

    setFormData({
      ...formData,
      pages: [...formData.pages, newPage],
    })

    setCurrentPageIndex(formData.pages.length)
  }

  const updatePage = (pageId: string, updates: Partial<Page>) => {
    if (!formData) return

    setFormData({
      ...formData,
      pages: formData.pages.map((page) => (page.id === pageId ? { ...page, ...updates } : page)),
    })
  }

  const deletePage = (pageId: string) => {
    if (!formData || formData.pages.length <= 1) return

    const newPages = formData.pages.filter((page) => page.id !== pageId)
    setFormData({
      ...formData,
      pages: newPages,
    })

    if (currentPageIndex >= newPages.length) {
      setCurrentPageIndex(Math.max(0, newPages.length - 1))
    }
  }

  const addQuestion = (type: Question["type"]) => {
    if (!formData || !formData.pages[currentPageIndex]) return

    const currentPage = formData.pages[currentPageIndex]
    const newQuestion: Question = {
      id: `q_${generateId()}`,
      type,
      title: "", // keeping empty for backward compatibility
      description: "", // this will be the main question content
      required: false,
      options:
        type === "multiple_choice" || type === "checkbox" || type === "dropdown"
          ? [{ text: "Option 1", imageUrl: undefined }]
          : undefined,
      imageUrl: type === "image" ? "" : undefined, // Initialize imageUrl for image type
      order: currentPage.questions.length,
    }

    const updatedPage = {
      ...currentPage,
      questions: [...currentPage.questions, newQuestion],
    }

    updatePage(currentPage.id, updatedPage)
    setEditingQuestion(newQuestion.id)
  }

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    if (!formData) return

    const currentPage = formData.pages[currentPageIndex]
    if (!currentPage) return

    const updatedQuestions = currentPage.questions.map((q) => (q.id === questionId ? { ...q, ...updates } : q))
    updatePage(currentPage.id, { questions: updatedQuestions })
  }

  const deleteQuestion = (questionId: string) => {
    if (!formData) return

    const currentPage = formData.pages[currentPageIndex]
    if (!currentPage) return

    const updatedQuestions = currentPage.questions.filter((q) => q.id !== questionId)
    updatePage(currentPage.id, { questions: updatedQuestions })
  }

  const addOption = (questionId: string) => {
    const currentPage = formData?.pages[currentPageIndex]
    const question = currentPage?.questions.find((q) => q.id === questionId)
    if (!question || !question.options) return

    const newOptions = [...question.options, { text: `Option ${question.options.length + 1}`, imageUrl: undefined }]
    updateQuestion(questionId, { options: newOptions })
  }

  const updateOptionText = (questionId: string, optionIndex: number, value: string) => {
    const currentPage = formData?.pages[currentPageIndex]
    const question = currentPage?.questions.find((q) => q.id === questionId)
    if (!question || !question.options) return

    const newOptions = [...question.options]
    newOptions[optionIndex] = { ...newOptions[optionIndex], text: value }
    updateQuestion(questionId, { options: newOptions })
  }

  const updateOptionImage = (questionId: string, optionIndex: number, imageUrl: string | undefined) => {
    const currentPage = formData?.pages[currentPageIndex]
    const question = currentPage?.questions.find((q) => q.id === questionId)
    if (!question || !question.options) return

    const newOptions = [...question.options]
    newOptions[optionIndex] = { ...newOptions[optionIndex], imageUrl: imageUrl }
    updateQuestion(questionId, { options: newOptions })
  }

  const removeOption = (questionId: string, optionIndex: number) => {
    const currentPage = formData?.pages[currentPageIndex]
    const question = currentPage?.questions.find((q) => q.id === questionId)
    if (!question || !question.options || question.options.length <= 1) return

    const newOptions = question.options.filter((_, index) => index !== optionIndex)
    updateQuestion(questionId, { options: newOptions })
  }

  const handleImageUpload = async (
    file: File,
    questionId: string,
    optionIndex?: number,
  ) => {
    if (!userData?.company_id) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to upload images.",
        variant: "destructive",
      })
      return
    }

    try {
      // Determine the storage path
      let path = `companies/${userData.company_id}/product_briefs/${formData?.id}/questions/${questionId}/${file.name}`
      if (optionIndex !== undefined) {
        path = `companies/${userData.company_id}/product_briefs/${formData?.id}/questions/${questionId}/options/${optionIndex}/${file.name}`
      }

      const imageUrl = await uploadImageToFirebase(file, path)

      if (optionIndex !== undefined) {
        updateOptionImage(questionId, optionIndex, imageUrl)
      } else {
        updateQuestion(questionId, { imageUrl: imageUrl })
      }

      toast({
        title: "Image Uploaded",
        description: "Image uploaded successfully!",
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    }
  }

  const cleanFormDataForFirebase = (data: FormData) => {
    const cleanedPages = data.pages.map((page) => {
      const cleanedQuestions = page.questions.map((question) => {
        const cleanedQuestion: any = {
          id: question.id || "",
          type: question.type || "text",
          title: question.title || "", // keeping for backward compatibility
          required: question.required || false,
          order: question.order || 0,
        }

        if (question.description && question.description.trim() !== "") {
          cleanedQuestion.description = question.description
        }

        if (question.imageUrl) {
          cleanedQuestion.imageUrl = question.imageUrl
        }

        if (question.options && question.options.length > 0) {
          cleanedQuestion.options = question.options
            .filter((option) => option.text?.trim() !== "" || option.imageUrl) // Keep options with text or image
            .map((option) => ({
              text: option.text || "",
              ...(option.imageUrl && { imageUrl: option.imageUrl }), // Include imageUrl if present
            }))
        }

        return cleanedQuestion
      })

      return {
        id: page.id || "",
        title: page.title || "",
        description: page.description || "",
        questions: cleanedQuestions,
        order: page.order || 0,
      }
    })

    return {
      title: data.title || "",
      description: data.description || "",
      pages: cleanedPages,
      isActive: data.isActive !== undefined ? data.isActive : true,
      theme: data.theme || colorThemes[0],
      linkedProductId: data.linkedProductId || null, // Ensure it's not undefined
      linkedProductName: data.linkedProductName || null, // Ensure it's not undefined
      updatedAt: Timestamp.now(),
    }
  }

  const saveForm = async () => {
    if (!formData || !userData?.company_id) return

    if (!formData.title || formData.title.trim() === "") {
      toast({
        title: "Validation Error",
        description: "Form title is required",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      const docRef = doc(db, "products_brief", formData.id)

      const cleanedData = cleanFormDataForFirebase(formData)

      console.log("[v0] Saving cleaned data:", cleanedData) // Debug log

      await updateDoc(docRef, cleanedData)

      toast({
        title: "Form Saved",
        description: "Your product brief form has been saved successfully",
      })

      router.push("/dashboard/product-brief")
    } catch (error) {
      console.error("Error saving form:", error)
      console.error("[v0] Form data that failed to save:", formData)
      toast({
        title: "Error",
        description: "Failed to save form. Please check that all fields are properly filled.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const previewForm = () => {
    // Navigate to preview page
    router.push(`/website/product-brief/${formData?.id}`)
  }

  const previewTypeform = () => {
    router.push(`/website/product-brief/${formData?.id}/typeform`)
  }

  const deleteForm = async () => {
    if (!formData || !userData?.company_id) return

    if (!confirm("Are you sure you want to delete this product brief? This action cannot be undone.")) {
      return
    }

    try {
      setIsSaving(true) // Use isSaving to disable buttons during deletion
      const docRef = doc(db, "products_brief", formData.id)

      console.log("[v0] Deleting product brief:", formData.id) // Debug log

      await updateDoc(docRef, { deleted: true, updatedAt: Timestamp.now() })

      toast({
        title: "Product Brief Deleted",
        description: "The product brief has been marked as deleted.",
      })

      router.push("/dashboard/product-brief")
    } catch (error) {
      console.error("Error deleting form:", error)
      toast({
        title: "Error",
        description: "Failed to delete product brief.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (questionId: string, value: any) => {
    setResponses({
      ...responses,
      [questionId]: value,
    })
  }

  const handleThemeChange = (themeName: string) => {
    const selectedTheme = colorThemes.find((theme) => theme.name === themeName)
    if (selectedTheme && formData) {
      setFormData({
        ...formData,
        theme: selectedTheme,
      })
    }
  }

  const renderQuestion = (question: Question) => {
    if (!question) return null

    const hasError = !!errors[question.id]

    switch (question.type) {
      case "text":
      case "email":
      case "phone":
        return (
          <div className="space-y-4">
            <Input
              type={question.type === "email" ? "email" : question.type === "phone" ? "tel" : "text"}
              value={responses[question.id] || ""}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              className={`text-lg p-4 border-2 ${hasError ? "border-red-500" : "border-gray-200 focus:border-blue-500"}`}
              placeholder="Type your answer here..."
              autoFocus
            />
            {hasError && <p className="text-red-600 text-sm">{errors[question.id]}</p>}
          </div>
        )

      case "textarea":
        return (
          <div className="space-y-4">
            <Textarea
              value={responses[question.id] || ""}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              className={`text-lg p-4 border-2 min-h-32 ${hasError ? "border-red-500" : "border-gray-200 focus:border-blue-500"}`}
              placeholder="Type your answer here..."
              autoFocus
            />
            {hasError && <p className="text-red-600 text-sm">{errors[question.id]}</p>}
          </div>
        )

      case "multiple_choice":
        return (
          <div className="space-y-4">
            <RadioGroup
              value={responses[question.id] || ""}
              onValueChange={(value) => handleInputChange(question.id, value)}
              className="space-y-3"
            >
              {question.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <RadioGroupItem value={option.text} id={`${question.id}-${index}`} className="text-blue-600" />
                  <Label htmlFor={`${question.id}-${index}`} className="text-lg cursor-pointer flex items-center">
                    {option.imageUrl && (
                      <img src={option.imageUrl} alt={option.text} className="w-12 h-12 object-cover rounded mr-3" />
                    )}
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {hasError && <p className="text-red-600 text-sm">{errors[question.id]}</p>}
          </div>
        )

      case "checkbox":
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              {question.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Checkbox
                    id={`${question.id}-${index}`}
                    checked={(responses[question.id] || []).includes(option.text)}
                    onCheckedChange={(checked) => {
                      const currentValues = responses[question.id] || []
                      if (checked) {
                        handleInputChange(question.id, [...currentValues, option.text])
                      } else {
                        handleInputChange(
                          question.id,
                          currentValues.filter((v: string) => v !== option.text),
                        )
                      }
                    }}
                    className="text-blue-600"
                  />
                  <Label htmlFor={`${question.id}-${index}`} className="text-lg cursor-pointer flex items-center">
                    {option.imageUrl && (
                      <img src={option.imageUrl} alt={option.text} className="w-12 h-12 object-cover rounded mr-3" />
                    )}
                    {option.text}
                  </Label>
                </div>
              ))}
            </div>
            {hasError && <p className="text-red-600 text-sm">{errors[question.id]}</p>}
          </div>
        )

      case "dropdown":
        return (
          <div className="space-y-4">
            <Select
              value={responses[question.id] || ""}
              onValueChange={(value) => handleInputChange(question.id, value)}
            >
              <SelectTrigger className={`text-lg p-4 border-2 ${hasError ? "border-red-500" : "border-gray-200"}`}>
                <SelectValue placeholder="Choose an option..." />
              </SelectTrigger>
              <SelectContent>
                {question.options?.map((option, index) => (
                  <SelectItem key={index} value={option.text} className="text-lg">
                    <div className="flex items-center">
                      {option.imageUrl && (
                        <img src={option.imageUrl} alt={option.text} className="w-8 h-8 object-cover rounded mr-2" />
                      )}
                      {option.text}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError && <p className="text-red-600 text-sm">{errors[question.id]}</p>}
          </div>
        )

      case "date":
        return (
          <div className="space-y-4">
            <Input
              type="date"
              value={responses[question.id] || ""}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              className={`text-lg p-4 border-2 ${hasError ? "border-red-500" : "border-gray-200 focus:border-blue-500"}`}
              autoFocus
            />
            {hasError && <p className="text-red-600 text-sm">{errors[question.id]}</p>}
          </div>
        )

      case "image":
        return (
          <div className="space-y-4">
            <Label htmlFor={`image-upload-${question.id}`}>Upload Image</Label>
            <Input
              id={`image-upload-${question.id}`}
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleImageUpload(e.target.files[0], question.id)
                }
              }}
              className={`text-lg p-4 border-2 ${hasError ? "border-red-500" : "border-gray-200 focus:border-blue-500"}`}
            />
            {question.imageUrl && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Current Image:</p>
                <img src={question.imageUrl} alt="Uploaded image" className="max-w-xs h-auto rounded-lg shadow-md" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateQuestion(question.id, { imageUrl: undefined })}
                  className="mt-2 text-red-600 hover:text-red-700"
                >
                  Remove Image
                </Button>
              </div>
            )}
            {hasError && <p className="text-red-600 text-sm">{errors[question.id]}</p>}
          </div>
        )

      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading form builder...</span>
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Form Not Found</h2>
          <p className="text-gray-600 mb-4">The requested form could not be loaded</p>
          <Button onClick={() => router.push("/dashboard/product-brief")}>Back to Forms</Button>
        </div>
      </div>
    )
  }

  const currentPage = formData.pages[currentPageIndex]
  const currentTheme = formData?.theme || colorThemes[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/product-brief")}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Forms
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={previewForm} className="flex items-center gap-2 bg-transparent">
                    <Eye className="w-4 h-4" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    onClick={previewTypeform}
                    className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                  >
                    <Eye className="w-4 h-4" />
                    Typeform Style
                  </Button>
                  <Button
                    variant="outline"
                    onClick={deleteForm}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isSaving ? "Deleting..." : "Delete Form"}
                  </Button>
                </div>
              </div>

              {linkedProduct && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-4">
                    {/* Product Image */}
                    {(linkedProduct.media?.[0]?.url || linkedProduct.imageUrls?.[0]) && (
                      <div className="flex-shrink-0">
                        <img
                          src={linkedProduct.media?.[0]?.url || linkedProduct.imageUrls?.[0]}
                          alt={linkedProduct.name}
                          className="w-16 h-16 object-cover rounded-lg border border-blue-200"
                        />
                      </div>
                    )}

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <span className="text-sm font-medium text-blue-800">Linked Product:</span>
                        <span className="text-sm text-blue-700 font-semibold truncate">{linkedProduct.name}</span>
                      </div>

                      {linkedProduct.description && (
                        <p className="text-xs text-blue-600 mb-2 line-clamp-2">{linkedProduct.description}</p>
                      )}

                      <p className="text-xs text-blue-600">
                        This form is connected to your product and will help collect client requirements for it.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Fallback for when we only have the product name */}
              {formData.linkedProductName && !linkedProduct && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-800">Linked Product:</span>
                    <span className="text-sm text-blue-700 font-semibold">{formData.linkedProductName}</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    This form is connected to your product and will help collect client requirements for it.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="formTitle">Form Title</Label>
                  <Input
                    id="formTitle"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter form title"
                    className="text-xl font-semibold"
                  />
                </div>
                <div>
                  <Label htmlFor="formDescription">Form Description</Label>
                  <Textarea
                    id="formDescription"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter form description (optional)"
                    rows={2}
                  />
                </div>

                {/* Theme selection section */}
                <div>
                  <Label htmlFor="formTheme">Color Theme</Label>
                  <Select value={currentTheme.name} onValueChange={handleThemeChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorThemes.map((theme) => (
                        <SelectItem key={theme.name} value={theme.name}>
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full border border-gray-200"
                              style={{ backgroundColor: theme.primaryColor }}
                            />
                            {theme.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">This theme will be applied to your typeform interface</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="formActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="formActive">Form is active and accepting responses</Label>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Pages ({formData.pages.length})</h3>
                <Button
                  onClick={addPage}
                  className="text-white flex items-center gap-2"
                  style={{ backgroundColor: currentTheme.primaryColor }}
                >
                  <Plus className="w-4 h-4" />
                  Add Page
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                  disabled={currentPageIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Input
                      value={currentPage?.title || ""}
                      onChange={(e) => updatePage(currentPage.id, { title: e.target.value })}
                      placeholder="Page title"
                      className="font-medium"
                    />
                    {formData.pages.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePage(currentPage.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    value={currentPage?.description || ""}
                    onChange={(e) => updatePage(currentPage.id, { description: e.target.value })}
                    placeholder="Page description (optional)"
                    className="text-sm"
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPageIndex(Math.min(formData.pages.length - 1, currentPageIndex + 1))}
                  disabled={currentPageIndex === formData.pages.length - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="mt-3 text-sm text-gray-600 text-center">
                Page {currentPageIndex + 1} of {formData.pages.length} • {currentPage?.questions.length || 0} questions
              </div>
            </div>
          </div>

          {/* Questions for Current Page */}
          <div className="space-y-6">
            {currentPage?.questions.map((question, index) => (
              <Card key={question.id} className="shadow-sm border-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-500">Question {index + 1}</span>
                        <Select
                          value={question.type}
                          onValueChange={(value) => updateQuestion(question.id, { type: value as Question["type"] })}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {questionTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <type.icon className="w-4 h-4" />
                                  {type.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Textarea
                        value={question.description || ""}
                        onChange={(e) => updateQuestion(question.id, { description: e.target.value })}
                        placeholder="Enter your question here..."
                        className="font-medium resize-none"
                        rows={2}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteQuestion(question.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Question Options */}
                  {(question.type === "multiple_choice" ||
                    question.type === "checkbox" ||
                    question.type === "dropdown") && (
                    <div className="space-y-2 mb-4">
                      <Label>Options</Label>
                      {question.options?.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex flex-col gap-2 mb-4 p-3 border rounded-md bg-gray-50">
                          <div className="flex items-center gap-2">
                            <Input
                              value={option.text}
                              onChange={(e) => updateOptionText(question.id, optionIndex, e.target.value)}
                              placeholder={`Option ${optionIndex + 1}`}
                              className="flex-1"
                            />
                            {question.options && question.options.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeOption(question.id, optionIndex)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Label htmlFor={`option-image-${question.id}-${optionIndex}`} className="sr-only">
                              Upload Image for Option {optionIndex + 1}
                            </Label>
                            <Input
                              id={`option-image-${question.id}-${optionIndex}`}
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleImageUpload(e.target.files[0], question.id, optionIndex)
                                }
                              }}
                              className="flex-1 text-sm"
                            />
                            {option.imageUrl && (
                              <div className="flex items-center gap-2">
                                <img src={option.imageUrl} alt="Option image" className="w-10 h-10 object-cover rounded" />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateOptionImage(question.id, optionIndex, undefined)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addOption(question.id)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="w-3 h-3" />
                        Add Option
                      </Button>
                    </div>
                  )}

                  {/* Question Settings */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`required-${question.id}`}
                      checked={question.required}
                      onCheckedChange={(checked) => updateQuestion(question.id, { required: checked })}
                    />
                    <Label htmlFor={`required-${question.id}`}>Required</Label>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add Question */}
            <Card className="shadow-sm border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Question</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {questionTypes.map((type) => (
                      <Button
                        key={type.value}
                        variant="outline"
                        onClick={() => addQuestion(type.value as Question["type"])}
                        className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-blue-50 hover:border-blue-200"
                      >
                        <type.icon className="w-5 h-5" />
                        <span className="text-xs">{type.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <Button
          onClick={saveForm}
          disabled={isSaving}
          className="text-white flex items-center gap-2 px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 rounded-full"
          style={{ backgroundColor: currentTheme.primaryColor }}
        >
          <Save className="w-5 h-5" />
          {isSaving ? "Saving..." : "Save Form"}
        </Button>
      </div>
    </div>
  )
}
