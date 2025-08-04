"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search } from "lucide-react"
import { useRealTimeProducts } from "@/hooks/use-real-time-products"
import { useUserData } from "@/hooks/use-user-data"
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ProductCardSkeleton } from "./skeleton/product-card-skeleton"
import { deleteProduct } from "@/lib/product-service"
import { useToast } from "@/hooks/use-toast"
import { useCategories } from "@/hooks/use-categories"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import Image from "next/image"
import { format } from "date-fns"

interface CompanyFormData {
  name: string
  address_street: string
  address_city: string
  address_province: string
  website: string
  position: string
}

interface ProductToDelete {
  id: string
  name: string
  sku: string
}

export default function ProductsPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [showCompanyForm, setShowCompanyForm] = useState(false)
  const [savingCompany, setSavingCompany] = useState(false)
  const [companyError, setCompanyError] = useState("")
  const [companySuccess, setCompanySuccess] = useState("")
  const [productToDelete, setProductToDelete] = useState<ProductToDelete | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState("products")

  const { toast } = useToast()

  const [companyData, setCompanyData] = useState<CompanyFormData>({
    name: "",
    address_street: "",
    address_city: "",
    address_province: "",
    website: "",
    position: "",
  })

  const { currentUser: oldCurrentUser, userData, loading: userLoading } = useUserData()
  const { products: fetchedItems = [], loading, error, forceRefetch } = useRealTimeProducts(currentUser?.uid)

  // Check for company information when user data loads
  useEffect(() => {
    if (userData && !userData.company_id && !userLoading) {
      // Don't automatically show the form, wait for user to try adding a product
    }
  }, [userData, userLoading])

  const handleCompanyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCompanyData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    setSavingCompany(true)
    setCompanyError("")
    setCompanySuccess("")

    try {
      // Validate required fields
      if (!companyData.name.trim()) {
        throw new Error("Company name is required")
      }
      if (!companyData.address_city.trim()) {
        throw new Error("City is required")
      }
      if (!companyData.address_province.trim()) {
        throw new Error("Province is required")
      }
      if (!companyData.position.trim()) {
        throw new Error("Your position is required")
      }

      // Create new company
      const newCompanyData = {
        name: companyData.name,
        business_type: "Other",
        address: {
          street: companyData.address_street,
          city: companyData.address_city,
          province: companyData.address_province,
        },
        website: companyData.website,
        created_by: currentUser.uid,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      }

      // Create company document
      const companyRef = await addDoc(collection(db, "companies"), newCompanyData)
      const companyId = companyRef.id

      // Update user document with company ID
      const userRef = doc(db, "iboard_users", currentUser.uid)
      await updateDoc(userRef, {
        company_id: companyId,
        position: companyData.position,
        updated_at: serverTimestamp(),
      })

      setCompanySuccess("Company information saved successfully!")

      // Hide the form after a short delay and redirect to add product/service
      setTimeout(() => {
        setShowCompanyForm(false)
        if (activeTab === "products") {
          window.location.href = "/dashboard/products/add"
        } else {
          window.location.href = "/dashboard/services/add"
        }
      }, 1500)
    } catch (error: any) {
      console.error("Error saving company:", error)
      setCompanyError(error.message || "Failed to save company information. Please try again.")
    } finally {
      setSavingCompany(false)
    }
  }

  const handleAddProduct = async () => {
    if (!currentUser) return

    // Check if user has company information
    if (!userData?.company_id) {
      console.log(JSON.stringify(currentUser))
      setShowCompanyForm(true)
      return
    }

    // Redirect based on active tab
    if (activeTab === "products") {
      router.push("/dashboard/products/add")
    } else {
      router.push("/dashboard/services/add")
    }
  }

  const handleEditClick = (id: string, type: string) => {
    if (type === "SERVICE" || type === "SERVICES") {
      router.push(`/dashboard/services/edit/${id}`)
    } else {
      router.push(`/dashboard/products/edit/${id}`)
    }
  }

  const handleCloseCompanyForm = () => {
    setShowCompanyForm(false)
    setCompanyError("")
    setCompanySuccess("")
    // Reset form data
    setCompanyData({
      name: "",
      address_street: "",
      address_city: "",
      address_province: "",
      website: "",
      position: "",
    })
  }

  const handleDeleteClick = (product: any) => {
    setProductToDelete({
      id: product.id,
      name: product.name,
      sku: product.sku,
    })
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete || !currentUser) return

    setIsDeleting(true)
    try {
      // Call the soft delete function which updates active=false and deleted=true
      await deleteProduct(productToDelete.id, currentUser.uid)

      toast({
        title: "Product deleted",
        description: `${productToDelete.name} has been successfully deleted and removed from your active inventory.`,
        variant: "default",
      })

      // The real-time listener will automatically update the UI
      // since the product no longer matches the query (active=true, deleted=false)

      // Close the dialog
      setProductToDelete(null)
    } catch (error: any) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setProductToDelete(null)
  }

  // Filter and sort products - ensure products is always an array
  const filteredProducts = (fetchedItems || [])
    .filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory

      // Filter by type based on active tab
      const matchesType =
        activeTab === "products"
          ? product.type === "MERCHANDISE" || product.type === "Merchandise" || !product.type
          : product.type === "SERVICE" || product.type === "SERVICES"

      return matchesSearch && matchesCategory && matchesType
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        case "oldest":
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
        case "price-high":
          return b.price - a.price
        case "price-low":
          return a.price - b.price
        case "name":
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

  const { categories: fetchedCategories, loading: categoriesLoading } = useCategories("MERCHANDISE")
  const categories = [
    { id: "all", name: "All Categories" },
    ...(fetchedCategories || []).map((cat) => ({ id: cat.id, name: cat.name })),
  ]

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(price)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "published":
        return "bg-green-100 text-green-800"
      case "inactive":
      case "unpublished":
        return "bg-red-100 text-red-800"
      case "draft":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriceFromVariations = (product: any) => {
    // If no variations array or empty, fallback to main price
    if (!product.variations || !Array.isArray(product.variations) || product.variations.length === 0) {
      return formatPrice(product.price || 0)
    }

    // Get all variation prices from the variations array
    const prices = product.variations
      .map((variation: any) => Number(variation.price) || 0)
      .filter((price: number) => price > 0) // Filter out invalid prices

    if (prices.length === 0) {
      return formatPrice(product.price || 0)
    }

    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)

    // If all variations have the same price, show single price
    if (minPrice === maxPrice) {
      return formatPrice(minPrice)
    }

    // Show price range
    return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`
  }

  // Also add a function to get total stock from variations
  const getStockFromVariations = (product: any) => {
    if (!product.variations || !Array.isArray(product.variations) || product.variations.length === 0) {
      return product.stock || 0
    }

    // Sum up stock from all variations
    const totalStock = product.variations.reduce((total: number, variation: any) => {
      return total + (Number(variation.stock) || 0)
    }, 0)

    return totalStock > 0 ? totalStock : product.stock || 0
  }

  // Generate skeleton loaders based on view mode
  const renderSkeletons = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  const getServiceTypeLabel = (serviceType?: string) => {
    switch (serviceType) {
      case "roll_up":
        return "Roll Up"
      case "roll_down":
        return "Roll Down"
      case "delivery":
        return "Delivery"
      default:
        return "Service"
    }
  }

  const getAvailableDays = (schedule?: any) => {
    if (!schedule) return "No schedule set"
    const days = Object.entries(schedule)
      .filter(([_, scheduleData]: [string, any]) => scheduleData.available)
      .map(([day, _]) => day.charAt(0).toUpperCase() + day.slice(1))
    return days.length > 0 ? days.join(", ") : "No days available"
  }

  const filteredItems = useMemo(() => {
    if (!fetchedItems) return [] // Additional safety check, though default in hook should handle this

    const lowerCaseSearchTerm = searchTerm.toLowerCase()

    return fetchedItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(lowerCaseSearchTerm)

      if (activeTab === "products") {
        // Filter for products (MERCHANDISE or no type specified)
        return matchesSearch && (!item.type || item.type === "MERCHANDISE" || item.type === "Merchandise")
      } else {
        // Filter for services
        return matchesSearch && (item.type === "SERVICE" || item.type === "SERVICES")
      }
    })
  }, [fetchedItems, searchTerm, activeTab])

  const handleAddClick = () => {
    if (activeTab === "products") {
      router.push("/dashboard/products/add")
    } else {
      router.push("/dashboard/services/add")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Loading...</h1>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>
        {renderSkeletons()}
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Error</h1>
        <p className="text-red-500">Failed to load items: {error.message}</p>
        <Button onClick={forceRefetch}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Listings</h1>
        <Button onClick={handleAddClick}>
          <Plus className="mr-2 h-4 w-4" /> {activeTab === "products" ? "Add Product" : "Add Service"}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
      </div>

      <TabsContent value={activeTab}>
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No {activeTab} found. Click "Add {activeTab === "products" ? "Product" : "Service"}" to create one.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="flex flex-col overflow-hidden">
                <div className="relative w-full h-48 bg-gray-100 flex items-center justify-center">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl || "/placeholder.svg"}
                      alt={item.name}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-t-lg"
                    />
                  ) : (
                    <div className="text-gray-400">No Image</div>
                  )}
                  {item.type === "SERVICE" || item.type === "SERVICES" ? (
                    <Badge className="absolute top-2 left-2 bg-blue-500 text-white">Service</Badge>
                  ) : (
                    <Badge className="absolute top-2 left-2 bg-green-500 text-white">Product</Badge>
                  )}
                </div>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg font-semibold truncate">{item.name}</CardTitle>
                  <CardDescription className="text-sm text-gray-600 line-clamp-2">{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-grow flex flex-col justify-between">
                  <div className="flex items-center justify-between text-sm text-gray-700 mb-2">
                    <span>Price:</span>
                    <span className="font-medium">PHP {item.price?.toFixed(2) || "N/A"}</span>
                  </div>
                  {(item.type === "SERVICE" || item.type === "SERVICES") && item.schedule && (
                    <div className="text-xs text-gray-500 mb-2">
                      Available:{" "}
                      {Object.keys(item.schedule)
                        .filter((day) => item.schedule[day].available)
                        .map((day) => day.charAt(0).toUpperCase() + day.slice(1))
                        .join(", ") || "N/A"}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mb-4">
                    Last updated:{" "}
                    {item.updatedAt ? format(new Date(item.updatedAt.seconds * 1000), "MMM dd, yyyy") : "N/A"}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => handleEditClick(item.id, item.type || "MERCHANDISE")}
                  >
                    Edit
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </div>
  )
}
