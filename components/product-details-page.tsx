"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Star,
  Tag,
  DollarSign,
  Package,
  Eye,
  Heart,
  ShoppingCart,
  BookOpen,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ProductService } from "@/lib/product-service"
import { ServiceService } from "@/lib/service-service"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "@/components/ui/use-toast"
import type { Product } from "@/types/product"
import type { Service } from "@/types/service"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

type Item = Product | Service

interface ProductDetailsPageProps {
  itemId: string
}

export function ProductDetailsPage({ itemId }: ProductDetailsPageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true)
      setError(null)
      try {
        // Try fetching as a Product first
        let fetchedItem: Item | null = await ProductService.getProductById(itemId)

        // If not found as a Product or if it's explicitly a Service type, try fetching as a Service
        if (!fetchedItem || fetchedItem.type === "SERVICES") {
          fetchedItem = await ServiceService.getServiceById(itemId)
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
  }, [itemId])

  const handleDelete = async () => {
    if (!user || !item) return

    setIsDeleting(true)
    try {
      let success = false
      if (item.type === "SERVICES") {
        success = await ServiceService.deleteService(item.id)
      } else {
        success = await ProductService.deleteProduct(item.id)
      }

      if (success) {
        toast({
          title: `${item.type === "SERVICES" ? "Service" : "Product"} deleted successfully!`,
        })
        router.push("/dashboard/products")
      } else {
        toast({
          title: `Failed to delete ${item.type === "SERVICES" ? "service" : "product"}`,
          variant: "destructive",
        })
      }
    } catch (err: any) {
      console.error("Error deleting item:", err)
      toast({
        title: `Error deleting ${item.type === "SERVICES" ? "service" : "product"}`,
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Loading item details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Item not found.</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  const isService = item.type === "SERVICES"
  const imageUrls = isService ? (item as Service).imageUrls : (item as Product).photo_urls || []

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to {isService ? "Services" : "Products"}
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(isService ? `/dashboard/services/edit/${item.id}` : `/dashboard/products/edit/${item.id}`)
            }
          >
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="mr-2 h-4 w-4" /> {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will mark the {isService ? "service" : "product"} as deleted and it
                  will no longer be visible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Continue"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isService ? "Service Details" : "Product Details"}
            <Badge variant="secondary">{item.status}</Badge>
            {isService && <Badge>{(item as Service).service_type}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
          <div>
            {imageUrls && imageUrls.length > 0 ? (
              <Carousel className="w-full max-w-md mx-auto">
                <CarouselContent>
                  {imageUrls.map((url, index) => (
                    <CarouselItem key={index}>
                      <div className="relative w-full aspect-square rounded-md overflow-hidden border">
                        <Image
                          src={url || "/placeholder.svg"}
                          alt={`${item.name} image ${index + 1}`}
                          fill
                          style={{ objectFit: "cover" }}
                          className="object-center"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            ) : (
              <div className="relative w-full aspect-square rounded-md overflow-hidden border bg-muted flex items-center justify-center text-muted-foreground">
                No Image Available
              </div>
            )}
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">{item.name}</h2>
            <p className="text-2xl font-semibold text-primary">
              <DollarSign className="inline-block h-5 w-5 mr-1" />
              {item.price.toFixed(2)}
            </p>
            <p className="text-muted-foreground">{item.description}</p>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Category:</span> {item.category || "N/A"}
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Rating:</span> {item.rating?.toFixed(1) || "N/A"}
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Views:</span> {item.views}
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Likes:</span> {item.likes}
              </div>

              {isService ? (
                <>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Bookings:</span> {(item as Service).bookings}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Duration:</span> {(item as Service).duration_minutes} mins
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Sales:</span> {(item as Product).sales}
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Stock:</span> {(item as Product).stock}
                  </div>
                </>
              )}
            </div>

            {isService && (
              <>
                <Separator />
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5" /> Available Schedule
                </h3>
                <div className="space-y-2">
                  {Object.entries((item as Service).schedule || {}).map(([day, slots]) => (
                    <div key={day}>
                      <p className="font-medium">{day}:</p>
                      {slots.length > 0 ? (
                        <ul className="list-disc list-inside ml-4">
                          {slots.map((slot, idx) => (
                            <li key={idx}>
                              {slot.start} - {slot.end}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground ml-4">No slots available</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {!isService && (item as Product).variations && (item as Product).variations!.length > 0 && (
              <>
                <Separator />
                <h3 className="text-xl font-semibold">Variations</h3>
                <div className="space-y-2">
                  {(item as Product).variations!.map((variation) => (
                    <div key={variation.id} className="flex items-center justify-between border-b pb-2">
                      <span className="font-medium">{variation.name}</span>
                      <div className="flex items-center gap-4">
                        <span>Price: ${variation.price.toFixed(2)}</span>
                        <span>Stock: {variation.stock}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
