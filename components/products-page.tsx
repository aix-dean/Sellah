"use client"

import type React from "react"
import { useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PaginationControls } from "@/components/pagination-controls"
import { useRealTimeProducts } from "@/hooks/use-real-time-products"
import { useUserData } from "@/hooks/use-user-data"
import { useProductsPaginated } from "@/hooks/use-products-paginated"
import { useAuth } from "@/hooks/use-auth"
import { ProductCardSkeleton } from "./skeleton/product-card-skeleton"
import { DeleteProductDialog } from "./delete-product-dialog"
import { deleteProduct, addCompany, updateUser } from "@/lib/product-service" // Corrected imports
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, MoreHorizontal, Building2, Loader2, X } from "lucide-react"

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
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"supplies" | "services">("supplies") // 'supplies' or 'services'
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<ProductToDelete | null>(null)
  const [showCompanyForm, setShowCompanyForm] = useState(false)
  const [savingCompany, setSavingCompany] = useState(false)
  const [companyError, setCompanyError] = useState("")
  const [companySuccess, setCompanySuccess] = useState("")

  const [companyData, setCompanyData] = useState<CompanyFormData>({
    name: "",
    address_street: "",
    address_city: "",
    address_province: "",
    website: "",
    position: "",
  })

  const { userData, loading: userLoading } = useUserData(user?.uid)
  const {
    data: paginatedProducts,
    loading: paginatedLoading,
    error: paginatedError,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    totalItems,
  } = useProductsPaginated(user?.uid || "", 10, searchTerm)

  const { products: realTimeProducts, loading: realTimeLoading, error: realTimeError } = useRealTimeProducts(user?.uid)

  const products = useMemo(() => {
    return paginatedProducts || realTimeProducts || []
  }, [paginatedProducts, realTimeProducts])

  const loading = paginatedLoading || realTimeLoading
  const error = paginatedError || realTimeError

  const filteredProducts = useMemo(() => {
    // In a real app, you'd filter by product type if you had a 'type' field in your product data
    // For now, we'll just return all products as the distinction is only in the UI tab.
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      return matchesSearch
    })
  }, [products, searchTerm])

  const handleDeleteClick = (product: any) => {
    setProductToDelete({
      id: product.id,
      name: product.name,
      sku: product.sku,
    })
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (productToDelete && user?.uid) {
      try {
        await deleteProduct(productToDelete.id, user.uid) // Corrected function call
        toast({
          title: "Product Deleted",
          description: "The product has been successfully deleted.",
          variant: "default",
        })
        // Optionally, refresh data or remove from local state
      } catch (err) {
        console.error("Error deleting product:", err)
        toast({
          title: "Error",
          description: "Failed to delete product. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsDeleteDialogOpen(false)
        setProductToDelete(null)
      }
    }
  }

  const handleAddButtonClick = async () => {
    if (!user) return

    // Check if user has company information
    if (!userData?.company_id) {
      console.log(JSON.stringify(user))
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

  const handleCompanyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCompanyData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

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
        created_by: user.uid,
        created_at: new Date(),
        updated_at: new Date(),
      }

      // Create company document
      const companyRef = await addCompany(newCompanyData) // Corrected function call
      const companyId = companyRef.id

      // Update user document with company ID
      await updateUser(user.uid, {
        // Corrected function call
        company_id: companyId,
        position: companyData.position,
        updated_at: new Date(),
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
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(product.price || 0)
    }
    console.log(product.variations)
    // Get all variation prices from the variations array
    const prices = product.variations
      .map((variation: any) => Number(variation.price) || 0)
      .filter((price: number) => price > 0) // Filter out invalid prices

    if (prices.length === 0) {
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(product.price || 0)
    }

    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)

    // If all variations have the same price, show single price
    if (minPrice === maxPrice) {
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(minPrice)
    }

    // Show price range
    return `${new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(minPrice)} - ${new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(maxPrice)}`
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
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    )
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
          <Button onClick={handleAddButtonClick} className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto">
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

                {companyError && <div className="bg-red-100 text-red-800 px-4 py-2 rounded mb-4">{companyError}</div>}

                {companySuccess && (
                  <div className="bg-green-100 text-green-800 px-4 py-2 rounded mb-4">{companySuccess}</div>
                )}

                <form onSubmit={handleCompanySubmit} className="space-y-4">
                  <div>
                    <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                      Company Name *
                    </label>
                    <input
                      id="company_name"
                      name="name"
                      value={companyData.name}
                      onChange={handleCompanyInputChange}
                      placeholder="Enter your company name"
                      required
                      disabled={savingCompany}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="address_street" className="block text-sm font-medium text-gray-700">
                      Street Address
                    </label>
                    <input
                      id="address_street"
                      name="address_street"
                      value={companyData.address_street}
                      onChange={handleCompanyInputChange}
                      placeholder="Enter street address (optional)"
                      disabled={savingCompany}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="address_city" className="block text-sm font-medium text-gray-700">
                        City *
                      </label>
                      <input
                        id="address_city"
                        name="address_city"
                        value={companyData.address_city}
                        onChange={handleCompanyInputChange}
                        placeholder="Enter city"
                        required
                        disabled={savingCompany}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="address_province" className="block text-sm font-medium text-gray-700">
                        Province *
                      </label>
                      <input
                        id="address_province"
                        name="address_province"
                        value={companyData.address_province}
                        onChange={handleCompanyInputChange}
                        placeholder="Enter province"
                        required
                        disabled={savingCompany}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                      Website (optional)
                    </label>
                    <input
                      id="website"
                      name="website"
                      type="url"
                      value={companyData.website}
                      onChange={handleCompanyInputChange}
                      placeholder="https://www.example.com"
                      disabled={savingCompany}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                      Your Position *
                    </label>
                    <input
                      id="position"
                      name="position"
                      value={companyData.position}
                      onChange={handleCompanyInputChange}
                      placeholder="e.g., CEO, Founder, Manager"
                      required
                      disabled={savingCompany}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 justify-end pt-4">
                    <button
                      type="button"
                      onClick={handleCloseCompanyForm}
                      disabled={savingCompany}
                      className="bg-transparent hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingCompany}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
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
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Product Dialog */}
        <DeleteProductDialog
          product={productToDelete}
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleConfirmDelete}
        />

        {/* Tabs for Supplies and Services */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
          <div className="flex items-center">
            <TabsList>
              <TabsTrigger value="supplies">Supplies</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
            </TabsList>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="w-full rounded-lg bg-gray-100 pl-8 md:w-[200px] lg:w-[336px] dark:bg-gray-800"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          <TabsContent value="supplies">
            <Card>
              <CardHeader>
                <CardTitle>Supplies</CardTitle>
                <CardDescription>Manage your product supplies.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  renderSkeletons()
                ) : error ? (
                  <div className="text-center text-red-500 py-8">Error loading products: {error.message}</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">No products found.</div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden md:table-cell">Price</TableHead>
                          <TableHead className="hidden md:table-cell">Stock</TableHead>
                          <TableHead className="hidden md:table-cell">Created At</TableHead>
                          <TableHead>
                            <span className="sr-only">Actions</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">
                              <Link href={`/dashboard/products/${product.id}`} className="hover:underline">
                                {product.name}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getStatusColor(product.status)}>
                                {product.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{getPriceFromVariations(product)}</TableCell>
                            <TableCell className="hidden md:table-cell">{getStockFromVariations(product)}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              {product.created_at?.toLocaleDateString() || "N/A"}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/dashboard/products/edit/${product.id}`}>Edit</Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteClick(product)}>Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalItems}
                      goToPage={goToPage}
                      nextPage={nextPage}
                      prevPage={prevPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>Services</CardTitle>
                <CardDescription>Manage your services.</CardDescription>
              </CardHeader>
              <CardContent>
                {/* This section will eventually list services */}
                <div className="text-center text-gray-500 py-8">
                  Services listing coming soon! Use the "Add Service" button to create a new service.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
