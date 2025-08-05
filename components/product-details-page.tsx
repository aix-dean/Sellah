"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Eye, Heart, Package, Star, Calendar, Clock, Users } from "lucide-react"
import Image from "next/image"

interface ProductDetailsPageProps {
  productId: string
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  sales: number
  views: number
  likes: number
  status: "published" | "unpublished"
  type: string
  category: string
  sku: string
  media?: Array<{ url: string; isVideo: boolean }>
  variations?: Array<{
    id: string
    name: string
    price: number
    stock: number
    media?: string
  }>
  // Service-specific fields
  serviceType?: string
  duration?: number
  bookings?: number
  rating?: number
  schedule?: {
    days: string[]
    startTime: string
    endTime: string
  }
  created_at?: any
}

export default function ProductDetailsPage({ productId }: ProductDetailsPageProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId || !user) return

      try {
        setLoading(true)
        const productDoc = await getDoc(doc(db, "products", productId))

        if (productDoc.exists()) {
          const data = productDoc.data()

          // Check if user owns this product
          if (data.seller_id !== user.uid) {
            setError("You don't have permission to view this product")
            return
          }

          // Get images from media field
          const mediaImages = Array.isArray(data.media) ? data.media.filter((item: any) => item.isVideo === false) : []

          setProduct({
            id: productDoc.id,
            name: data.name || "Untitled",
            description: data.description || "",
            price: data.price || 0,
            stock: data?.specs_merchant?.stock || data?.stock || 0,
            sales: data.sales || 0,
            views: data.views || 0,
            likes: data.likes || 0,
            status: data.status || "unpublished",
            type: data.type || "MERCHANDISE",
            category: data.categories?.[0] || "other",
            sku: data.sku || "N/A",
            media: mediaImages,
            variations: data.variations || [],
            // Service-specific fields
            serviceType: data.serviceType,
            duration: data.duration,
            bookings: data.bookings || 0,
            rating: data.rating || 5,
            schedule: data.schedule,
            created_at: data.created_at,
          })
        } else {
          setError("Product not found")
        }
      } catch (err: any) {
        console.error("Error fetching product:", err)
        setError("Failed to load product details")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId, user])

  const handleEdit = () => {
    if (product?.type === "SERVICES") {
      router.push(`/dashboard/services/edit/${productId}`)
    } else {
      router.push(`/dashboard/products/edit/${productId}`)
    }
  }

  const handleBack = () => {
    router.push("/dashboard/products")
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{error || "Product not found"}</h2>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    )
  }

  const isService = product.type === "SERVICES"
  const mainImage = product.media?.[0]?.url

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={handleBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-gray-600">{isService ? "Service" : "Product"} Details</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={product.status === "published" ? "default" : "secondary"}>{product.status}</Badge>
          <Badge variant="outline">{isService ? "Service" : "Product"}</Badge>
          <Button onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image Section */}
        <Card>
          <CardContent className="p-6">
            <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
              {mainImage ? (
                <Image src={mainImage || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>
            {product.media && product.media.length > 1 && (
              <div className="flex space-x-2 mt-4">
                {product.media.slice(1, 5).map((media, index) => (
                  <div key={index} className="w-16 h-16 relative bg-gray-100 rounded overflow-hidden">
                    <Image
                      src={media.url || "/placeholder.svg"}
                      alt={`${product.name} ${index + 2}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Section */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">{isService ? "Service Type" : "SKU"}</label>
                  <p className="font-medium">{isService ? product.serviceType || "General Service" : product.sku}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Category</label>
                  <p className="font-medium capitalize">{product.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Price</label>
                  <p className="font-medium text-lg">₱{product.price.toLocaleString()}</p>
                </div>
                {isService ? (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Duration</label>
                    <p className="font-medium">{product.duration ? `${product.duration} minutes` : "Not specified"}</p>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Stock</label>
                    <p className="font-medium">{product.stock} units</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  {isService ? <Users className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                  <div>
                    <p className="text-sm text-gray-600">{isService ? "Bookings" : "Sales"}</p>
                    <p className="font-medium">{isService ? product.bookings : product.sales}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-600">Views</p>
                    <p className="font-medium">{product.views}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-600">Likes</p>
                    <p className="font-medium">{product.likes}</p>
                  </div>
                </div>
                {isService && (
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4" />
                    <div>
                      <p className="text-sm text-gray-600">Rating</p>
                      <p className="font-medium">{product.rating}/5</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Service Schedule (Services Only) */}
          {isService && product.schedule && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Service Schedule</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Available Days</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {product.schedule.days.map((day) => (
                      <Badge key={day} variant="outline">
                        {day}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Start Time</label>
                    <p className="font-medium flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{product.schedule.startTime}</span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">End Time</label>
                    <p className="font-medium flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{product.schedule.endTime}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 whitespace-pre-wrap">
            {product.description || `No description available for this ${isService ? "service" : "product"}.`}
          </p>
        </CardContent>
      </Card>

      {/* Variations (Products Only) */}
      {!isService && product.variations && product.variations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Product Variations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {product.variations.map((variation) => (
                <div key={variation.id} className="border rounded-lg p-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <p className="font-medium">{variation.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Price</label>
                      <p className="font-medium">₱{variation.price.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Stock</label>
                      <p className="font-medium">{variation.stock} units</p>
                    </div>
                    <div>
                      {variation.media && (
                        <div className="w-12 h-12 relative bg-gray-100 rounded overflow-hidden">
                          <Image
                            src={variation.media || "/placeholder.svg"}
                            alt={variation.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
