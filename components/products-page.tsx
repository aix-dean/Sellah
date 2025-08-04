"use client"

import { useState } from "react"
import { Plus, Search, Grid, List, Package, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useProducts } from "@/hooks/use-products"
import { useAuth } from "@/hooks/use-auth"
import { ProductCardSkeleton } from "@/components/skeleton/product-card-skeleton"
import { DeleteProductDialog } from "@/components/delete-product-dialog"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  stock: number
  imageUrl?: string
  type: "PRODUCT" | "SERVICE"
  serviceType?: "roll_up" | "roll_down" | "delivery"
  schedule?: {
    [key: string]: {
      available: boolean
      startTime: string
      endTime: string
    }
  }
}

export default function ProductsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [activeTab, setActiveTab] = useState("products")
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)

  const { products, loading, error, categories, deleteProduct } = useProducts(user?.uid)

  // Filter products based on type and active tab
  const filteredProducts =
    products?.filter((product: Product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
      const matchesType = activeTab === "products" ? product.type === "PRODUCT" : product.type === "SERVICE"

      return matchesSearch && matchesCategory && matchesType
    }) || []

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(productId)
      setDeleteProductId(null)
    } catch (error) {
      console.error("Error deleting product:", error)
    }
  }

  const handleAddClick = () => {
    if (activeTab === "services") {
      router.push("/dashboard/services/add")
    } else {
      router.push("/dashboard/products/add")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Products & Services</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading products: {error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Products & Services</h1>
        <Button onClick={handleAddClick} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {activeTab === "services" ? "Add Service" : "Add Product"}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Services
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Products Grid/List */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || categoryFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first product"}
              </p>
              <Button onClick={handleAddClick}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {filteredProducts.map((product: Product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  viewMode={viewMode}
                  onDelete={() => setDeleteProductId(product.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          {/* Search and Filters for Services */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="roll_up">Roll Up</SelectItem>
                <SelectItem value="roll_down">Roll Down</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Services Grid/List */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || categoryFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first service"}
              </p>
              <Button onClick={handleAddClick}>
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {filteredProducts.map((product: Product) => (
                <ServiceCard
                  key={product.id}
                  service={product}
                  viewMode={viewMode}
                  onDelete={() => setDeleteProductId(product.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <DeleteProductDialog
        isOpen={!!deleteProductId}
        onClose={() => setDeleteProductId(null)}
        onConfirm={() => deleteProductId && handleDeleteProduct(deleteProductId)}
        productName={products?.find((p) => p.id === deleteProductId)?.name || ""}
      />
    </div>
  )
}

function ProductCard({
  product,
  viewMode,
  onDelete,
}: {
  product: Product
  viewMode: "grid" | "list"
  onDelete: () => void
}) {
  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl || "/placeholder.svg"}
                  alt={product.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{product.name}</h3>
              <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{product.category}</Badge>
                <span className="text-sm text-gray-500">Stock: {product.stock}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">${product.price}</p>
              <div className="flex gap-2 mt-2">
                <Link href={`/dashboard/products/${product.id}`}>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </Link>
                <Link href={`/dashboard/products/edit/${product.id}`}>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={onDelete}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="p-0">
        <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl || "/placeholder.svg"}
              alt={product.name}
              width={300}
              height={300}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
            <p className="text-xl font-bold">${product.price}</p>
          </div>
          <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
          <div className="flex items-center justify-between">
            <Badge variant="secondary">{product.category}</Badge>
            <span className="text-sm text-gray-500">Stock: {product.stock}</span>
          </div>
          <div className="flex gap-2 pt-2">
            <Link href={`/dashboard/products/${product.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full bg-transparent">
                View
              </Button>
            </Link>
            <Link href={`/dashboard/products/edit/${product.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full bg-transparent">
                Edit
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={onDelete}>
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ServiceCard({
  service,
  viewMode,
  onDelete,
}: {
  service: Product
  viewMode: "grid" | "list"
  onDelete: () => void
}) {
  const getServiceTypeLabel = (type?: string) => {
    switch (type) {
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

  const getAvailableDays = () => {
    if (!service.schedule) return "No schedule set"
    const days = Object.entries(service.schedule)
      .filter(([_, schedule]) => schedule.available)
      .map(([day, _]) => day.charAt(0).toUpperCase() + day.slice(1))
    return days.length > 0 ? days.join(", ") : "No days available"
  }

  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
              {service.imageUrl ? (
                <Image
                  src={service.imageUrl || "/placeholder.svg"}
                  alt={service.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{service.name}</h3>
              <p className="text-gray-600 text-sm line-clamp-2">{service.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{getServiceTypeLabel(service.serviceType)}</Badge>
                <span className="text-sm text-gray-500">{getAvailableDays()}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">${service.price}</p>
              <div className="flex gap-2 mt-2">
                <Link href={`/dashboard/products/${service.id}`}>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </Link>
                <Link href={`/dashboard/products/edit/${service.id}`}>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={onDelete}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="p-0">
        <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
          {service.imageUrl ? (
            <Image
              src={service.imageUrl || "/placeholder.svg"}
              alt={service.name}
              width={300}
              height={300}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Wrench className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-lg line-clamp-1">{service.name}</h3>
            <p className="text-xl font-bold">${service.price}</p>
          </div>
          <p className="text-gray-600 text-sm line-clamp-2">{service.description}</p>
          <div className="flex items-center justify-between">
            <Badge variant="secondary">{getServiceTypeLabel(service.serviceType)}</Badge>
          </div>
          <div className="text-sm text-gray-500">Available: {getAvailableDays()}</div>
          <div className="flex gap-2 pt-2">
            <Link href={`/dashboard/products/${service.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full bg-transparent">
                View
              </Button>
            </Link>
            <Link href={`/dashboard/products/edit/${service.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full bg-transparent">
                Edit
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={onDelete}>
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
