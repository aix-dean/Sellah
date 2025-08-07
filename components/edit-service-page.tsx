"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { serviceService } from "@/lib/service-service"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import ServiceFormShared from "@/components/service-form-shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from 'lucide-react'
import type { Service } from "@/types/service"

interface EditServicePageProps {
  serviceId: string
}

export function EditServicePage({ serviceId }: EditServicePageProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [service, setService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    const fetchService = async () => {
      if (!serviceId) {
        setDataLoading(false)
        return
      }
      try {
        const fetchedService = await serviceService.getServiceById(serviceId)
        if (fetchedService) {
          setService(fetchedService)
        } else {
          toast({
            title: "Service Not Found",
            description: "The service you are trying to edit does not exist.",
            variant: "destructive",
          })
          router.push("/dashboard/products") // Redirect if service not found
        }
      } catch (error) {
        console.error("Error fetching service:", error)
        toast({
          title: "Error",
          description: "Failed to load service data. Please try again.",
          variant: "destructive",
        })
        router.push("/dashboard/products") // Redirect on error
      } finally {
        setDataLoading(false)
      }
    }

    fetchService()
  }, [serviceId, router, toast])

  const handleSubmit = async (serviceData: any, existingImageUrls: string[], newImageFiles: File[]) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to update a service.",
        variant: "destructive",
      })
      return
    }
    if (!serviceId) {
      toast({
        title: "Error",
        description: "Service ID is missing for update.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await serviceService.updateService(serviceId, serviceData, existingImageUrls, newImageFiles)
      toast({
        title: "Service Updated",
        description: "Your service has been successfully updated!",
      })
      // Optionally re-fetch service data to reflect changes, or update state directly
      const updatedService = await serviceService.getServiceById(serviceId);
      if (updatedService) {
        setService(updatedService);
      }
    } catch (error) {
      console.error("Error updating service:", error)
      toast({
        title: "Error",
        description: "Failed to update service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!service) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-600">
        Service not found or an error occurred.
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Edit Service</CardTitle>
          <CardDescription>
            Modify the details of your service listing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceFormShared
            initialData={service}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            submitButtonText="Update Service"
          />
        </CardContent>
      </Card>
    </div>
  )
}
