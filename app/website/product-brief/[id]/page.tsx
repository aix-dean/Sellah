"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { doc, getDoc, collection, addDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { FileText, CheckCircle } from "lucide-react"
import Link from "next/link"

interface Question {
  id: string
  type: "text" | "textarea" | "multiple_choice" | "checkbox" | "dropdown" | "email" | "phone" | "date" | "image"
  title: string
  description?: string
  required: boolean
  options?: { text: string; imageUrl?: string }[]
  imageUrl?: string // Added for image upload questions
  order: number
}

interface FormData {
  id: string
  title: string
  description: string
  questions: Question[]
  isActive: boolean
  companyId: string
}

export default function PublicProductBriefPage() {
  const params = useParams()
  const { toast } = useToast()

  const [formData, setFormData] = useState<FormData | null>(null)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (params.id) {
      fetchFormData()
    }
  }, [params.id])

  const fetchFormData = async () => {
    try {
      setIsLoading(true)
      const docRef = doc(db, "products_brief", params.id as string)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()

        if (!data.isActive) {
          toast({
            title: "Form Unavailable",
            description: "This form is currently not accepting responses",
            variant: "destructive",
          })
          return
        }

        setFormData({
          id: docSnap.id,
          title: data.title || "",
          description: data.description || "",
          questions: data.questions || [],
          isActive: data.isActive !== false,
          companyId: data.companyId || "",
        })
      } else {
        toast({
          title: "Form Not Found",
          description: "The requested form could not be found",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching form data:", error)
      toast({
        title: "Error",
        description: "Failed to load form",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (questionId: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }))

    // Clear error when user starts typing
    if (errors[questionId]) {
      setErrors((prev) => ({
        ...prev,
        [questionId]: "",
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    formData?.questions.forEach((question) => {
      if (question.required) {
        const response = responses[question.id]

        if (
          !response ||
          (Array.isArray(response) && response.length === 0) ||
          (typeof response === "string" && response.trim() === "")
        ) {
          newErrors[question.id] = "This field is required"
        }

        // Email validation
        if (question.type === "email" && response) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(response)) {
            newErrors[question.id] = "Please enter a valid email address"
          }
        }

        // Phone validation (basic)
        if (question.type === "phone" && response) {
          const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
          if (!phoneRegex.test(response.replace(/[\s\-$$$$]/g, ""))) {
            newErrors[question.id] = "Please enter a valid phone number"
          }
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Please fix the errors",
        description: "Some required fields are missing or invalid",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const structuredResponses: Record<string, any> = {}
      const contactInfo: any = {}

      // Process responses to create structured, readable format
      Object.entries(responses).forEach(([questionId, value]) => {
        const question = formData?.questions.find((q) => q.id === questionId)

        if (question) {
          structuredResponses[questionId] = {
            questionText: question.description || question.title,
            questionType: question.type,
            value: value,
            displayValue:
              question.type === "image"
                ? value // For image type, value is already the URL
                : Array.isArray(value)
                  ? value.join(", ")
                  : String(value),
            pageTitle: "Main Form",
          }

          // Extract contact information
          if (question.type === "email" && value) {
            contactInfo.email = value
          }
          if (question.type === "phone" && value) {
            contactInfo.phone = value
          }
          if (question.title?.toLowerCase().includes("name") && value) {
            contactInfo.name = value
          }
          if (question.title?.toLowerCase().includes("company") && value) {
            contactInfo.company = value
          }
        }
      })

      // Save response to database
      const responsesRef = collection(db, "product_brief_responses")
      await addDoc(responsesRef, {
        formId: formData?.id,
        companyId: formData?.companyId,
        responses: structuredResponses,
        submittedAt: Timestamp.now(),
        ipAddress: "", // Could be populated server-side
        userAgent: navigator.userAgent,
        source: "web",
        contactInfo: Object.keys(contactInfo).length > 0 ? contactInfo : undefined,
        status: "new",
      })

      setIsSubmitted(true)
      toast({
        title: "Response Submitted",
        description: "Thank you for your submission. We'll get back to you soon!",
      })
    } catch (error) {
      console.error("Error submitting response:", error)
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your response. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderQuestion = (question: Question) => {
    const hasError = !!errors[question.id]

    switch (question.type) {
      case "text":
      case "email":
      case "phone":
        return (
          <div className="space-y-2">
            <Label htmlFor={question.id} className={hasError ? "text-red-600" : ""}>
              {question.title} {question.required && <span className="text-red-500">*</span>}
            </Label>
            {question.description && <p className="text-sm text-gray-600">{question.description}</p>}
            <Input
              id={question.id}
              type={question.type === "email" ? "email" : question.type === "phone" ? "tel" : "text"}
              value={responses[question.id] || ""}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              className={hasError ? "border-red-500" : ""}
              placeholder={`Enter ${question.title.toLowerCase()}`}
            />
            {hasError && <p className="text-sm text-red-600">{errors[question.id]}</p>}
          </div>
        )

      case "textarea":
        return (
          <div className="space-y-2">
            <Label htmlFor={question.id} className={hasError ? "text-red-600" : ""}>
              {question.title} {question.required && <span className="text-red-500">*</span>}
            </Label>
            {question.description && <p className="text-sm text-gray-600">{question.description}</p>}
            <Textarea
              id={question.id}
              value={responses[question.id] || ""}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              className={hasError ? "border-red-500" : ""}
              placeholder={`Enter ${question.title.toLowerCase()}`}
              rows={4}
            />
            {hasError && <p className="text-sm text-red-600">{errors[question.id]}</p>}
          </div>
        )

      case "multiple_choice":
        return (
          <div className="space-y-3">
            <Label className={hasError ? "text-red-600" : ""}>
              {question.title} {question.required && <span className="text-red-500">*</span>}
            </Label>
            {question.description && <p className="text-sm text-gray-600">{question.description}</p>}
            <RadioGroup
              value={responses[question.id] || ""}
              onValueChange={(value) => handleInputChange(question.id, value)}
              className={hasError ? "border border-red-500 rounded p-2" : ""}
            >
              {question.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.text} id={`${question.id}-${index}`} />
                  <Label htmlFor={`${question.id}-${index}`} className="flex items-center">
                    {option.imageUrl && (
                      <img src={option.imageUrl} alt={option.text} className="w-10 h-10 object-cover rounded mr-2" />
                    )}
                    <span>{option.text}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {hasError && <p className="text-sm text-red-600">{errors[question.id]}</p>}
          </div>
        )

      case "checkbox":
        return (
          <div className="space-y-3">
            <Label className={hasError ? "text-red-600" : ""}>
              {question.title} {question.required && <span className="text-red-500">*</span>}
            </Label>
            {question.description && <p className="text-sm text-gray-600">{question.description}</p>}
            <div className={`space-y-2 ${hasError ? "border border-red-500 rounded p-2" : ""}`}>
              {question.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
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
                  />
                  <Label htmlFor={`${question.id}-${index}`} className="flex items-center">
                    {option.imageUrl && (
                      <img src={option.imageUrl} alt={option.text} className="w-10 h-10 object-cover rounded mr-2" />
                    )}
                    <span>{option.text}</span>
                  </Label>
                </div>
              ))}
            </div>
            {hasError && <p className="text-sm text-red-600">{errors[question.id]}</p>}
          </div>
        )

      case "dropdown":
        return (
          <div className="space-y-2">
            <Label className={hasError ? "text-red-600" : ""}>
              {question.title} {question.required && <span className="text-red-500">*</span>}
            </Label>
            {question.description && <p className="text-sm text-gray-600">{question.description}</p>}
            <Select
              value={responses[question.id] || ""}
              onValueChange={(value) => handleInputChange(question.id, value)}
            >
              <SelectTrigger className={hasError ? "border-red-500" : ""}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {question.options?.map((option, index) => (
                  <SelectItem key={index} value={option.text}>
                    <div className="flex items-center">
                      {option.imageUrl && (
                        <img src={option.imageUrl} alt={option.text} className="w-10 h-10 object-cover rounded mr-2" />
                      )}
                      <span>{option.text}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError && <p className="text-sm text-red-600">{errors[question.id]}</p>}
          </div>
        )

      case "date":
        return (
          <div className="space-y-2">
            <Label htmlFor={question.id} className={hasError ? "text-red-600" : ""}>
              {question.title} {question.required && <span className="text-red-500">*</span>}
            </Label>
            {question.description && <p className="text-sm text-gray-600">{question.description}</p>}
            <Input
              id={question.id}
              type="date"
              value={responses[question.id] || ""}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              className={hasError ? "border-red-500" : ""}
            />
            {hasError && <p className="text-sm text-red-600">{errors[question.id]}</p>}
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
        <span className="ml-3 text-gray-600">Loading form...</span>
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Form Not Available</h2>
          <p className="text-gray-600">The requested form could not be found or is no longer active.</p>
        </div>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-6">
              Your product brief has been submitted successfully. We'll review your requirements and get back to you
              soon.
            </p>
            <Link href="/website/ZxWUmoFXCLnTXJVAOaAA">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 mb-4">Visit Website</Button>
            </Link>
            <p className="text-sm text-gray-500">You can close this window now.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-sm border-0 mb-8">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">{formData.title}</CardTitle>
              {formData.description && <CardDescription className="text-base">{formData.description}</CardDescription>}
            </CardHeader>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-6">
            {formData.questions
              .sort((a, b) => a.order - b.order)
              .map((question) => (
                <Card key={question.id} className="shadow-sm border-0">
                  <CardContent className="pt-6">{renderQuestion(question)}</CardContent>
                </Card>
              ))}

            <Card className="shadow-sm border-0">
              <CardContent className="pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? "Submitting..." : "Submit Product Brief"}
                </Button>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  )
}
