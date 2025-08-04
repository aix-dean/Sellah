"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Package, Wrench } from "lucide-react"
import { useRealTimeProducts } from "@/hooks/use-real-time-products"
import { useUserData } from "@/hooks/use-user-data"
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ProductCardSkeleton, ProductListItemSkeleton } from "./skeleton/product-card-skeleton"
import { deleteProduct } from "@/lib/product-service"
import { useToast } from "@/hooks/use-toast"
import { useCategories } from "@/hooks/use-categories"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import type { Service } from "@/types/service"
import Image from "next/image"

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

  const filteredItems = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    return fetchedItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(lowerCaseSearchTerm)

      if (activeTab === "products") {
        // Products are items with type "MERCHANDISE" or "Merchandise" or no type (for backward compatibility)
        return matchesSearch && (!item.type || item.type === "MERCHANDISE" || item.type === "Merchandise")
      } else {
        // Services are items with type "SERVICE" or "SERVICES"
        return matchesSearch && (item.type === "SERVICE" || item.type === "SERVICES")
      }
    })
  }, [fetchedItems, activeTab, searchTerm])

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
      window.location.href = "/dashboard/products/add"
    } else {
      window.location.href = "/dashboard/services/add"
    }
  }

  const handleAddClick = () => {
    if (activeTab === "products") {
      router.push("/dashboard/products/add")
    } else {
      router.push("/dashboard/services/add")
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
    if (viewMode === "grid") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      )
    } else {
      return (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, index) => (
              <ProductListItemSkeleton key={index} />
            ))}
          </div>
        </div>
      )
    }
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-red-500">
        <p>Error loading items: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Listings</h1>
        <Button onClick={handleAddClick}>
          <Plus className="mr-2 h-4 w-4" />
          {activeTab === "products" ? "Add Product" : "Add Service"}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search products or services..."
            className="pl-9 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <TabsContent value={activeTab} className="mt-0">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No {activeTab} found.</p>
              <p>Try adjusting your search or add a new {activeTab.slice(0, -1)}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className="flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() =>
                    router.push(
                      item.type === "SERVICE" || item.type === "SERVICES"
                        ? `/dashboard/services/${item.id}`
                        : `/dashboard/products/${item.id}`,
                    )
                  }
                >
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
                      <div className="text-gray-400">
                        {item.type === "SERVICE" || item.type === "SERVICES" ? (
                          <Wrench className="h-12 w-12" />
                        ) : (
                          <Package className="h-12 w-12" />
                        )}
                      </div>
                    )}
                  </div>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg font-semibold truncate">{item.name}</CardTitle>
                    <p className="text-sm text-gray-500">
                      {item.type === "SERVICE" || item.type === "SERVICES" ? "Service" : "Product"}
                    </p>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex-grow flex flex-col justify-between">
                    <p className="text-xl font-bold text-gray-900 mb-2">₱{item.price.toFixed(2)}</p>
                    {item.type === "SERVICE" || item.type === "SERVICES" ? (
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">Available Days:</p>
                        <ul className="list-disc list-inside ml-2">
                          {Object.entries((item as Service).schedule || {}).map(([day, { available }]) =>
                            available ? <li key={day}>{day.charAt(0).toUpperCase() + day.slice(1)}</li> : null,
                          )}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      )}
    </div>
  )
}
