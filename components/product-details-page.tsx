"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  Clock,
  Star,
  Users,
  Wrench,
  DollarSign,
} from "lucide-react"
import { doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { loggedGetDoc } from "@/lib/firestore-logger"
import { DeleteProductDialog } from "./delete-product-dialog"
import { deleteProduct } from "@/lib/product-service"
import { useToast } from "@/hooks/use-toast"

interface ProductDetailsPageProps {
  productId: string
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  specs_merchant?: {
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
  photo_url?: string[]
  imageUrls?: string[]
  media_url?: string
  media?: Array<{
    distance: string
    isVideo: boolean
    type: string
    url: string
  }>
  categories?: string[]
  delivery_options?: {
    delivery: boolean
    delivery_note: string
    pickup: boolean
    pickup_note: string
    couriers: {
      lalamove: boolean
      transportify: boolean
    }
  }
  delivery_days?: number
  condition?: string
  status: string
  views: number
  likes: number
  sales?: number
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
  type: string
  // Service-specific fields
  serviceType?: "roll_up" | "roll_down" | "delivery"
  schedule?: {
    [key: string]: {
      available: boolean
      startTime: string
      endTime: string
    }
  }
  bookings?: number
  rating?: number
  stock?: number
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

  const isService = product?.type === "SERVICES"

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

        // Extract media URLs based on product type
        let photoUrls: string[] = []
        let mediaUrl = ""

        if (productData.type === "SERVICES") {
          // For services, use imageUrls
          photoUrls = productData.imageUrls || []
        } else {
          // For merchandise, use existing logic
          if (productData.media && Array.isArray(productData.media)) {
            photoUrls = productData.media.filter((item: any) => !item.isVideo).map((item: any) => item.url)
            const videoItem = productData.media.find((item: any) => item.isVideo)
            if (videoItem) {
              mediaUrl = videoItem.url
            }
          } else {
            photoUrls = productData.photo_url || []
            mediaUrl = productData.media_url || ""
          }
        }

        // Ensure specs_merchant exists for merchandise
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
          imageUrls: photoUrls,
          media_url: mediaUrl,
          media: productData.media || [],
          categories: productData.categories || [],
          delivery_options: productData.delivery_options || {
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
          type: productData.type || "MERCHANDISE",
          // Service-specific fields
          serviceType: productData.serviceType,
          schedule: productData.schedule || {},
          bookings: productData.bookings || 0,
          rating: productData.rating || 5,
          stock: productData.stock || 0,
        })

        // Fetch category names if categories exist
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
    if (
      !isService &&
      product?.variations &&
      product.variations.length > 0 &&
      product.variations[selectedVariationIndex]
    ) {
      const selectedVariation = product.variations[selectedVariationIndex]
      if (selectedVariation.images && selectedVariation.images.length > 0) {
        return selectedVariation.images
      }
    }
    return product?.imageUrls || product?.photo_url || []
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

  const formatTime = (time: string) => {
    if (!time) return ""
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case "roll_up":
        return "Roll Up"
      case "roll_down":
        return "Roll Down"
      case "delivery":
        return "Delivery"
      default:
        return type
    }
  }

  const handleEdit = () => {
    if (isService) {
      window.location.href = `/dashboard/services/edit/${productId}`
    } else {
      window.location.href = `/dashboard/products/edit/${productId}`
    }
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
      await deleteProduct(productToDelete.id, product.userId)
      toast({
        title: `${isService ? "Service" : "Product"} deleted`,
        description: `${productToDelete.name} has been successfully deleted and removed from your active inventory.`,
        variant: "default",
      })
      window.location.href = "/dashboard/products"
    } catch (error: any) {
      console.error(`Error deleting ${isService ? "service" : "product"}:`, error)
      toast({
        title: "Error",
        description: error.message || `Failed to delete ${isService ? "service" : "product"}. Please try again.`,
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
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        <span className="ml-2 text-gray-600">Loading {isService ? "service" : "product"} details...</span>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => window.history.back()} className="mb-6">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to {isService ? "Services" : "Products"}
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error || `${isService ? "Service" : "Product"} not found`}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => window.history.back()} className="flex items-center">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to {isService ? "Services" : "Products"}
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

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 text-left">{product.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant={product.status === "published" || product.status === "active" ? "success" : "secondary"}>
                {product.status === "published" || product.status === "active" ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {isService ? (
                  <>
                    <Wrench className="w-3 h-3 mr-1" />
                    Service
                  </>
                ) : (
                  <>
                    <Package className="w-3 h-3 mr-1" />
                    Product
                  </>
                )}
              </Badge>
              {isService && product.serviceType && (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {getServiceTypeLabel(product.serviceType)}
                </Badge>
              )}
              {!isService && product.condition && (
                <Badge variant="outline" className="bg-gray-100">
                  Condition: {product.condition === "new" ? "New" : "Used"}
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-red-500 flex items-center justify-end">
              <DollarSign className="w-6 h-6 mr-1" />
              {product.price.toLocaleString()}
            </div>
            {!isService && (
              <div className="text-sm text-gray-500">
                Stock: {product.specs_merchant?.stock || product.stock || 0} units
              </div>
            )}
            {isService && <div className="text-sm text-gray-500">Bookings: {product.bookings || 0}</div>}
          </div>
        </div>
      </div>

      {/* Variation Tabs - Only for merchandise with variations */}
      {!isService && product.variations && product.variations.length > 1 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 text-left">Select Variation</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {product.variations.map((variation, index) => (
                <button
                  key={variation.id || index}
                  onClick={() => {
                    setSelectedVariationIndex(index)
                    setCurrentImageIndex(0)
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
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Images */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="relative h-96">
              {(() => {
                const currentImages = getCurrentImages()
                return currentImages && currentImages.length > 0 ? (
                  <>
                    <img
                      src={currentImages[currentImageIndex] || "/placeholder.svg"}
                      alt={product.name}
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
                    {isService ? (
                      <Wrench className="w-16 h-16 text-gray-400" />
                    ) : (
                      <Package className="w-16 h-16 text-gray-400" />
                    )}
                    <span className="ml-2 text-gray-500">No image available</span>
                  </div>
                )
              })()}
            </div>

            {/* Thumbnails */}
            {(() => {
              const currentImages = getCurrentImages()
              return currentImages && currentImages.length > 1 ? (
                <div className="p-4 flex overflow-x-auto space-x-2">
                  {currentImages.map((url, index) => (
                    <div
                      key={index}
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

          {/* Service Schedule - Only for services */}
          {isService && product.schedule && Object.keys(product.schedule).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 text-left flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Service Schedule
              </h2>
              <div className="space-y-3">
                {Object.entries(product.schedule).map(([day, schedule]) => (
                  <div key={day} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="font-medium capitalize">{day}</span>
                    </div>
                    <div className="flex items-center">
                      {schedule.available ? (
                        <div className="flex items-center text-green-600">
                          <Clock className="w-4 h-4 mr-1" />
                          <span className="text-sm">
                            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="secondary">Closed</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 text-left">Description</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-line text-left">{product.description}</p>
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 text-left">
              {isService ? "Service Stats" : "Product Stats"}
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
                {isService ? (
                  <Users className="w-5 h-5 text-gray-400 mr-2" />
                ) : (
                  <ShoppingCart className="w-5 h-5 text-gray-400 mr-2" />
                )}
                <div>
                  <div className="text-sm text-gray-500">{isService ? "Bookings" : "Sales"}</div>
                  <div className="font-medium">{isService ? product.bookings : product.sales}</div>
                </div>
              </div>
              <div className="flex items-center">
                <Tag className="w-5 h-5 text-gray-400 mr-2" />
                <div>
                  <div className="text-sm text-gray-500">Price</div>
                  <div className="font-medium">₱{product.price.toLocaleString()}</div>
                </div>
              </div>
              {!isService && (
                <div className="flex items-center">
                  <Package className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm text-gray-500">Stock</div>
                    <div className="font-medium">{product.specs_merchant?.stock || product.stock || 0} units</div>
                  </div>
                </div>
              )}
              {isService && (
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm text-gray-500">Rating</div>
                    <div className="font-medium">{product.rating || 5}/5</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Info - Only for merchandise */}
          {!isService && product.delivery_options && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 text-left">Shipping Information</h2>
              <div className="space-y-4">
                {product.delivery_options.delivery && (
                  <div className="flex items-start">
                    <Truck className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">Delivery Available</div>
                      <div className="font-medium">Yes</div>
                      {product.delivery_options.delivery_note && (
                        <p className="text-sm text-gray-600 mt-1">{product.delivery_options.delivery_note}</p>
                      )}
                    </div>
                  </div>
                )}
                {product.delivery_options.pickup && (
                  <div className="flex items-start">
                    <Package className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">Pickup Available</div>
                      <div className="font-medium">Yes</div>
                      {product.delivery_options.pickup_note && (
                        <p className="text-sm text-gray-600 mt-1">{product.delivery_options.pickup_note}</p>
                      )}
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
              </div>
            </div>
          )}

          {/* Service Information - Only for services */}
          {isService && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 text-left">Service Information</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Wrench className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Service Type</div>
                    <div className="font-medium">{getServiceTypeLabel(product.serviceType || "")}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Total Bookings</div>
                    <div className="font-medium">{product.bookings || 0}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Rating</div>
                    <div className="font-medium">{product.rating || 5}/5</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Product/Service Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 text-left">
              {isService ? "Service" : "Product"} Info
            </h2>
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
              {!isService && product.sku && (
                <div className="flex items-center">
                  <Tag className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">SKU</div>
                    <div className="font-medium font-mono">{product.sku}</div>
                  </div>
                </div>
              )}
              {!isService && product.categories && product.categories.length > 0 && (
                <div className="flex items-start">
                  <Tag className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Categories</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {product.categories.map((categoryId) => (
                        <Badge key={categoryId} variant="secondary">
                          {categoryNames[categoryId] || "Loading..."}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <DeleteProductDialog
        product={productToDelete}
        isOpen={!!productToDelete}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  )
}
