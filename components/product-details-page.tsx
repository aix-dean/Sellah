"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Edit, Trash2, Package, Calendar, Clock, MapPin, Star, Users, ChevronLeft, ChevronRight, Wrench, ShoppingBag } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import type { Product } from "@/types/product"
import type { Service } from "@/types/service"

interface ProductDetailsPageProps {
  productId: string
}

export default function ProductDetailsPage({ productId }: ProductDetailsPageProps) {
  const [product, setProduct] = useState<Product | Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const { currentUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId || !currentUser) return

      try {
        const productDoc = await getDoc(doc(db, "products", productId))
        if (productDoc.exists()) {
          const productData = productDoc.data() as Product | Service
          setProduct({ ...productData, id: productDoc.id })
        } else {
          toast({
            title: "Product not found",
            description: "The product you're looking for doesn't exist.",
            variant: "destructive",
          })
          router.push("/dashboard/products")
        }
      } catch (error) {
        console.error("Error fetching product:", error)
        toast({
          title: "Error",
          description: "Failed to load product details.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId, currentUser, router])

  const handleDelete = async () => {
    if (!product || !currentUser) return

    setDeleting(true)
    try {
      await deleteDoc(doc(db, "products", product.id))
      toast({
        title: "Success",
        description: `${product.type === "SERVICES" ? "Service" : "Product"} deleted successfully.`,
      })
      router.push("/dashboard/products")
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete product.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const handleEdit = () => {
    if (!product) return
    
    if (product.type === "SERVICES") {
      router.push(`/dashboard/services/edit/${product.id}`)
    } else {
      router.push(`/dashboard/products/edit/${product.id}`)
    }
  }

  // Get current images based on product type
  const getCurrentImages = (): string[] => {
    if (!product) return []
    
    if (product.type === "SERVICES") {
      const service = product as Service
      // For services, prioritize imageUrls array, fallback to imageUrl
      if (service.imageUrls && service.imageUrls.length > 0) {
        return service.imageUrls
      } else if (service.imageUrl) {
        return [service.imageUrl]
      }
    } else {
      const merchandise = product as Product
      // For merchandise, use images array or fallback to imageUrl
      if (merchandise.images && merchandise.images.length > 0) {
        return merchandise.images
      } else if (merchandise.imageUrl) {
        return [merchandise.imageUrl]
      }
    }
    
    return []
  }

  const images = getCurrentImages()

  const nextImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }
  }

  const prevImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }

  const goToImage = (index: number) => {
    setCurrentImageIndex(index)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Button onClick={() => router.push("/dashboard/products")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    )
  }

  const isService = product.type === "SERVICES"
  const service = isService ? (product as Service) : null
  const merchandise = !isService ? (product as Product) : null

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/products")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {isService ? "Services" : "Products"}
        </Button>
        
        <div className="flex items-center gap-2">
          <Button onClick={handleEdit} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete the {isService ? "service" : "product"}.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Section */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {images.length > 0 ? (
              <>
                <img
                  src={images[currentImageIndex] || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Navigation buttons */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors shadow-lg"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors shadow-lg"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    
                    {/* Image counter */}
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                {isService ? <Wrench className="h-16 w-16" /> : <ShoppingBag className="h-16 w-16" />}
              </div>
            )}
          </div>
          
          {/* Thumbnail navigation */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    index === currentImageIndex ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={image || "/placeholder.svg"}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <Badge variant={isService ? "secondary" : "default"}>
                {isService ? "Service" : "Product"}
              </Badge>
            </div>
            <p className="text-2xl font-semibold text-green-600">
              ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
            </p>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          </div>

          <Separator />

          {/* Service-specific details */}
          {isService && service && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Service Details
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {service.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Duration: {service.duration}</span>
                  </div>
                )}
                
                {service.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Location: {service.location}</span>
                  </div>
                )}
                
                {service.availability && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Available: {service.availability}</span>
                  </div>
                )}
                
                {service.maxParticipants && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Max participants: {service.maxParticipants}</span>
                  </div>
                )}
              </div>

              {/* Service Scope */}
              {service.scope && (
                <div>
                  <h4 className="font-medium mb-2">Service Coverage</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={service.scope === "nationwide" ? "default" : "secondary"}>
                      {service.scope === "nationwide" ? "Nationwide" : "Regional"}
                    </Badge>
                  </div>
                  {service.scope === "regional" && service.regions && service.regions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {service.regions.map((region, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {region}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {service.requirements && service.requirements.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Requirements</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {service.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {service.inclusions && service.inclusions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">What's Included</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {service.inclusions.map((inclusion, index) => (
                      <li key={index}>{inclusion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Product-specific details */}
          {!isService && merchandise && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Details
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {merchandise.sku && (
                  <div>
                    <span className="text-sm font-medium">SKU:</span>
                    <span className="text-sm text-gray-600 ml-2">{merchandise.sku}</span>
                  </div>
                )}
                
                {merchandise.stock !== undefined && (
                  <div>
                    <span className="text-sm font-medium">Stock:</span>
                    <span className="text-sm text-gray-600 ml-2">{merchandise.stock} units</span>
                  </div>
                )}
                
                {merchandise.weight && (
                  <div>
                    <span className="text-sm font-medium">Weight:</span>
                    <span className="text-sm text-gray-600 ml-2">{merchandise.weight}</span>
                  </div>
                )}
                
                {merchandise.dimensions && (
                  <div>
                    <span className="text-sm font-medium">Dimensions:</span>
                    <span className="text-sm text-gray-600 ml-2">{merchandise.dimensions}</span>
                  </div>
                )}
              </div>

              {merchandise.variations && merchandise.variations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Available Variations</h4>
                  <div className="flex flex-wrap gap-2">
                    {merchandise.variations.map((variation, index) => (
                      <Badge key={index} variant="outline">
                        {variation.name}: {variation.options.join(", ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {merchandise.categories && merchandise.categories.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {merchandise.categories.map((category, index) => (
                      <Badge key={index} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Status and Timestamps */}
          <div className="space-y-2 text-sm text-gray-500">
            <div>Status: <Badge variant="outline">{product.status}</Badge></div>
            {product.createdAt && (
              <div>Created: {new Date(product.createdAt.seconds * 1000).toLocaleDateString()}</div>
            )}
            {product.updatedAt && (
              <div>Updated: {new Date(product.updatedAt.seconds * 1000).toLocaleDateString()}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
