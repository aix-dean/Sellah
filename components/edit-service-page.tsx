"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import ServiceFormShared from "@/components/service-form-shared"
import { ServiceService } from "@/lib/service-service"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import type { Service, CreateServiceData } from "@/types/service"

interface EditServicePageProps {
  serviceId: string
}

export function EditServicePage({ serviceId }: EditServicePageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [service, setService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    const fetchService = async () => {
      setIsFetching(true)
      try {
        const fetchedService = await ServiceService.getService(serviceId)
        if (fetchedService) {
          setService(fetchedService)
        } else {
          toast({
            title: "Service Not Found",
            description: "The service you are trying to edit does not exist.",
            variant: "destructive",
          })
          // Don't redirect, just show error
        }
      } catch (error) {
        console.error("Failed to fetch service:", error)
        toast({
          title: "Error",
          description: "Failed to load service data. Please try again.",
          variant: "destructive",
        })
        // Don't redirect, just show error
      } finally {
        setIsFetching(false)
      }
    }

    if (serviceId) {
      fetchService()
    }
  }, [serviceId, toast])

  const handleSubmit = async (
    serviceData: CreateServiceData,
    existingImageUrls: string[],
    newImageFiles: File[],
  ) => {
    if (!user || !service) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in and the service must be loaded to update.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Use the correct parameter order for updateService
      await ServiceService.updateService(
        service.id,
        { ...serviceData, seller_id: user.uid },
        newImageFiles,
        existingImageUrls,
      )
      toast({
        title: "Service Updated",
        description: "Your service has been successfully updated.",
      })
      // Only redirect on successful update
      router.push("/dashboard/services")
    } catch (error) {
      console.error("Failed to update service:", error)
      toast({
        title: "Error",
        description: "Failed to update service. Please try again.",
        variant: "destructive",
      })
      // Don't redirect on error, just show the error message
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Edit Service</h1>
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    )
  }

  if (!service) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Edit Service</h1>
        <div className="text-center text-gray-500 py-12">
          <p className="text-lg mb-4">Service not found or failed to load.</p>
          <p className="text-sm">Please check the service ID and try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Edit Service</h1>
      <ServiceFormShared
        initialData={service}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitButtonText="Update Service"
      />
    </div>
  )
}
