"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Calendar, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUserData } from "@/hooks/use-user-data"
import { useToast } from "@/hooks/use-toast"
import { doc, getDoc, type Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Response {
  id: string
  responses: {
    pages?: Array<{
      questions: Array<{
        displayValue?: string
        questionText: string
        questionType: string
        value: any
        questionOrder: number
      }>
    }>
  }
  submittedAt: Timestamp
  ipAddress?: string
  userAgent?: string
  source?: "web" | "typeform" | "api"
  contactInfo?: {
    email?: string
    phone?: string
    company?: string
    name?: string
  }
  status?: "new" | "reviewed" | "responded" | "archived"
}

interface FormData {
  id: string
  title: string
  description: string
  questions: Array<{
    id: string
    type: string
    title: string
    description?: string
    required: boolean
    options?: string[]
  }>
}

export default function ResponseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { userData } = useUserData()
  const { toast } = useToast()

  const [response, setResponse] = useState<Response | null>(null)
  const [formData, setFormData] = useState<FormData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (params.responseId && params.id && userData?.company_id) {
      fetchData()
    }
  }, [params.responseId, params.id, userData?.company_id])

  const fetchData = async () => {
    try {
      setIsLoading(true)

      // Fetch response data
      const responseRef = doc(db, "product_brief_responses", params.responseId as string)
      const responseSnap = await getDoc(responseRef)

      if (!responseSnap.exists()) {
        toast({
          title: "Response Not Found",
          description: "The requested response could not be found",
          variant: "destructive",
        })
        router.push(`/dashboard/product-brief/responses/${params.id}`)
        return
      }

      const responseData = responseSnap.data()
      setResponse({
        id: responseSnap.id,
        responses: responseData.responses || {},
        submittedAt: responseData.submittedAt,
        ipAddress: responseData.ipAddress,
        userAgent: responseData.userAgent,
        source: responseData.source,
        contactInfo: responseData.contactInfo,
        status: responseData.status,
      })

      // Fetch form data
      const formRef = doc(db, "products_brief", params.id as string)
      const formSnap = await getDoc(formRef)

      if (formSnap.exists()) {
        const formData = formSnap.data()
        setFormData({
          id: formSnap.id,
          title: formData.title || "",
          description: formData.description || "",
          questions: formData.questions || [],
        })
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load response details",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return "Unknown"
    return timestamp.toDate().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getAllQuestions = () => {
    if (!response?.responses?.pages) return []

    const questions: Array<{
      questionText: string
      displayValue?: string
      value: any
      questionType: string
      questionOrder: number
    }> = []

    response.responses.pages.forEach((page) => {
      if (page.questions) {
        questions.push(...page.questions)
      }
    })

    return questions.sort((a, b) => a.questionOrder - b.questionOrder)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading response...</span>
      </div>
    )
  }

  if (!response || !formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Response Not Found</h2>
          <p className="text-gray-600 mb-4">The requested response could not be loaded</p>
          <Button onClick={() => router.push(`/dashboard/product-brief/responses/${params.id}`)}>
            Back to Responses
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/product-brief/responses/${params.id}`)}
              className="flex items-center gap-2 mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Responses
            </Button>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Response Details</CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(response.submittedAt)}
                  </div>
                  {formData.title && <Badge variant="secondary">{formData.title}</Badge>}
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Contact Information */}
          {response.contactInfo && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {response.contactInfo.name && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-gray-900">{response.contactInfo.name}</p>
                    </div>
                  )}
                  {response.contactInfo.email && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900">{response.contactInfo.email}</p>
                    </div>
                  )}
                  {response.contactInfo.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-gray-900">{response.contactInfo.phone}</p>
                    </div>
                  )}
                  {response.contactInfo.company && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Company</label>
                      <p className="text-gray-900">{response.contactInfo.company}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Questions and Answers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Questions & Answers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {getAllQuestions().map((question, index) => (
                  <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-500">Question {index + 1}</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">{question.questionText}</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-900">{question.displayValue || question.value || "No response"}</p>
                    </div>
                  </div>
                ))}
                {getAllQuestions().length === 0 && (
                  <p className="text-gray-500 text-center py-8">No questions found in this response.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
