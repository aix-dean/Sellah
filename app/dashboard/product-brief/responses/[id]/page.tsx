"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Download, Calendar, User, MoreHorizontal, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useUserData } from "@/hooks/use-user-data"
import { useToast } from "@/hooks/use-toast"
import { doc, getDoc, collection, query, where, getDocs, orderBy, deleteDoc, type Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Question {
  id: string
  type: string
  title: string
  description?: string
  required: boolean
  options?: string[]
}

interface FormData {
  id: string
  title: string
  description: string
  questions: Question[]
  linkedProductId?: string
  linkedProductName?: string
}

interface Product {
  id: string
  name: string
  media?: Array<{ url: string }>
}

interface Response {
  id: string
  responses: Record<string, any>
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

export default function ResponsesPage() {
  const params = useParams()
  const router = useRouter()
  const { userData } = useUserData()
  const { toast } = useToast()

  const [formData, setFormData] = useState<FormData | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [responses, setResponses] = useState<Response[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [responseToDelete, setResponseToDelete] = useState<Response | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (params.id && userData?.company_id) {
      fetchData()
    }
  }, [params.id, userData?.company_id])

  const fetchData = async () => {
    try {
      setIsLoading(true)

      // Fetch form data
      const formRef = doc(db, "products_brief", params.id as string)
      const formSnap = await getDoc(formRef)

      if (!formSnap.exists()) {
        toast({
          title: "Form Not Found",
          description: "The requested form could not be found",
          variant: "destructive",
        })
        router.push("/dashboard/product-brief")
        return
      }

      const formData = formSnap.data()
      const formDataObj = {
        id: formSnap.id,
        title: formData.title || "",
        description: formData.description || "",
        questions: formData.questions || [],
        linkedProductId: formData.linkedProductId,
        linkedProductName: formData.linkedProductName,
      }
      setFormData(formDataObj)

      if (formData.linkedProductId) {
        try {
          const productRef = doc(db, "products", formData.linkedProductId)
          const productSnap = await getDoc(productRef)

          if (productSnap.exists()) {
            const productData = productSnap.data()
            setProduct({
              id: productSnap.id,
              name: productData.name || "",
              media: productData.media || [],
            })
          }
        } catch (error) {
          console.error("Error fetching product:", error)
        }
      }

      // Fetch responses
      const responsesRef = collection(db, "product_brief_responses")
      const q = query(
        responsesRef,
        where("formId", "==", params.id),
        where("companyId", "==", userData?.company_id),
        orderBy("submittedAt", "desc"),
      )

      const responsesSnap = await getDocs(q)
      const responsesData: Response[] = []

      responsesSnap.forEach((doc) => {
        const data = doc.data()
        responsesData.push({
          id: doc.id,
          responses: data.responses || {},
          submittedAt: data.submittedAt,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          source: data.source,
          contactInfo: data.contactInfo,
          status: data.status,
        })
      })

      setResponses(responsesData)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load responses",
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
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getResponseValue = (questionId: string, response: Response) => {
    const value = response.responses[questionId]

    if (value && typeof value === "object" && value.displayValue) {
      return value.displayValue
    }

    if (Array.isArray(value)) {
      return value.join(", ")
    }
    return value || "No response"
  }

  const getQuestionText = (questionId: string, response: Response) => {
    const value = response.responses[questionId]

    if (value && typeof value === "object" && value.questionText) {
      return value.questionText
    }

    // Fallback to finding question in form data
    const question = formData?.questions.find((q) => q.id === questionId)
    return question?.title || question?.description || questionId
  }

  const exportToCSV = () => {
    if (!formData || responses.length === 0) return

    const headers = ["Submission Date", ...formData.questions.map((q) => q.title)]
    const rows = responses.map((response) => [
      formatDate(response.submittedAt),
      ...formData.questions.map((q) => getResponseValue(q.id, response)),
    ])

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${formData.title.replace(/[^a-z0-9]/gi, "_")}_responses.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getFirstAnswer = (response: Response) => {
    const responseKeys = Object.keys(response.responses)
    if (responseKeys.length === 0) return "No response"

    const firstQuestionId = responseKeys[0]
    return getResponseValue(firstQuestionId, response)
  }

  const handleDeleteResponse = async (response: Response) => {
    setResponseToDelete(response)
    setDeleteDialogOpen(true)
  }

  const handleResponseClick = (response: Response) => {
    router.push(`/dashboard/product-brief/responses/${params.id}/response/${response.id}`)
  }

  const confirmDelete = async () => {
    if (!responseToDelete) return

    try {
      setIsDeleting(true)

      // Delete the response from Firebase
      await deleteDoc(doc(db, "product_brief_responses", responseToDelete.id))

      // Update local state
      setResponses((prev) => prev.filter((r) => r.id !== responseToDelete.id))

      toast({
        title: "Response Deleted",
        description: "The response has been successfully deleted.",
      })
    } catch (error) {
      console.error("Error deleting response:", error)
      toast({
        title: "Error",
        description: "Failed to delete the response. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setResponseToDelete(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading responses...</span>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
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
                  <Button
                    variant="outline"
                    onClick={exportToCSV}
                    disabled={responses.length === 0}
                    className="flex items-center gap-2 bg-transparent"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                </div>
              </div>

              {product && product.media && product.media.length > 0 && (
                <div className="mb-6">
                  <img
                    src={product.media[0].url || "/placeholder.svg"}
                    alt={product.name}
                    className="w-32 h-32 object-cover rounded-lg border shadow-sm"
                  />
                </div>
              )}

              <h1 className="text-3xl font-bold text-gray-900 mb-2">{formData.title}</h1>
              <p className="text-gray-600 mb-4">{formData.description}</p>

              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {responses.length} Responses
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formData.questions.length} Questions
                </Badge>
              </div>
            </div>
          </div>

          {/* Responses */}
          {responses.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No responses yet</h3>
                <p className="text-gray-600">Share your form link to start collecting responses from clients.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm border-0">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Response
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          First Answer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {responses.map((response, index) => (
                        <tr
                          key={response.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleResponseClick(response)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              Response #{responses.length - index}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">{formatDate(response.submittedAt)}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">{getFirstAnswer(response)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {response.contactInfo?.name || response.contactInfo?.email || "No contact info"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteResponse(response)
                                  }}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete Response
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Response</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this response? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
