"use client"

import { useState, useEffect } from "react"
import { Plus, Edit3, FileText, Package, BarChart3, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { useUserData } from "@/hooks/use-user-data"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs, addDoc, doc, getDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Product } from "@/lib/product-service"

interface ProductWithBrief extends Product {
  briefId?: string
  briefTitle?: string
  hasForm: boolean
}

interface CopyBriefState {
  isOpen: boolean
  sourceBriefId: string | null
  sourceProductName: string | null
  targetProducts: string[]
  isLoading: boolean
}

export default function ProductBriefPage() {
  const { userData } = useUserData()
  const { toast } = useToast()
  const router = useRouter()

  const [productsWithBriefs, setProductsWithBriefs] = useState<ProductWithBrief[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState<string | null>(null)
  const [copyBriefState, setCopyBriefState] = useState<CopyBriefState>({
    isOpen: false,
    sourceBriefId: null,
    sourceProductName: null,
    targetProducts: [],
    isLoading: false,
  })

  useEffect(() => {
    if (userData?.company_id) {
      fetchProductsWithBriefs()
    }
  }, [userData?.company_id])

  const fetchProductsWithBriefs = async () => {
    if (!userData?.company_id) return

    try {
      setIsLoading(true)

      const productsRef = collection(db, "products")
      const productsQuery = query(
        productsRef,
        where("company_id", "==", userData.company_id),
        where("active", "==", true),
        where("deleted", "==", false),
      )
      const productsSnapshot = await getDocs(productsQuery)

      const briefsRef = collection(db, "products_brief")
      const briefsQuery = query(briefsRef, where("companyId", "==", userData.company_id))
      const briefsSnapshot = await getDocs(briefsQuery)

      const briefsByProductId = new Map()
      briefsSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.linkedProductId) {
          briefsByProductId.set(data.linkedProductId, {
            id: doc.id,
            title: data.title,
          })
        }
      })

      const products: ProductWithBrief[] = []
      productsSnapshot.forEach((doc) => {
        const data = doc.data()
        const brief = briefsByProductId.get(doc.id)

        products.push({
          id: doc.id,
          ...data,
          briefId: brief?.id,
          briefTitle: brief?.title,
          hasForm: !!brief,
        } as ProductWithBrief)
      })

      setProductsWithBriefs(products)
    } catch (error) {
      console.error("Error fetching products with briefs:", error)
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateForm = async (product: ProductWithBrief) => {
    if (!userData?.company_id) return

    try {
      setIsCreating(product.id!)
      const briefsRef = collection(db, "products_brief")

      const newBrief = {
        title: `${product.name} Brief`,
        description: `Product brief form for ${product.name}`,
        companyId: userData.company_id,
        createdBy: userData.uid,
        questions: [],
        isActive: true,
        responseCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        linkedProductId: product.id,
        linkedProductName: product.name,
      }

      const docRef = await addDoc(briefsRef, newBrief)

      toast({
        title: "Form Created",
        description: `Product brief form created for "${product.name}"`,
      })

      router.push(`/dashboard/product-brief/builder/${docRef.id}`)
    } catch (error) {
      console.error("Error creating product brief:", error)
      toast({
        title: "Error",
        description: "Failed to create product brief form",
        variant: "destructive",
      })
    } finally {
      setIsCreating(null)
    }
  }

  const handleEditForm = (product: ProductWithBrief) => {
    if (product.briefId) {
      router.push(`/dashboard/product-brief/builder/${product.briefId}`)
    }
  }

  const handleCopyBrief = (product: ProductWithBrief) => {
    if (!product.briefId) return

    setCopyBriefState({
      isOpen: true,
      sourceBriefId: product.briefId,
      sourceProductName: product.name,
      targetProducts: [],
      isLoading: false,
    })
  }

  const getProductsWithoutForms = () => {
    return productsWithBriefs.filter((product) => !product.hasForm)
  }

  const handleTargetProductToggle = (productId: string) => {
    setCopyBriefState((prev) => ({
      ...prev,
      targetProducts: prev.targetProducts.includes(productId)
        ? prev.targetProducts.filter((id) => id !== productId)
        : [...prev.targetProducts, productId],
    }))
  }

  const executeCopyBrief = async () => {
    if (!copyBriefState.sourceBriefId || copyBriefState.targetProducts.length === 0 || !userData?.company_id) {
      return
    }

    try {
      setCopyBriefState((prev) => ({ ...prev, isLoading: true }))

      const sourceBriefRef = doc(db, "products_brief", copyBriefState.sourceBriefId)
      const sourceBriefSnap = await getDoc(sourceBriefRef)

      if (!sourceBriefSnap.exists()) {
        toast({
          title: "Error",
          description: "Source brief form not found",
          variant: "destructive",
        })
        return
      }

      const sourceBriefData = sourceBriefSnap.data()
      const briefsRef = collection(db, "products_brief")

      const copyPromises = copyBriefState.targetProducts.map(async (targetProductId) => {
        const targetProduct = productsWithBriefs.find((p) => p.id === targetProductId)
        if (!targetProduct) return

        const newBrief = {
          title: `${targetProduct.name} Brief`,
          description: `Product brief form for ${targetProduct.name} (copied from ${copyBriefState.sourceProductName})`,
          companyId: userData.company_id,
          createdBy: userData.uid,
          pages: sourceBriefData.pages || [],
          questions: sourceBriefData.questions || [],
          theme: sourceBriefData.theme || {
            name: "Ocean Blue",
            primaryColor: "#2563eb",
            secondaryColor: "#3b82f6",
            accentColor: "#1d4ed8",
          },
          isActive: true,
          responseCount: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          linkedProductId: targetProductId,
          linkedProductName: targetProduct.name,
        }

        return addDoc(briefsRef, newBrief)
      })

      await Promise.all(copyPromises)

      toast({
        title: "Brief Forms Copied",
        description: `Successfully copied brief form to ${copyBriefState.targetProducts.length} product${copyBriefState.targetProducts.length > 1 ? "s" : ""}`,
      })

      await fetchProductsWithBriefs()

      setCopyBriefState({
        isOpen: false,
        sourceBriefId: null,
        sourceProductName: null,
        targetProducts: [],
        isLoading: false,
      })
    } catch (error) {
      console.error("Error copying brief:", error)
      toast({
        title: "Error",
        description: "Failed to copy brief forms",
        variant: "destructive",
      })
    } finally {
      setCopyBriefState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Package className="w-8 h-8 text-blue-600" />
                    </div>
                    Product Brief Forms
                  </h1>
                  <p className="text-gray-600 text-lg">Manage brief forms for your products - one form per product</p>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading products...</span>
            </div>
          ) : productsWithBriefs.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-6">Create products first to manage their brief forms</p>
                <Button
                  onClick={() => router.push("/dashboard/products")}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Go to Products
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productsWithBriefs.map((product) => (
                <Card key={product.id} className="hover:shadow-md transition-shadow border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                        <CardDescription className="text-sm mt-1 line-clamp-2">
                          {product.description || "No description provided"}
                        </CardDescription>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                          <Badge
                            variant={product.hasForm ? "default" : "secondary"}
                            className={product.hasForm ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                          >
                            {product.hasForm ? "Has Form" : "No Form"}
                          </Badge>
                        </div>
                      </div>
                      {product.media && product.media[0]?.url && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={product.media[0].url || "/placeholder.svg"}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {product.hasForm && product.briefTitle && (
                      <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded-md">
                        <div className="font-medium">Form: {product.briefTitle}</div>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">Price: ${product.price || "Not set"}</div>

                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        {product.hasForm ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditForm(product)}
                            className="flex-1"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Edit Form
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateForm(product)}
                            disabled={isCreating === product.id}
                            className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            {isCreating === product.id ? "Creating..." : "Create Form"}
                          </Button>
                        )}

                        {product.hasForm && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/website/product-brief/${product.briefId}/typeform`)}
                            className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            View Form
                          </Button>
                        )}
                      </div>

                      {product.hasForm && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/product-brief/responses/${product.briefId}`)}
                            className="flex-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          >
                            <BarChart3 className="w-3 h-3 mr-1" />
                            View Responses
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyBrief(product)}
                            disabled={getProductsWithoutForms().length === 0}
                            className="flex-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            title={
                              getProductsWithoutForms().length === 0
                                ? "No products available to copy to"
                                : "Copy this brief to other products"
                            }
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy Brief
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={copyBriefState.isOpen}
        onOpenChange={(open) => !open && setCopyBriefState((prev) => ({ ...prev, isOpen: false }))}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Copy Brief Form</DialogTitle>
            <DialogDescription>
              Copy the brief form from "{copyBriefState.sourceProductName}" to other products that don't have forms yet.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Select products to copy to:</p>

              {getProductsWithoutForms().length === 0 ? (
                <p className="text-sm text-gray-500 italic">All products already have brief forms.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {getProductsWithoutForms().map((product) => (
                    <div key={product.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`copy-target-${product.id}`}
                        checked={copyBriefState.targetProducts.includes(product.id!)}
                        onCheckedChange={() => handleTargetProductToggle(product.id!)}
                      />
                      <label
                        htmlFor={`copy-target-${product.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        <div className="flex items-center gap-2">
                          {product.media && product.media[0]?.url && (
                            <img
                              src={product.media[0].url || "/placeholder.svg"}
                              alt={product.name}
                              className="w-6 h-6 rounded object-cover"
                            />
                          )}
                          <span>{product.name}</span>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCopyBriefState((prev) => ({ ...prev, isOpen: false }))}
              disabled={copyBriefState.isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={executeCopyBrief}
              disabled={copyBriefState.targetProducts.length === 0 || copyBriefState.isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {copyBriefState.isLoading
                ? "Copying..."
                : `Copy to ${copyBriefState.targetProducts.length} Product${copyBriefState.targetProducts.length !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
