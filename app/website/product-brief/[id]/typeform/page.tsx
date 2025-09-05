"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { doc, getDoc, collection, addDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ArrowRight, FileText } from "lucide-react"
import Link from "next/link"

interface Question {
  id: string
  type: "text" | "textarea" | "multiple_choice" | "checkbox" | "dropdown" | "email" | "phone" | "date"
  title: string
  description?: string
  required: boolean
  options?: { imageUrl?: string; text: string }[]
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
  pages: Page[]
  isActive: boolean
  companyId: string
  theme?: {
    name: string
    primaryColor: string
    secondaryColor: string
    accentColor: string
  }
}

interface CompanyData {
  id: string
  name: string
  logo?: string
  web_config?: {
    company_name?: string
  }
}

export default function TypeformStylePage() {
  const params = useParams()
  const { toast } = useToast()

  const [formData, setFormData] = useState<FormData | null>(null)
  const [companyData, setCompanyData] = useState<CompanyData | null>(null)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (params.id) {
      fetchFormData()
    }
  }, [params.id])

  const fetchCompanyData = async (companyId: string) => {
    try {
      const companyRef = doc(db, "companies", companyId)
      const companySnap = await getDoc(companyRef)

      if (companySnap.exists()) {
        const data = companySnap.data()
        setCompanyData({
          id: companySnap.id,
          name: data.name || "",
          logo: data.logo || "",
          web_config: data.web_config || {},
        })
      }
    } catch (error) {
      console.error("Error fetching company data:", error)
    }
  }

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

        let pages: Page[] = []

        if (data.pages && Array.isArray(data.pages)) {
          pages = data.pages.map((page: any) => ({
            id: page.id || `page_${Date.now()}`,
            title: page.title || "Untitled Page",
            description: page.description || "",
            questions: (page.questions || []).map((q: any) => ({
              ...q,
              options: (q.options || []).map((opt: any) => {
                if (typeof opt === 'string') {
                  return { text: opt };
                }
                return {
                  ...opt,
                  text: opt.text || '',
                };
              }),
            })).sort((a: Question, b: Question) => a.order - b.order),
            order: page.order || 0,
          }))
        } else if (data.questions && Array.isArray(data.questions)) {
          pages = [
            {
              id: `page_${Date.now()}`,
              title: "Page 1",
              description: "",
              questions: (data.questions || []).map((q: any) => ({
                ...q,
                options: (q.options || []).map((opt: any) => {
                  if (typeof opt === 'string') {
                    return { text: opt };
                  }
                  return {
                    ...opt,
                    text: opt.text || '',
                  };
                }),
              })).sort((a: Question, b: Question) => a.order - b.order),
              order: 0,
            },
          ]
        }

        // Sort pages by order
        pages.sort((a, b) => a.order - b.order)

        console.log(
          "[v0] Fetched pages:",
          pages.length,
          "pages with questions:",
          pages.map((p) => p.questions.length),
        )

        const formDataObj = {
          id: docSnap.id,
          title: data.title || "",
          description: data.description || "",
          pages: pages,
          isActive: data.isActive !== false,
          companyId: data.companyId || "",
          theme: data.theme || {
            name: "Ocean Blue",
            primaryColor: "#2563eb",
            secondaryColor: "#3b82f6",
            accentColor: "#1d4ed8",
          },
        }

        setFormData(formDataObj)

        if (formDataObj.companyId) {
          await fetchCompanyData(formDataObj.companyId)
        }
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

    if (errors[questionId]) {
      setErrors((prev) => ({
        ...prev,
        [questionId]: "",
      }))
    }
  }

  const getCurrentPage = () => {
    if (!formData) return null
    return formData.pages[currentPageIndex]
  }

  const validateCurrentPage = () => {
    const currentPage = getCurrentPage()
    if (!currentPage) return true

    let isValid = true
    const newErrors: Record<string, string> = {}

    currentPage.questions.forEach((question) => {
      if (!question.required) return

      const response = responses[question.id]
      let questionValid = true
      let errorMessage = ""

      if (
        !response ||
        (Array.isArray(response) && response.length === 0) ||
        (typeof response === "string" && response.trim() === "")
      ) {
        questionValid = false
        errorMessage = "This field is required"
      } else {
        if (question.type === "email" && response) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(response)) {
            questionValid = false
            errorMessage = "Please enter a valid email address"
          }
        }

        if (question.type === "phone" && response) {
          const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
          if (!phoneRegex.test(response.replace(/[\s\-()]/g, ""))) {
            questionValid = false
            errorMessage = "Please enter a valid phone number"
          }
        }
      }

      if (!questionValid) {
        newErrors[question.id] = errorMessage
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }

  const handlePrevious = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1)
    }
  }

  const handleNext = () => {
    if (!validateCurrentPage()) return

    if (!formData) return

    if (currentPageIndex < formData.pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)

      const pageResponses: any[] = []
      const contactInfo: any = {}

      // Process responses by pages for better organization
      formData?.pages.forEach((page, pageIndex) => {
        const pageQuestions: any[] = []

        page.questions.forEach((question) => {
          const response = responses[question.id]
          if (response !== undefined && response !== null && response !== "") {
            pageQuestions.push({
              questionText: question.description || question.title,
              questionType: question.type,
              value: response,
              displayValue: Array.isArray(response) ? response.join(", ") : String(response),
              required: question.required,
              questionOrder: question.order,
            })

            // Extract contact information
            if (question.type === "email" && response) {
              contactInfo.email = response
            }
            if (question.type === "phone" && response) {
              contactInfo.phone = response
            }
            if (question.title?.toLowerCase().includes("name") && response) {
              contactInfo.name = response
            }
            if (question.title?.toLowerCase().includes("company") && response) {
              contactInfo.company = response
            }
          }
        })

        // Only add page if it has responses
        if (pageQuestions.length > 0) {
          pageResponses.push({
            pageTitle: page.title,
            pageOrder: page.order,
            pageIndex: pageIndex,
            questions: pageQuestions.sort((a, b) => a.questionOrder - b.questionOrder),
            questionCount: pageQuestions.length,
          })
        }
      })

      const responseData: any = {
        formId: formData?.id,
        companyId: formData?.companyId,
        responses: {
          pages: pageResponses,
          totalPages: formData?.pages.length || 0,
          completedPages: pageResponses.length,
        },
        submittedAt: Timestamp.now(),
        ipAddress: "",
        userAgent: navigator.userAgent,
        source: "typeform",
        status: "new",
      }

      // Only add contactInfo if it has actual data
      if (Object.keys(contactInfo).length > 0) {
        responseData.contactInfo = contactInfo
      }

      const responsesRef = collection(db, "product_brief_responses")
      await addDoc(responsesRef, responseData)

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
    if (!question) return null

    const hasError = !!errors[question.id]

    return (
      <div key={question.id} className="mb-8">
        <Label className="text-lg font-medium text-gray-900 mb-3 block">
          {question.description || question.title}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </Label>

        <div className="space-y-4">
          {(() => {
            switch (question.type) {
              case "text":
              case "email":
              case "phone":
                return (
                  <>
                    <Input
                      type={question.type === "email" ? "email" : question.type === "phone" ? "tel" : "text"}
                      value={responses[question.id] || ""}
                      onChange={(e) => handleInputChange(question.id, e.target.value)}
                      className={`text-base p-3 border-2 ${hasError ? "border-red-500" : "border-gray-200 focus:border-blue-500"}`}
                      placeholder="Type your answer here..."
                    />
                    {hasError && <p className="text-red-600 text-sm">{errors[question.id]}</p>}
                  </>
                )

              case "textarea":
                return (
                  <>
                    <Textarea
                      value={responses[question.id] || ""}
                      onChange={(e) => handleInputChange(question.id, e.target.value)}
                      className={`text-base p-3 border-2 min-h-24 ${hasError ? "border-red-500" : "border-gray-200 focus:border-blue-500"}`}
                      placeholder="Type your answer here..."
                    />
                    {hasError && <p className="text-red-600 text-sm">{errors[question.id]}</p>}
                  </>
                )

              case "multiple_choice":
                return (
                  <>
                    <RadioGroup
                      value={responses[question.id] || ""}
                      onValueChange={(value) => handleInputChange(question.id, value)}
                      className="space-y-2"
                    >
                      {question.options?.map((option, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <RadioGroupItem value={option.text} id={`${question.id}-${index}`} className="text-blue-600" />
                          <Label htmlFor={`${question.id}-${index}`} className="text-base cursor-pointer">
                            {typeof option === 'object' && option !== null && 'text' in option ? option.text : String(option)}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    {hasError && <p className="text-red-600 text-sm">{errors[question.id]}</p>}
                  </>
                )

              case "checkbox":
                return (
                  <>
                    <div className="space-y-2">
                      {question.options?.map((option, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          {option.imageUrl && (
                            <img src={option.imageUrl} alt={option.text} className="w-16 h-16 object-cover rounded-md" />
                          )}
                          <Checkbox
                            id={`${question.id}-${index}`}
                            checked={(responses[question.id] || []).includes(typeof option === 'object' && option !== null && 'text' in option ? option.text : String(option))}
                            onCheckedChange={(checked) => {
                              const currentValues = responses[question.id] || []
                              const optionValue = typeof option === 'object' && option !== null && 'text' in option ? option.text : String(option);
                              if (checked) {
                                handleInputChange(question.id, [...currentValues, optionValue])
                              } else {
                                handleInputChange(
                                  question.id,
                                  currentValues.filter((v: string) => v !== optionValue),
                                )
                              }
                            }}
                            className="text-blue-600"
                          />
                          <Label htmlFor={`${question.id}-${index}`} className="text-base cursor-pointer">
                            {typeof option === 'object' && option !== null && 'text' in option ? option.text : String(option)}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {hasError && <p className="text-red-600 text-sm">{errors[question.id]}</p>}
                  </>
                )

              case "dropdown":
                return (
                  <>
                    <Select
                      value={responses[question.id] || ""}
                      onValueChange={(value) => handleInputChange(question.id, value)}
                    >
                      <SelectTrigger
                        className={`text-base p-3 border-2 ${hasError ? "border-red-500" : "border-gray-200"}`}
                      >
                        <SelectValue placeholder="Choose an option..." />
                      </SelectTrigger>
                      <SelectContent>
                        {question.options?.map((option, index) => (
                          <SelectItem key={index} value={typeof option === 'object' && option !== null && 'text' in option ? option.text : String(option)} className="text-base">
                            {typeof option === 'object' && option !== null && 'text' in option ? option.text : String(option)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {hasError && <p className="text-red-600 text-sm">{errors[question.id]}</p>}
                  </>
                )

              case "date":
                return (
                  <>
                    <Input
                      type="date"
                      value={responses[question.id] || ""}
                      onChange={(e) => handleInputChange(question.id, e.target.value)}
                      className={`text-base p-3 border-2 ${hasError ? "border-red-500" : "border-gray-200 focus:border-blue-500"}`}
                    />
                    {hasError && <p className="text-red-600 text-sm">{errors[question.id]}</p>}
                  </>
                )

              default:
                return null
            }
          })()}
        </div>
      </div>
    )
  }

  const progress = ((currentPageIndex + 1) / (formData?.pages.length || 1)) * 100
  const currentPage = getCurrentPage()
  const currentTheme = formData?.theme || {
    name: "Ocean Blue",
    primaryColor: "#2563eb",
    secondaryColor: "#3b82f6",
    accentColor: "#1d4ed8",
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${currentTheme.primaryColor}20` }}
          >
            <FileText className="w-8 h-8 animate-pulse" style={{ color: currentTheme.primaryColor }} />
          </div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Form not found or failed to load.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="fixed top-0 left-0 right-0 z-10">
        <div className="h-1 bg-gray-200">
          <div
            className="transition-all duration-300"
            style={{
              width: `${progress}%`,
              backgroundColor: currentTheme.primaryColor,
            }}
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 pt-12">
        <div className="max-w-3xl mx-auto">
          {companyData?.logo && (
            <div className="text-center mb-8">
              <Link
                href={`/website/${formData.companyId}`}
                className="inline-block hover:opacity-80 transition-opacity"
              >
                <img
                  src={companyData.logo || "/placeholder.svg"}
                  alt={companyData.web_config?.company_name || companyData.name || "Company Logo"}
                  className="h-16 w-auto mx-auto object-contain cursor-pointer"
                />
              </Link>
            </div>
          )}

          {!isSubmitted && currentPage && (
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardContent className="p-12">
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium" style={{ color: currentTheme.primaryColor }}>
                      Page {currentPageIndex + 1} of {formData.pages.length}
                    </p>
                    <p className="text-sm text-gray-500">
                      {currentPage.questions.length} question{currentPage.questions.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: currentTheme.primaryColor,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{currentPage.title}</h2>
                  {currentPage.description && <p className="text-gray-600 mb-8">{currentPage.description}</p>}

                  <div className="space-y-8">{currentPage.questions.map((question) => renderQuestion(question))}</div>
                </div>

                <div className="flex justify-between">
                  {currentPageIndex > 0 && (
                    <Button
                      onClick={handlePrevious}
                      variant="outline"
                      className="flex items-center gap-2"
                      style={{ borderColor: currentTheme.primaryColor, color: currentTheme.primaryColor }}
                    >
                      Previous Page
                    </Button>
                  )}
                  <Button
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className={`flex items-center gap-2 ${currentPageIndex === 0 ? "ml-auto" : ""}`}
                    style={{ backgroundColor: currentTheme.primaryColor, color: "white" }}
                  >
                    {currentPageIndex === formData.pages.length - 1 ? (
                      isSubmitting ? (
                        "Submitting..."
                      ) : (
                        "Submit"
                      )
                    ) : (
                      <>
                        Next Page
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isSubmitted && (
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardContent className="p-12 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: `${currentTheme.primaryColor}20` }}
                >
                  <FileText className="w-8 h-8" style={{ color: currentTheme.primaryColor }} />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h2>
                <p className="text-xl text-gray-600 mb-8">Your response has been submitted successfully.</p>
                <Link href="/website/ZxWUmoFXCLnTXJVAOaAA">
                  <Button
                    className="text-white px-8 py-3 text-lg"
                    style={{ backgroundColor: currentTheme.primaryColor }}
                  >
                    Visit Website
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
