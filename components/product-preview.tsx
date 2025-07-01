"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ImageIcon, Play, Package, Star, Eye, Heart } from "lucide-react"

interface MediaItem {
  distance: string
  isVideo: boolean
  type: string
  url: string
}

interface ProductPreviewProps {
  name: string
  description: string
  price: string
  stock: string
  condition: string
  deliveryDays: string
  deliveryOption: string
  media: MediaItem[]
  categories: string[]
  categoryNames: { [key: string]: string }
  dimensions?: {
    length: string
    height: string
    weight: string
    notApplicable: boolean
  }
}

export function ProductPreview({
  name,
  description,
  price,
  stock,
  condition,
  deliveryDays,
  deliveryOption,
  media,
  categories,
  categoryNames,
  dimensions,
}: ProductPreviewProps) {
  const images = media.filter((item) => !item.isVideo)
  const video = media.find((item) => item.isVideo)
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0)

  const formatPrice = (priceStr: string) => {
    const price = Number.parseFloat(priceStr)
    return isNaN(price) ? "₱0.00" : `₱${price.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
  }

  const getDeliveryText = (days: string) => {
    const dayNum = Number.parseInt(days)
    if (isNaN(dayNum)) return "Not specified"

    if (dayNum === 1) return "1 day"
    if (dayNum <= 7) return `${dayNum} days`
    if (dayNum === 14) return "2 weeks"
    if (dayNum === 30) return "1 month"
    return `${dayNum} days`
  }

  const hasContent = name || description || price || images.length > 0

  if (!hasContent) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">Product Preview</h3>
            <p className="text-sm text-gray-400">
              Start filling out the product details to see a live preview of how your product will appear to customers.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        {/* Product Images/Video Section */}
        <div className="relative">
          {images.length > 0 || video ? (
            <div className="aspect-square bg-gray-100 relative overflow-hidden rounded-t-lg">
              {/* Main Media Display */}
              {images.length > 0 ? (
                <img
                  src={images[currentImageIndex]?.url || "/placeholder.svg"}
                  alt={name || "Product preview"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg?height=400&width=400&text=Image+Preview"
                  }}
                />
              ) : video ? (
                <div className="relative w-full h-full">
                  <video src={video.url} className="w-full h-full object-cover" preload="metadata" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                    <Play className="w-16 h-16 text-white opacity-80" />
                  </div>
                </div>
              ) : null}

              {/* Media Navigation Dots */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex ? "bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Media Count Badge */}
              {(images.length > 0 || video) && (
                <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
                  {images.length > 0 && `${images.length} photo${images.length > 1 ? "s" : ""}`}
                  {images.length > 0 && video && " • "}
                  {video && "1 video"}
                </div>
              )}

              {/* Condition Badge */}
              {condition && (
                <div className="absolute top-4 left-4">
                  <Badge variant={condition === "new" ? "default" : "secondary"} className="text-xs">
                    {condition.charAt(0).toUpperCase() + condition.slice(1)}
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-square bg-gray-100 flex items-center justify-center rounded-t-lg">
              <div className="text-center">
                <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No images uploaded yet</p>
              </div>
            </div>
          )}
        </div>

        {/* Product Details Section */}
        <div className="p-6 space-y-4">
          {/* Product Name */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 line-clamp-2">{name || "Product Name"}</h2>
            {!name && <p className="text-xs text-gray-400 mt-1">Enter a product name in step 1</p>}
          </div>

          {/* Price and Stock */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-red-600">{formatPrice(price)}</p>
              {!price && <p className="text-xs text-gray-400">Set price in step 3</p>}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Stock: <span className="font-medium">{stock || "0"}</span>
              </p>
              {!stock && <p className="text-xs text-gray-400">Set stock in step 3</p>}
            </div>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((categoryId) => (
                <Badge key={categoryId} variant="outline" className="text-xs">
                  {categoryNames[categoryId] || categoryId}
                </Badge>
              ))}
            </div>
          )}

          {/* Description */}
          <div>
            <p className="text-sm text-gray-600 line-clamp-3">
              {description || "Product description will appear here..."}
            </p>
            {!description && <p className="text-xs text-gray-400 mt-1">Add description in step 1</p>}
          </div>

          {/* Specifications */}
          {dimensions && !dimensions.notApplicable && (dimensions.length || dimensions.height || dimensions.weight) && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Specifications</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                {dimensions.length && (
                  <div>
                    <p className="text-gray-500">Length</p>
                    <p className="font-medium">{dimensions.length} cm</p>
                  </div>
                )}
                {dimensions.height && (
                  <div>
                    <p className="text-gray-500">Height</p>
                    <p className="font-medium">{dimensions.height} cm</p>
                  </div>
                )}
                {dimensions.weight && (
                  <div>
                    <p className="text-gray-500">Weight</p>
                    <p className="font-medium">{dimensions.weight} kg</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delivery Information */}
          {(deliveryOption || deliveryDays) && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Delivery</h4>
              <div className="space-y-1 text-sm">
                {deliveryOption && (
                  <p className="text-gray-600">
                    <span className="font-medium">Option:</span> {deliveryOption === "pickup" ? "Pick up" : "Delivery"}
                  </p>
                )}
                {deliveryDays && (
                  <p className="text-gray-600">
                    <span className="font-medium">Time:</span> {getDeliveryText(deliveryDays)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Placeholder Stats */}
          <div className="border-t pt-4 flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>0 views</span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart className="w-4 h-4" />
                <span>0 likes</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400" />
              <span>New product</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
