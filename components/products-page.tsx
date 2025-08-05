"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import {
  Plus,
  Search,
  Grid3X3,
  List,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Package,
  Star,
  Building2,
  Loader2,
  X,
  CheckCircle,
  Wrench,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRealTimeProducts } from "@/hooks/use-real-time-products"
import { useUserData } from "@/hooks/use-user-data"
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ProductCardSkeleton, ProductListItemSkeleton } from "./skeleton/product-card-skeleton"
import { DeleteProductDialog } from "./delete-product-dialog"
import { deleteProduct } from "@/lib/product-service"
import { useToast } from "@/hooks/use-toast"
import { useCategories } from "@/hooks/use-categories"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  const [activeTab, setActiveTab] = useState("supplies")

  const { toast } = useToast()

  const [companyData, setCompanyData] = useState<CompanyFormData>({
    name: "",
    address_street: "",
    address_city: "",
    address_province: "",
    website: "",
    position: "",
  })

  const { currentUser, userData, loading: userLoading } = useUserData()
  const { products = [], loading, error, forceRefetch } = useRealTimeProducts(currentUser?.uid)

  // Filter products and services based on active tab
  const filteredItems = useMemo(() => {
    return (products || []).filter((item) => {
      // Basic filters that apply to both products and services
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))

      // Filter by active tab
      if (activeTab === "supplies") {
        // Products: items without type or with type "MERCHANDISE"
        const isProduct = !item.type || item.type === "MERCHANDISE" || item.type === "Merchandise"
        const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
        return matchesSearch && isProduct && matchesCategory
      } else {
        // Services: items with type "SERVICES"
        const isService = item.type === "SERVICES"
        // For services, we can filter by serviceType if needed
        const matchesServiceType = selectedCategory === "all" || item.serviceType === selectedCategory
        return matchesSearch && isService && matchesServiceType
      }
    })
  }, [products, activeTab, searchTerm, selectedCategory])

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
        if (activeTab === "supplies") {
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
    if (activeTab === "supplies") {
      window.location.href = "/dashboard/products/add"
    } else {
      window.location.href = "/dashboard/services/add"
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
      sku: product.sku || "N/A",
    })
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete || !currentUser) return

    setIsDeleting(true)
    try {
      // Call the soft delete function which updates active=false and deleted=true
      await deleteProduct(productToDelete.id, currentUser.uid)

      toast({
        title: `${activeTab === "supplies" ? "Product" : "Service"} deleted`,
        description: `${productToDelete.name} has been successfully deleted and removed from your active inventory.`,
        variant: "default",
      })

      // The real-time listener will automatically update the UI
      // since the product no longer matches the query (active=true, deleted=false)

      // Close the dialog
      setProductToDelete(null)
    } catch (error: any) {
      console.error("Error deleting item:", error)
      toast({
        title: "Error",
        description:
          error.message || `Failed to delete ${activeTab === "supplies" ? "product" : "service"}. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setProductToDelete(null)
  }

  const { categories: fetchedCategories, loading: categoriesLoading } = useCategories("MERCHANDISE")
  const categories = [
    { id: "all", name: activeTab === "supplies" ? "All Categories" : "All Service Types" },
    ...(activeTab === "supplies"
      ? (fetchedCategories || []).map((cat) => ({ id: cat.id, name: cat.name }))
      : [
          { id: "roll_up", name: "Roll Up" },
          { id: "roll_down", name: "Roll Down" },
          { id: "delivery", name: "Delivery" },
        ]),
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
    // For services, just return the main price
    if (product.type === "SERVICES") {
      return formatPrice(product.price || 0)
    }

    // For products, handle variations
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
    // Services don't have stock
    if (product.type === "SERVICES") {
      return "N/A"
    }

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

  return (
    <div className="min-h-screen text-left">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Inventory</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your product inventory and listings</p>
          </div>
          <Button onClick={handleAddProduct} className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            <span className="sm:hidden">{activeTab === "supplies" ? "Add" : "Add Service"}</span>
            <span className="hidden sm:inline">{activeTab === "supplies" ? "Add Product" : "Add Service"}</span>
          </Button>
        </div>

        {/* Company Information Form Overlay */}
        {showCompanyForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-red-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Company Information Required</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={handleCloseCompanyForm} className="p-1">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <p className="text-gray-600 mb-2">
                    To add {activeTab === "supplies" ? "products" : "services"}, we need your company information first.
                    Please fill out the details below.
                  </p>
                  <p className="text-sm text-gray-500">
                    This information will be used for your product listings and business profile.
                  </p>
                </div>

                {companyError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{companyError}</AlertDescription>
                  </Alert>
                )}

                {companySuccess && (
                  <Alert className="mb-4 border-green-200 bg-green-50">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-800">{companySuccess}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleCompanySubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="company_name">Company Name *</Label>
                    <Input
                      id="company_name"
                      name="name"
                      value={companyData.name}
                      onChange={handleCompanyInputChange}
                      placeholder="Enter your company name"
                      required
                      disabled={savingCompany}
                    />
                  </div>

                  <div>
                    <Label htmlFor="address_street">Street Address</Label>
                    <Input
                      id="address_street"
                      name="address_street"
                      value={companyData.address_street}
                      onChange={handleCompanyInputChange}
                      placeholder="Enter street address (optional)"
                      disabled={savingCompany}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="address_city">City *</Label>
                      <Input
                        id="address_city"
                        name="address_city"
                        value={companyData.address_city}
                        onChange={handleCompanyInputChange}
                        placeholder="Enter city"
                        required
                        disabled={savingCompany}
                      />
                    </div>
                    <div>
                      <Label htmlFor="address_province">Province *</Label>
                      <Input
                        id="address_province"
                        name="address_province"
                        value={companyData.address_province}
                        onChange={handleCompanyInputChange}
                        placeholder="Enter province"
                        required
                        disabled={savingCompany}
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
                      disabled={savingCompany}
                    />
                  </div>

                  <div>
                    <Label htmlFor="position">Your Position *</Label>
                    <Input
                      id="position"
                      name="position"
                      value={companyData.position}
                      onChange={handleCompanyInputChange}
                      placeholder="e.g., CEO, Founder, Manager"
                      required
                      disabled={savingCompany}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 justify-end pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseCompanyForm}
                      disabled={savingCompany}
                      className="w-full sm:w-auto bg-transparent"
                    >
                      Cancel
                    </Button>
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
                          Save & Continue
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Product Dialog */}
        <DeleteProductDialog
          product={productToDelete}
          isOpen={!!productToDelete}
          isDeleting={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />

        {/* Tabs for Supplies and Services */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="supplies" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Supplies
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Services
            </TabsTrigger>
          </TabsList>

          <TabsContent value="supplies" className="mt-6 space-y-6">
            {/* Filters and Search */}
            {filteredItems.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 pr-6 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      disabled={categoriesLoading}
                    >
                      {categoriesLoading ? (
                        <option value="all">Loading categories...</option>
                      ) : (
                        categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))
                      )}
                    </select>

                    {/* View Mode Toggle */}
                    <div className="flex border border-gray-300 rounded-md">
                      <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                        className={`rounded-r-none ${viewMode === "grid" ? "bg-red-500 hover:bg-red-600" : ""}`}
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                        className={`rounded-l-none ${viewMode === "list" ? "bg-red-500 hover:bg-red-600" : ""}`}
                      >
                        <List className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Products Grid/List */}
            {loading ? (
              renderSkeletons()
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Supplies found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || selectedCategory !== "all"
                    ? "Try adjusting your search or filters"
                    : "Get started by adding your first product"}
                </p>
                {!searchTerm && selectedCategory === "all" && (
                  <Button onClick={handleAddProduct} className="bg-red-500 hover:bg-red-600 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Product
                  </Button>
                )}
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow relative"
                  >
                    {/* Clickable card content */}
                    <div
                      className="cursor-pointer"
                      onClick={() => (window.location.href = `/dashboard/products/${product.id}`)}
                    >
                      <div className="relative">
                        <img
                          src={product.image_url || "/placeholder.svg?height=200&width=300"}
                          alt={product.name}
                          className="w-full h-48 object-cover rounded-t-lg"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=200&width=300"
                          }}
                        />
                        <Badge className={`absolute top-2 right-2 ${getStatusColor(product.status)}`}>
                          {product.status}
                        </Badge>
                      </div>

                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">SKU: {product.sku}</p>

                        <div className="flex items-center justify-between mb-3">
                          <span className="text-lg font-bold text-red-600">{getPriceFromVariations(product)}</span>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600">{product.rating || 5}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                          <span>Stock: {getStockFromVariations(product)}</span>
                          <span>Sales: {product.sales}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Eye className="w-4 h-4" />
                            <span>{product.views}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Three-dot menu positioned absolutely */}
                    <div className="absolute bottom-4 right-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm hover:bg-white/90 shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => (window.location.href = `/dashboard/products/${product.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => (window.location.href = `/dashboard/products/edit/${product.id}`)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(product)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SKU
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sales
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredItems.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img
                                src={product.image_url || "/placeholder.svg?height=40&width=40"}
                                alt={product.name}
                                className="w-10 h-10 rounded-lg object-cover mr-3"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg?height=40&width=40"
                                }}
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                <div className="text-sm text-gray-500">{product.category}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.sku}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {getPriceFromVariations(product)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getStockFromVariations(product)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getStatusColor(product.status)}>{product.status}</Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.sales}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => (window.location.href = `/dashboard/products/${product.id}`)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => (window.location.href = `/dashboard/products/edit/${product.id}`)}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(product)}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="services" className="mt-6 space-y-6">
            {/* Filters and Search for Services */}
            {filteredItems.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search services..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Service Type Filter */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 pr-6 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>

                    {/* View Mode Toggle */}
                    <div className="flex border border-gray-300 rounded-md">
                      <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                        className={`rounded-r-none ${viewMode === "grid" ? "bg-red-500 hover:bg-red-600" : ""}`}
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                        className={`rounded-l-none ${viewMode === "list" ? "bg-red-500 hover:bg-red-600" : ""}`}
                      >
                        <List className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Services Grid/List */}
            {loading ? (
              renderSkeletons()
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Services found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || selectedCategory !== "all"
                    ? "Try adjusting your search or filters"
                    : "Get started by adding your first service"}
                </p>
                {!searchTerm && selectedCategory === "all" && (
                  <Button onClick={handleAddProduct} className="bg-red-500 hover:bg-red-600 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Service
                  </Button>
                )}
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow relative"
                  >
                    {/* Clickable card content */}
                    <div
                      className="cursor-pointer"
                      onClick={() => (window.location.href = `/dashboard/products/${service.id}`)}
                    >
                      <div className="relative">
                        <img
                          src={service.image_url || "/placeholder.svg?height=200&width=300"}
                          alt={service.name}
                          className="w-full h-48 object-cover rounded-t-lg"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=200&width=300"
                          }}
                        />
                        <Badge className={`absolute top-2 right-2 ${getStatusColor(service.status)}`}>
                          {service.status}
                        </Badge>
                      </div>

                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{service.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">Type: {getServiceTypeLabel(service.serviceType)}</p>

                        <div className="flex items-center justify-between mb-3">
                          <span className="text-lg font-bold text-red-600">{formatPrice(service.price || 0)}</span>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600">{service.rating || 5}</span>
                          </div>
                        </div>

                        <div className="text-sm text-gray-600 mb-4">
                          <span>Available: {getAvailableDays(service.schedule)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Eye className="w-4 h-4" />
                            <span>{service.views}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Three-dot menu positioned absolutely */}
                    <div className="absolute bottom-4 right-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm hover:bg-white/90 shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => (window.location.href = `/dashboard/products/${service.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => (window.location.href = `/dashboard/products/edit/${service.id}`)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(service)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Schedule
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredItems.map((service) => (
                        <tr key={service.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img
                                src={service.image_url || "/placeholder.svg?height=40&width=40"}
                                alt={service.name}
                                className="w-10 h-10 rounded-lg object-cover mr-3"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg?height=40&width=40"
                                }}
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900">{service.name}</div>
                                <div className="text-sm text-gray-500">{service.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getServiceTypeLabel(service.serviceType)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatPrice(service.price || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getAvailableDays(service.schedule)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getStatusColor(service.status)}>{service.status}</Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => (window.location.href = `/dashboard/products/${service.id}`)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => (window.location.href = `/dashboard/products/edit/${service.id}`)}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(service)}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
