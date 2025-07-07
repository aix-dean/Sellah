"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Package,
  Tag,
  Truck,
  Calendar,
  Eye,
  Heart,
  ShoppingCart,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Info,
  LinkIcon,
} from "lucide-react"
import { doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import DashboardLayout from "./dashboard-layout"
import { loggedGetDoc } from "@/lib/firestore-logger"
import { DeleteProductDialog } from "./delete-product-dialog"
import { deleteProduct } from "@/lib/product-service"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ProductDetailsPageProps {
  productId: string
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  specs_merchant: {
    stock: number
    length?: number
    height?: number
    weight?: number
    dimensions_not_applicable?: boolean
  }
  variations?: Array<{
    id: string
    name: string
    price: number
    stock: number
    sku?: string
    images?: string[]
    attributes?: Record<string, string>
  }>
  photo_url: string[]
  media_url?: string
  media?: Array<{
    distance: string
    isVideo: boolean
    type: string
    url: string
  }>
  categories: string[]
  delivery_option: {
    delivery: boolean
    delivery_note: string
    pickup: boolean
    pickup_note: string
    couriers: {
      lalamove: boolean
      transportify: boolean
    }
  }
  delivery_days: number
  condition: string
  status: string
  views: number
  likes: number
  sales: number
  created_at: any
  updated: any
  sku?: string
  shipping_methods?: Array<{
    name: string
    cost: number
    description?: string
  }>
  tracking_info?: {
    number: string
    carrier: string
    url?: string
  }
  userId?: string
}

export default function ProductDetailsPage({ productId }: ProductDetailsPageProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({})
  const [selectedVariationIndex, setSelectedVariationIndex] = useState(0)
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string; sku: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const productRef = doc(db, "products", productId)
        const productSnap = await loggedGetDoc(productRef)

        if (!productSnap.exists()) {
          setError("Product not found")
          return
        }

        const productData = productSnap.data()

        // Extract media URLs
        let photoUrls: string[] = []
        let mediaUrl = ""

        if (productData.media && Array.isArray(productData.media)) {
          // New format - using media array
          photoUrls = productData.media.filter((item: any) => !item.isVideo).map((item: any) => item.url)

          const videoItem = productData.media.find((item: any) => item.isVideo)
          if (videoItem) {
            mediaUrl = videoItem.url
          }
        } else {
          // Old format - using photo_url and media_url
          photoUrls = productData.photo_url || []
          mediaUrl = productData.media_url || ""
        }

        // Ensure specs_merchant exists
        const specs_merchant = productData.specs_merchant || {
          stock: productData.stock || 0,
          length: productData.length || 0,
          height: productData.height || 0,
          weight: productData.weight || 0,
        }

        setProduct({
          id: productSnap.id,
          name: productData.name || "",
          description: productData.description || "",
          price: productData.price || 0,
          specs_merchant: specs_merchant,
          variations: productData.variations || [],
          photo_url: photoUrls,
          media_url: mediaUrl,
          media: productData.media || [],
          categories: productData.categories || [],
          // Correctly initialize delivery_option as an object
          delivery_option: productData.delivery_option || {
            delivery: false,
            delivery_note: "",
            pickup: false,
            pickup_note: "",
            couriers: {
              lalamove: false,
              transportify: false,
            },
          },
          delivery_days: productData.delivery_days || 0,
          condition: productData.condition || "",
          status: productData.status || "unpublished",
          views: productData.views || 0,
          likes: productData.likes || 0,
          sales: productData.sales || 0,
          created_at: productData.created_at,
          updated: productData.updated,
          sku: productData.sku,
          shipping_methods: productData.shipping_methods || [],
          tracking_info: productData.tracking_info || null,
          userId: productData.userId,
        })

        // Fetch category names
        if (productData.categories && productData.categories.length > 0) {
          const categoryPromises = productData.categories.map(async (categoryId: string) => {
            const categoryRef = doc(db, "categories", categoryId)
            const categorySnap = await loggedGetDoc(categoryRef)
            if (categorySnap.exists()) {
              return { id: categoryId, name: categorySnap.data().name }
            }
            return { id: categoryId, name: "Unknown Category" }
          })

          const categories = await Promise.all(categoryPromises)
          const categoryMap: Record<string, string> = {}
          categories.forEach((cat) => {
            categoryMap[cat.id] = cat.name
          })
          setCategoryNames(categoryMap)
        }
      } catch (error) {
        console.error("Error fetching product:", error)
        setError("Failed to load product details")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  // Reset image index when variation changes
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [selectedVariationIndex])

  const getCurrentImages = () => {
    // If we have variations and a selected variation with its own images
    if (product?.variations && product.variations.length > 0 && product.variations[selectedVariationIndex]) {
      const selectedVariation = product.variations[selectedVariationIndex]
      if (selectedVariation.images && selectedVariation.images.length > 0) {
        return selectedVariation.images
      }
    }
    // Fall back to general product images
    return product?.photo_url || []
  }

  const nextImage = () => {
    const currentImages = getCurrentImages()
    if (currentImages && currentImages.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % currentImages.length)
    }
  }

  const prevImage = () => {
    const currentImages = getCurrentImages()
    if (currentImages && currentImages.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length)
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return "Invalid Date"
    }
  }

  const handleEdit = () => {
    window.location.href = `/dashboard/products/edit/${productId}`
  }

  const handleDelete = () => {
    if (product) {
      setProductToDelete({
        id: product.id,
        name: product.name,
        sku: product.sku || `SKU-${product.id.slice(-6)}`,
      })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete || !product) return

    setIsDeleting(true)
    try {
      // Pass both productId and userId to the deleteProduct function
      await deleteProduct(productToDelete.id, product.userId)
  const userRef = doc(db, "iboard_users", product.userId)
    await updateDoc(userRef, {
      product_count: increment(-1),
    })
      toast({
        title: "Product deleted",
        description: `${productToDelete.name} has been successfully deleted and removed from your active inventory.`,
        variant: "default",
      })

      // Redirect back to products page after successful deletion
      window.location.href = "/dashboard/products"
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

  if (loading) {
    return (
      <DashboardLayout activeItem="products">
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          <span className="ml-2 text-gray-600">Loading product details...</span>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !product) {
    return (
      <DashboardLayout activeItem="products">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={() => window.history.back()} className="mb-6">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Products
          </Button>
          <Alert variant="destructive">
            <AlertDescription>{error || "Product not found"}</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout activeItem="products">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => window.history.back()} className="flex items-center">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Products
          </Button>
          <div className="flex space-x-2">
            <Button onClick={handleEdit} className="bg-blue-500 hover:bg-blue-600 text-white">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button onClick={handleDelete} variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Product Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 text-left">{product.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant={product.status === "published" ? "success" : "secondary"}>
                  {product.status === "published" ? "Published" : "Unpublished"}
                </Badge>
                <Badge variant="outline" className="bg-gray-100">
                  Condition: {product.condition === "new" ? "New" : "Used"}
                </Badge>
                {product.variations && product.variations.length > 0 && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {product.variations[selectedVariationIndex]?.name || "Default"}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-red-500">
                {product.variations && product.variations.length > 0
                  ? `₱${product.variations[selectedVariationIndex]?.price.toLocaleString() || product.price.toLocaleString()}`
                  : `₱${product.price.toLocaleString()}`}
              </div>
              <div className="text-sm text-gray-500">
                Stock:{" "}
                {product.variations && product.variations.length > 0
                  ? `${product.variations[selectedVariationIndex]?.stock || 0} units`
                  : `${product.specs_merchant?.stock || 0} units`}
              </div>
              {product.variations && product.variations.length > 1 && (
                <div className="text-xs text-gray-400 mt-1">
                  Price range: ₱{Math.min(...product.variations.map((v) => v.price)).toLocaleString()} - ₱
                  {Math.max(...product.variations.map((v) => v.price)).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Variation Tabs - Only show if more than one variation */}
        {product.variations && product.variations.length > 1 && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 text-left">Select Variation</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {product.variations.map((variation, index) => (
                  <button
                    key={variation.id || index}
                    onClick={() => {
                      setSelectedVariationIndex(index)
                      setCurrentImageIndex(0) // Reset to first image when variation changes
                    }}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      selectedVariationIndex === index
                        ? "border-red-500 bg-red-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="font-medium text-gray-900">{variation.name}</div>
                      <div className="text-lg font-bold text-red-500">₱{variation.price.toLocaleString()}</div>
                      <div className="flex items-center justify-between">
                        <Badge variant={variation.stock > 0 ? "success" : "destructive"} className="text-xs">
                          {variation.stock} units
                        </Badge>
                        {variation.sku && <span className="text-xs text-gray-500 font-mono">{variation.sku}</span>}
                      </div>
                      {variation.attributes && Object.keys(variation.attributes).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Object.entries(variation.attributes).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {value}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Product Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Images */}
            <div
              className="bg-white rounded-lg shadow-sm border overflow-hidden"
              key={`images-${selectedVariationIndex}`}
            >
              <div className="relative h-96">
                {(() => {
                  const currentImages = getCurrentImages()
                  return currentImages && currentImages.length > 0 ? (
                    <>
                      <img
                        src={currentImages[currentImageIndex] || "/placeholder.svg"}
                        alt={`${product.name}${product.variations && product.variations.length > 0 ? ` - ${product.variations[selectedVariationIndex]?.name}` : ""}`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=384&width=600"
                        }}
                      />
                      {currentImages.length > 1 && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full"
                            onClick={prevImage}
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full"
                            onClick={nextImage}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </Button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <Package className="w-16 h-16 text-gray-400" />
                      <span className="ml-2 text-gray-500">No image available</span>
                    </div>
                  )
                })()}
              </div>

              {/* Thumbnails */}
              {(() => {
                const currentImages = getCurrentImages()
                return currentImages && currentImages.length > 1 ? (
                  <div className="p-4 flex overflow-x-auto space-x-2" key={`thumbnails-${selectedVariationIndex}`}>
                    {currentImages.map((url, index) => (
                      <div
                        key={`${selectedVariationIndex}-${index}`}
                        className={`w-16 h-16 flex-shrink-0 cursor-pointer border-2 rounded ${
                          currentImageIndex === index ? "border-red-500" : "border-transparent"
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      >
                        <img
                          src={url || "/placeholder.svg"}
                          alt={`${product.name} thumbnail ${index + 1}`}
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=64&width=64"
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : null
              })()}
            </div>

            {/* Product Video */}
            {product.media_url && (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Product Video</h2>
                <div className="aspect-video">
                  <video
                    src={product.media_url}
                    controls
                    className="w-full h-full rounded"
                    poster={product.photo_url?.[0]}
                  />
                </div>
              </div>
            )}

            {/* Tabs for Description and Specifications */}
            <div className="bg-white rounded-lg shadow-sm border">
              <Tabs defaultValue="description">
                <div className="px-6 pt-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="description">Description</TabsTrigger>
                    <TabsTrigger value="specifications">Specifications</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="description" className="p-6">
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-line text-left">{product.description}</p>
                  </div>
                </TabsContent>
                <TabsContent value="specifications" className="p-6">
                  <div className="space-y-4">
                    {product.specs_merchant?.dimensions_not_applicable ? (
                      <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div>
                          <h3 className="text-sm font-medium text-blue-800">No Physical Dimensions</h3>
                          <p className="text-sm text-blue-600 mt-1">
                            This product does not have physical dimensions. It may be a digital product, service, or an
                            item where dimensions are not applicable.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium text-gray-500">Dimensions</h3>
                          <p className="text-gray-900">
                            {product.specs_merchant?.length || 0} × {product.specs_merchant?.height || 0} cm
                          </p>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium text-gray-500">Weight</h3>
                          <p className="text-gray-900">{product.specs_merchant?.weight || 0} kg</p>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-500">Condition</h3>
                        <p className="text-gray-900 capitalize">{product.condition}</p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-500">Categories</h3>
                        <div className="flex flex-wrap gap-1">
                          {product.categories.map((categoryId) => (
                            <Badge key={categoryId} variant="secondary">
                              {categoryNames[categoryId] || "Loading..."}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Product Stats */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 text-left">
                {product.variations && product.variations.length > 0 ? "Variation Stats" : "Product Stats"}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Eye className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm text-gray-500">Views</div>
                    <div className="font-medium">{product.views}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Heart className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm text-gray-500">Likes</div>
                    <div className="font-medium">{product.likes}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <ShoppingCart className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm text-gray-500">Sales</div>
                    <div className="font-medium">{product.sales}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Tag className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm text-gray-500">Price</div>
                    <div className="font-medium">
                      {product.variations && product.variations.length > 0
                        ? `₱${product.variations[selectedVariationIndex]?.price.toLocaleString() || product.price.toLocaleString()}`
                        : `₱${product.price.toLocaleString()}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Package className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm text-gray-500">Stock</div>
                    <div className="font-medium">
                      {product.variations && product.variations.length > 0
                        ? `${product.variations[selectedVariationIndex]?.stock || 0} units`
                        : `${product.specs_merchant?.stock || 0} units`}
                    </div>
                  </div>
                </div>
                {product.variations &&
                  product.variations.length > 0 &&
                  product.variations[selectedVariationIndex]?.sku && (
                    <div className="flex items-center col-span-2">
                      <Tag className="w-5 h-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm text-gray-500">SKU</div>
                        <div className="font-medium font-mono">{product.variations[selectedVariationIndex].sku}</div>
                      </div>
                    </div>
                  )}
              </div>

              {/* Selected Variation Attributes */}
              {product.variations &&
                product.variations.length > 0 &&
                product.variations[selectedVariationIndex]?.attributes &&
                Object.keys(product.variations[selectedVariationIndex].attributes).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500 mb-2">Variation Attributes</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(product.variations[selectedVariationIndex].attributes).map(([key, value]) => (
                        <Badge key={key} variant="secondary" className="text-sm">
                          {key}: {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Shipping Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 text-left">Shipping Information</h2>
              <div className="space-y-4">
                {product.delivery_option.delivery && (
                  <div className="flex items-start">
                    <Truck className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">Delivery Available</div>
                      <div className="font-medium">Yes</div>
                      {product.delivery_option.delivery_note && (
                        <p className="text-sm text-gray-600 mt-1">{product.delivery_option.delivery_note}</p>
                      )}
                    </div>
                  </div>
                )}
                {product.delivery_option.pickup && (
                  <div className="flex items-start">
                    <Package className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">Pickup Available</div>
                      <div className="font-medium">Yes</div>
                      {product.delivery_option.pickup_note && (
                        <p className="text-sm text-gray-600 mt-1">{product.delivery_option.pickup_note}</p>
                      )}
                    </div>
                  </div>
                )}

                {(product.delivery_option.couriers.lalamove || product.delivery_option.couriers.transportify) && (
                  <div className="flex items-start">
                    <Truck className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">Supported Couriers</div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {product.delivery_option.couriers.lalamove && <Badge variant="secondary">Lalamove</Badge>}
                        {product.delivery_option.couriers.transportify && (
                          <Badge variant="secondary">Transportify</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Estimated Delivery Time</div>
                    <div className="font-medium text-left">
                      {product.delivery_days === 1
                        ? "1 day"
                        : product.delivery_days === 7
                          ? "1 week"
                          : product.delivery_days === 14
                            ? "2 weeks"
                            : product.delivery_days === 30
                              ? "1 month"
                              : `${product.delivery_days} days`}
                    </div>
                  </div>
                </div>

                {product.shipping_methods && product.shipping_methods.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Available Shipping Methods</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Method</TableHead>
                            <TableHead className="text-right">Cost</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {product.shipping_methods.map((method, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{method.name}</TableCell>
                              <TableCell className="text-right">₱{method.cost.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}

                {product.tracking_info && product.tracking_info.number && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Tracking Information</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <span className="text-gray-700 font-medium mr-2">Tracking Number:</span>
                          <span className="font-mono text-gray-900">{product.tracking_info.number}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-700 font-medium mr-2">Carrier:</span>
                          <span className="text-gray-900 capitalize">{product.tracking_info.carrier}</span>
                        </div>
                        {product.tracking_info.url && (
                          <div className="flex items-center">
                            <span className="text-gray-700 font-medium mr-2">Track Link:</span>
                            <a
                              href={product.tracking_info.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center"
                            >
                              View Tracking <LinkIcon className="w-4 h-4 ml-1" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 text-left">Product Info</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Created At</div>
                    <div className="font-medium">{formatDate(product.created_at)}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Last Updated</div>
                    <div className="font-medium">{formatDate(product.updated)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Delete Product Dialog */}
        <DeleteProductDialog
          product={productToDelete}
          isOpen={!!productToDelete}
          isDeleting={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      </div>
    </DashboardLayout>
  )
}
