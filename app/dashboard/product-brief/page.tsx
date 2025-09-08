"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, Edit3, FileText, Package, BarChart3, Link } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUserData } from "@/hooks/use-user-data"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Product } from "@/lib/product-service"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ProductBrief {
  id: string
  title: string
  description: string
  linkedProductIds: string[] // Changed from single linkedProductId to array Product Briefs
  linkedProducts: Product[] // Added array of linked products
  responseCount: number
  isActive: boolean
  createdAt: any
  updatedAt: any
}

export default function ProductBriefPage() {
  const { userData } = useUserData()
  const { toast } = useToast()
  const router = useRouter()

  const [productBriefs, setProductBriefs] = useState<ProductBrief[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedBrief, setSelectedBrief] = useState<ProductBrief | null>(null)
  const [isLinkingProducts, setIsLinkingProducts] = useState(false)
  const [newBriefTitle, setNewBriefTitle] = useState("")
  const [newBriefDescription, setNewBriefDescription] = useState("")

  useEffect(() => {
    if (userData?.company_id) {
      fetchProductBriefs()
      fetchAllProducts()
    }
  }, [userData?.company_id])

  const fetchAllProducts = async () => {
    if (!userData?.company_id) return

    try {
      const productsRef = collection(db, "products")
      const productsQuery = query(
        productsRef,
        where("company_id", "==", userData.company_id),
        where("active", "==", true),
        where("deleted", "==", false),
      )
      const productsSnapshot = await getDocs(productsQuery)

      const products: Product[] = []
      productsSnapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          ...doc.data(),
        } as Product)
      })

      setAllProducts(products)
    } catch (error) {
      console.error("Error fetching products:", error)
    }
  }

  const fetchProductBriefs = async () => {
    if (!userData?.company_id) return

    try {
      setIsLoading(true)

      const briefsRef = collection(db, "products_brief")
      const briefsQuery = query(
        briefsRef,
        where("companyId", "==", userData.company_id),
        where("deleted", "==", false) // Filter out deleted product briefs
      )
      const briefsSnapshot = await getDocs(briefsQuery)

      const briefs: ProductBrief[] = []
      briefsSnapshot.forEach((doc) => {
        const data = doc.data()

        let linkedProductIds: string[] = []
        if (data.linkedProductIds && Array.isArray(data.linkedProductIds)) {
          linkedProductIds = data.linkedProductIds
        } else if (data.linkedProductId) {
          linkedProductIds = [data.linkedProductId]
        }

        briefs.push({
          id: doc.id,
          title: data.title || "Untitled Brief",
          description: data.description || "",
          linkedProductIds,
          linkedProducts: [], // Will be populated after fetching products
          responseCount: data.responseCount || 0,
          isActive: data.isActive !== false,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        })
      })

      setProductBriefs(briefs)
    } catch (error) {
      console.error("Error fetching product briefs:", error)
      toast({
        title: "Error",
        description: "Failed to load product briefs",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const productBriefsWithLinkedProducts = useMemo(() => {
    if (allProducts.length === 0 || productBriefs.length === 0) {
      return []
    }
    return productBriefs.map((brief) => ({
      ...brief,
      linkedProducts: allProducts.filter((product) => brief.linkedProductIds.includes(product.id!)),
    }))
  }, [allProducts, productBriefs])

  const handleCreateBrief = async () => {
    if (!userData?.company_id || !newBriefTitle.trim()) return

    try {
      setIsCreating(true)
      const briefsRef = collection(db, "products_brief")

      const newBrief = {
        title: newBriefTitle.trim(),
        description: newBriefDescription.trim(),
        companyId: userData.company_id,
        createdBy: userData.uid,
        questions: [],
        isActive: true,
        responseCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        linkedProductIds: [], // Initialize with empty array instead of single product
        deleted: false, // Set deleted to false by default
      }

      const docRef = await addDoc(briefsRef, newBrief)

      toast({
        title: "Brief Created",
        description: `Product brief "${newBriefTitle}" created successfully`,
      })

      setNewBriefTitle("")
      setNewBriefDescription("")
      fetchProductBriefs()
      router.push(`/dashboard/product-brief/builder/${docRef.id}`)
    } catch (error) {
      console.error("Error creating product brief:", error)
      toast({
        title: "Error",
        description: "Failed to create product brief",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleLinkProducts = async (briefId: string, selectedProductIds: string[]) => {
    try {
      setIsLinkingProducts(true)
      const briefRef = doc(db, "products_brief", briefId)

      await updateDoc(briefRef, {
        linkedProductIds: selectedProductIds,
        updatedAt: Timestamp.now(),
      })

      toast({
        title: "Products Linked",
        description: `Successfully linked ${selectedProductIds.length} products to the brief`,
      })

      fetchProductBriefs()
      setSelectedBrief(null)
    } catch (error) {
      console.error("Error linking products:", error)
      toast({
        title: "Error",
        description: "Failed to link products",
        variant: "destructive",
      })
    } finally {
      setIsLinkingProducts(false)
    }
  }

  const handleEditBrief = (brief: ProductBrief) => {
    router.push(`/dashboard/product-brief/builder/${brief.id}`)
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
                      <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                    Project Briefs
                  </h1>
                  <p className="text-gray-600 text-lg">Manage product briefs and link them to multiple products</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Brief
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Product Brief</DialogTitle>
                      <DialogDescription>
                        Create a new brief form that can be linked to multiple products
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="briefTitle">Brief Title</Label>
                        <Input
                          id="briefTitle"
                          value={newBriefTitle}
                          onChange={(e) => setNewBriefTitle(e.target.value)}
                          placeholder="Enter brief title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="briefDescription">Description (Optional)</Label>
                        <Input
                          id="briefDescription"
                          value={newBriefDescription}
                          onChange={(e) => setNewBriefDescription(e.target.value)}
                          placeholder="Enter brief description"
                        />
                      </div>
                      <Button
                        onClick={handleCreateBrief}
                        disabled={isCreating || !newBriefTitle.trim()}
                        className="w-full"
                      >
                        {isCreating ? "Creating..." : "Create Brief"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading briefs...</span>
            </div>
          ) : productBriefs.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No product briefs found</h3>
                <p className="text-gray-600 mb-6">Create your first product brief to get started</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Brief
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Product Brief</DialogTitle>
                      <DialogDescription>
                        Create a new brief form that can be linked to multiple products
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="briefTitle">Brief Title</Label>
                        <Input
                          id="briefTitle"
                          value={newBriefTitle}
                          onChange={(e) => setNewBriefTitle(e.target.value)}
                          placeholder="Enter brief title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="briefDescription">Description (Optional)</Label>
                        <Input
                          id="briefDescription"
                          value={newBriefDescription}
                          onChange={(e) => setNewBriefDescription(e.target.value)}
                          placeholder="Enter brief description"
                        />
                      </div>
                      <Button
                        onClick={handleCreateBrief}
                        disabled={isCreating || !newBriefTitle.trim()}
                        className="w-full"
                      >
                        {isCreating ? "Creating..." : "Create Brief"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productBriefsWithLinkedProducts.map((brief) => (
                <Card key={brief.id} className="hover:shadow-md transition-shadow border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">{brief.title}</CardTitle>
                        <CardDescription className="text-sm mt-1 line-clamp-2">
                          {brief.description || "No description provided"}
                        </CardDescription>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge
                            variant={brief.isActive ? "default" : "secondary"}
                            className={brief.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                          >
                            {brief.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Linked Products</span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedBrief(brief)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Link className="w-3 h-3 mr-1" />
                              Manage
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Link Products to "{brief.title}"</DialogTitle>
                              <DialogDescription>
                                Select which products this brief should be associated with
                              </DialogDescription>
                            </DialogHeader>
                            <ProductLinkingDialog
                              brief={brief}
                              allProducts={allProducts}
                              onSave={handleLinkProducts}
                              isLoading={isLinkingProducts}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>

                      {brief.linkedProducts.length > 0 ? (
                        <div className="space-y-1">
                          {brief.linkedProducts.slice(0, 3).map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 p-1 rounded"
                            >
                              <Package className="w-3 h-3" />
                              <span className="truncate">{product.name}</span>
                            </div>
                          ))}
                          {brief.linkedProducts.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{brief.linkedProducts.length - 3} more products
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 italic">No products linked</div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditBrief(brief)} className="flex-1">
                          <Edit3 className="w-3 h-3 mr-1" />
                          Edit Brief
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/website/product-brief/${brief.id}/typeform`)}
                          className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          View Form
                        </Button>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/product-brief/responses/${brief.id}`)}
                        className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      >
                        <BarChart3 className="w-3 h-3 mr-1" />
                        View Responses
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProductLinkingDialog({
  brief,
  allProducts,
  onSave,
  isLoading,
}: {
  brief: ProductBrief
  allProducts: Product[]
  onSave: (briefId: string, selectedProductIds: string[]) => void
  isLoading: boolean
}) {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(brief.linkedProductIds)

  const handleProductToggle = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProductIds([...selectedProductIds, productId])
    } else {
      setSelectedProductIds(selectedProductIds.filter((id) => id !== productId))
    }
  }

  const handleSave = () => {
    onSave(brief.id, selectedProductIds)
  }

  return (
    <div className="space-y-4">
      <div className="max-h-96 overflow-y-auto space-y-2">
        {allProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No products available</p>
            <p className="text-sm">Create products first to link them to briefs</p>
          </div>
        ) : (
          allProducts.map((product) => (
            <div key={product.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
              <Checkbox
                id={`product-${product.id}`}
                checked={selectedProductIds.includes(product.id!)}
                onCheckedChange={(checked) => handleProductToggle(product.id!, checked as boolean)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {product.images?.[0] && (
                    <img
                      src={product.images[0] || "/placeholder.svg"}
                      alt={product.name}
                      className="w-8 h-8 object-cover rounded"
                    />
                  )}
                  <div>
                    <Label htmlFor={`product-${product.id}`} className="font-medium cursor-pointer">
                      {product.name}
                    </Label>
                    <p className="text-sm text-gray-500 truncate">{product.description}</p>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {product.category}
              </Badge>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <span className="text-sm text-gray-600">{selectedProductIds.length} products selected</span>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
