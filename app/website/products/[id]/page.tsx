"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Link from "next/link"
import { ArrowLeft, ChevronLeft, ChevronRight, X, Minus, Plus } from "lucide-react"

interface ProductVariation {
  id: string
  name: string
  color?: string
  price: number
  stock: number
  image?: string
}

interface Product {
  id: string
  name: string
  description: string
  media: Array<{ url: string; type: string }>
  variations?: ProductVariation[]
  specifications?: Record<string, any>
  features?: string[]
  price?: number
  category?: string
  condition?: string
  availability_type?: string
  company_id?: string
  rating?: number
  stock?: number
}

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [galleryImageIndex, setGalleryImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null)
  const [productBriefId, setProductBriefId] = useState<string | null>(null)
  const [briefLoading, setBriefLoading] = useState(true)

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return

      try {
        const productDoc = await getDoc(doc(db, "products", productId))
        if (productDoc.exists()) {
          setProduct({ id: productDoc.id, ...productDoc.data() } as Product)
        }
      } catch (error) {
        console.error("Error fetching product:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  useEffect(() => {
    const checkProductBrief = async () => {
      if (!productId) return

      try {
        const briefsRef = collection(db, "products_brief")
        const queries = [
          query(briefsRef, where("linkedProductId", "==", productId), orderBy("createdAt", "desc")),
          query(briefsRef, where("linkedProduct", "==", productId), orderBy("createdAt", "desc")),
          query(briefsRef, where("productId", "==", productId), orderBy("createdAt", "desc")),
        ]

        console.log("[v0] Checking product brief for productId:", productId)

        for (const q of queries) {
          const querySnapshot = await getDocs(q)
          console.log("[v0] Query result:", querySnapshot.size, "documents found")

          if (!querySnapshot.empty) {
            const briefDoc = querySnapshot.docs[0] // This will now be the most recent one
            console.log("[v0] Found product brief:", briefDoc.id, briefDoc.data())
            setProductBriefId(briefDoc.id)
            break
          }
        }

        if (!productBriefId) {
          const allBriefsQuery = query(briefsRef)
          const allBriefs = await getDocs(allBriefsQuery)
          console.log(
            "[v0] All product briefs:",
            allBriefs.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
          )
        }
      } catch (error) {
        console.error("Error checking product brief:", error)
      } finally {
        setBriefLoading(false)
      }
    }

    checkProductBrief()
  }, [productId])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const allImages = getAllImages()
      if (!isGalleryOpen || allImages.length === 0) return

      if (e.key === "ArrowLeft") {
        setGalleryImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))
      } else if (e.key === "ArrowRight") {
        setGalleryImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))
      } else if (e.key === "Escape") {
        setIsGalleryOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isGalleryOpen, product?.media, product?.variations])

  const openGallery = (index: number = selectedImageIndex) => {
    setGalleryImageIndex(index)
    setIsGalleryOpen(true)
  }

  const closeGallery = () => {
    setIsGalleryOpen(false)
  }

  const navigateGallery = (direction: "prev" | "next") => {
    const allImages = getAllImages()
    if (allImages.length === 0) return

    if (direction === "prev") {
      setGalleryImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))
    } else {
      setGalleryImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))
    }
  }

  const adjustQuantity = (change: number) => {
    setQuantity((prev) => Math.max(1, prev + change))
  }

  const getAllImages = () => {
    const allImages: Array<{ url: string; type: string; source?: string }> = []

    if (product?.media) {
      allImages.push(...product.media.map((media) => ({ ...media, source: "product" })))
    }

    if (product?.variations) {
      product.variations.forEach((variation) => {
        if (variation.image) {
          allImages.push({
            url: variation.image,
            type: "image",
            source: `variation-${variation.name}`,
          })
        }
      })
    }

    return allImages
  }

  const getCurrentDisplayImage = () => {
    if (selectedVariation?.image) {
      return selectedVariation.image
    }
    return product?.media?.[selectedImageIndex]?.url || "/placeholder.svg"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          {product.company_id ? (
            <Link
              href={`/website/${product.company_id}`}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
          ) : (
            <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="w-10"></div>
        </div>

        <div className="text-center mb-4"></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {getCurrentDisplayImage() ? (
                <img
                  src={getCurrentDisplayImage() || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => openGallery(selectedImageIndex)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.media?.map((media, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImageIndex === index ? "border-blue-500" : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <img
                    src={media.url || "/placeholder.svg"}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 flex-1">{product.name}</h1>

            <div className="text-3xl font-bold text-red-600">
              ₱{(() => {
                // If a variation is selected, show its price
                if (selectedVariation?.price) {
                  return selectedVariation.price.toLocaleString()
                }

                // If product price is 0 or not set, show first variation price if available
                if (!product.price || product.price === 0) {
                  const firstVariation = product.variations?.[0]
                  if (firstVariation?.price) {
                    return firstVariation.price.toLocaleString()
                  }
                }

                // Otherwise show product price or 0
                return (product.price || 0).toLocaleString()
              })()}
            </div>

            {product.stock !== undefined && (
              <div>
                <div className="text-gray-600 mb-1">Stock</div>
                <div className="text-gray-900 font-medium">{product.stock} available</div>
              </div>
            )}

            <div>
              <div className="text-gray-600 mb-1">Shipping</div>
              <div className="text-blue-600">Standard Shipping Available</div>
            </div>

            <div>
              <div className="text-gray-600 mb-2">Quantity</div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => adjustQuantity(-1)}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center">{quantity}</span>
                <button
                  onClick={() => adjustQuantity(1)}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {product.variations && product.variations.length > 0 && (
              <div>
                <div className="text-gray-600 mb-3">Available Variations ({product.variations.length})</div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {product.variations.map((variation) => (
                    <div
                      key={variation.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedVariation?.id === variation.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => {
                        setSelectedVariation(variation)
                        if (variation.image) {
                          setSelectedImageIndex(0) // Reset to first image when showing variation image
                        }
                      }}
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {variation.image ? (
                          <img
                            src={variation.image || "/placeholder.svg"}
                            alt={variation.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{variation.name}</div>
                        <div className="text-sm text-gray-500">ID: {variation.id}</div>
                        {variation.color && <div className="text-sm text-gray-500">Color: {variation.color}</div>}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">₱{variation.price.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">Stock: {variation.stock}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {product.description && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Product Description:</h2>
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </div>
        )}

        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Specifications:</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                    <span className="font-medium text-gray-700 capitalize">{key.replace(/_/g, " ")}:</span>
                    <span className="text-gray-600">
                      {typeof value === "object" ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {!briefLoading && productBriefId && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
          <Link
            href={`/website/product-brief/${productBriefId}/typeform`}
            className="bg-blue-600 text-white py-3 px-8 rounded-full font-medium hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center"
          >
            Product Brief
          </Link>
        </div>
      )}

      {isGalleryOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
            <h2 className="text-white text-lg font-medium">Gallery</h2>
            <button onClick={closeGallery} className="text-white hover:text-gray-300 transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="relative w-full h-full flex items-center justify-center px-16 py-20">
            <img
              src={getAllImages()[galleryImageIndex]?.url || "/placeholder.svg"}
              alt={`${product.name} ${galleryImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            <button
              onClick={() => navigateGallery("prev")}
              className="absolute left-6 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            <button
              onClick={() => navigateGallery("next")}
              className="absolute right-6 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex justify-center gap-2 overflow-x-auto pb-2">
              {getAllImages().map((image, index) => (
                <button
                  key={index}
                  onClick={() => setGalleryImageIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    galleryImageIndex === index ? "border-white" : "border-transparent hover:border-gray-400"
                  }`}
                >
                  <img
                    src={image.url || "/placeholder.svg"}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="absolute bottom-6 right-6 text-white text-sm">
            {galleryImageIndex + 1}/{getAllImages().length}
          </div>
        </div>
      )}
    </div>
  )
}
