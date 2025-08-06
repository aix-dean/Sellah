"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { serviceService } from "@/lib/service-service"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import ServiceFormShared from "@/components/service-form-shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from 'lucide-react'

export default function AddServicePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (serviceData: any, existingImageUrls: string[], newImageFiles: File[]) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to add a service.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // For adding a service, existingImageUrls should be empty, but we pass it for consistency
      const serviceId = await serviceService.createService(user.uid, serviceData, newImageFiles)
      toast({
        title: "Service Added",
        description: "Your service has been successfully created!",
      })
      router.push(`/dashboard/services/edit/${serviceId}`) // Redirect to edit page
    } catch (error) {
      console.error("Error adding service:", error)
      toast({
        title: "Error",
        description: "Failed to add service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Add New Service</CardTitle>
          <CardDescription>
            Fill out the form below to create a new service listing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceFormShared
            onSubmit={handleSubmit}
            isLoading={isLoading}
            submitButtonText="Create Service"
          />
        </CardContent>
      </Card>
    </div>
  )
}
