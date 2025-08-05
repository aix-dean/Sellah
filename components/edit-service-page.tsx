"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import ServiceFormShared from "./service-form-shared"
import { ServiceService } from "@/lib/service-service"
import type { Service } from "@/types/service"

interface EditServicePageProps {
  serviceId: string
}

export function EditServicePage({ serviceId }: EditServicePageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingService, setIsLoadingService] = useState(true)
  const [service, setService] = useState<Service | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchService = async () => {
      if (!serviceId || !user) return

      setIsLoadingService(true)
      try {
        const fetchedService = await ServiceService.getService(serviceId)

        if (!fetchedService) {
          setError("Service not found")
          return
        }

        // Check if user owns this service
        if (fetchedService.seller_id !== user.uid) {
          setError("You don't have permission to edit this service")
          return
        }

        setService(fetchedService)
      } catch (error: any) {
        console.error("Error fetching service:", error)
        setError("Failed to load service details")
      } finally {
        setIsLoadingService(false)
      }
    }

    fetchService()
  }, [serviceId, user])

  const handleSubmit = async (serviceData: any, existingImageUrls: string[], newImageFiles: File[]) => {
    if (!user || !service) {
      toast({
        title: "Error",
        description: "You must be logged in to edit a service",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const updateData = {
        ...serviceData,
        seller_id: user.uid,
        type: "SERVICES" as const,
        status: serviceData.status || "published",
      }

      await ServiceService.updateService(serviceId, updateData, newImageFiles, existingImageUrls)

      toast({
        title: "Success",
        description: "Service updated successfully!",
      })

      router.push(`/dashboard/products/${serviceId}`)
    } catch (error: any) {
      console.error("Error updating service:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingService) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading service details...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => router.push("/dashboard/products")} variant="outline">
              Go to Products
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Not Found</h2>
            <p className="text-gray-600 mb-6">The service you're looking for doesn't exist or has been deleted.</p>
            <Button onClick={() => router.push("/dashboard/products")} variant="outline">
              Go to Products
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Service</h1>
            <p className="text-gray-600">Update your service listing</p>
          </div>
        </div>

        {/* Form */}
        <ServiceFormShared
          initialData={service}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitButtonText="Update Service"
        />
      </div>
    </div>
  )
}
