"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Edit,
  Trash,
  Tag,
  DollarSign,
  Package,
  Calendar,
  Clock,
  Star,
  BookOpen,
  Eye,
  Loader2,
  Wrench,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ProductService } from "@/lib/product-service"
import { ServiceService } from "@/lib/service-service"
import { DeleteProductDialog } from "@/components/delete-product-dialog"
import { useAuth } from "@/hooks/use-auth"
import type { Product } from "@/types/product"
import type { Service } from "@/types/service"

interface ProductDetailsPageProps {
  id: string
}

export function ProductDetailsPage({ id }: ProductDetailsPageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [item, setItem] = useState<Product | Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    const fetchItem = async () => {
      if (!user) {
        setError("User not authenticated.")
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        // Try fetching as a product first
        let fetchedItem: Product | Service | null = await ProductService.getProduct(id)

        if (fetchedItem && fetchedItem.type === "SERVICES") {
          // If it's a service, fetch it specifically as a service
          fetchedItem = await ServiceService.getService(id)
        } else if (!fetchedItem) {
          // If not found as a product, try fetching as a service
          fetchedItem = await ServiceService.getService(id)
        }

        if (fetchedItem) {
          setItem(fetchedItem)
        } else {
          setError("Item not found.")
        }
      } catch (err: any) {
        console.error("Error fetching item:", err)
        setError(err.message || "Failed to load item details.")
      } finally {
        setLoading(false)
      }
    }

    fetchItem()
  }, [id, user])

  const handleDelete = async () => {
    if (!item || !user) return

    try {
      if (item.type === "MERCHANDISE") {
        await ProductService.deleteProduct(item.id, user.uid)
      } else if (item.type === "SERVICES") {
        await ServiceService.deleteService(item.id, user.uid)
      }

      toast({
        title: "Success",
        description: `${item.type === "MERCHANDISE" ? "Product" : "Service"} deleted successfully.`,
      })
      router.push("/dashboard/products")
    } catch (err: any) {
      console.error("Error deleting item:", err)
      toast({
        title: "Error",
        description: err.message || `Failed to delete ${item.type === "MERCHANDISE" ? "product" : "service"}.`,
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="ml-2 text-gray-600">Loading details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 text-lg">{error}</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600 text-lg">Item not found.</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  const isService = item.type === "SERVICES"
  const itemTitle = isService ? "Service" : "Product"
  const editPath = isService ? `/dashboard/services/edit/${item.id}` : `/dashboard/products/edit/${item.id}`

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {itemTitle}s
        </Button>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => router.push(editPath)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit {itemTitle}
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash className="w-4 h-4 mr-2" />
            Delete {itemTitle}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isService ? <Wrench className="w-6 h-6" /> : <Package className="w-6 h-6" />}
            {item.name}
            <Badge variant="secondary" className="ml-2">
              {item.status}
            </Badge>
            {isService && (
              <Badge variant="outline" className="ml-2">
                {item.serviceType.replace(/_/g, " ")}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Gallery */}
            <div className="md:col-span-1">
              {item.imageUrls && item.imageUrls.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {item.imageUrls.map((url, index) => (
                    <img
                      key={index}
                      src={url || "/placeholder.svg"}
                      alt={`${item.name} image ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                  ))}
                </div>
              ) : (
                <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                  No Image
                </div>
              )}
            </div>

            {/* Details */}
            <div className="md:col-span-1 space-y-4">
              <div>
                <h3 className="font-semibold text-lg">Description</h3>
                <p className="text-gray-700">{item.description}</p>
              </div>

              <Separator />

              <div className="flex items-center gap-2 text-lg font-medium">
                <DollarSign className="w-5 h-5 text-green-600" />
                Price: PHP {item.price.toFixed(2)}
              </div>

              <Separator />

              {isService ? (
                <>
                  <div className="flex items-center gap-2 text-lg font-medium">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Bookings: {item.bookings}
                  </div>
                  <div className="flex items-center gap-2 text-lg font-medium">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Rating: {item.rating.toFixed(1)}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-lg font-medium">
                    <Package className="w-5 h-5 text-purple-600" />
                    Stock: {(item as Product).stock}
                  </div>
                  <div className="flex items-center gap-2 text-lg font-medium">
                    <Tag className="w-5 h-5 text-orange-600" />
                    Category: {(item as Product).category}
                  </div>
                </>
              )}
              <div className="flex items-center gap-2 text-lg font-medium">
                <Eye className="w-5 h-5 text-gray-600" />
                Views: {item.views}
              </div>
            </div>
          </div>

          <Separator />

          {isService && (
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5" />
                Service Schedule
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries((item as Service).schedule).map(([day, details]) => (
                  <div key={day} className="flex items-center gap-2">
                    <Badge variant={details.available ? "default" : "outline"}>
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </Badge>
                    {details.available ? (
                      <span className="text-gray-700 flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {details.startTime} - {details.endTime}
                      </span>
                    ) : (
                      <span className="text-gray-500">Unavailable</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isService && (item as Product).variations && (item as Product).variations.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Variations</h3>
              <div className="space-y-2">
                {(item as Product).variations.map((variation, index) => (
                  <div key={index} className="flex items-center justify-between border p-3 rounded-md">
                    <span className="font-medium">{variation.name}</span>
                    <span className="text-gray-700">Stock: {variation.stock}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteProductDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        itemName={item.name}
        itemType={itemTitle}
      />
    </div>
  )
}
