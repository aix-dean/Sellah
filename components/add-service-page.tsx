"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import ServiceFormShared from "./service-form-shared"
import { ServiceService } from "@/lib/service-service"
import type { CreateServiceData } from "@/types/service"

export function AddServicePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (serviceData: CreateServiceData, existingImageUrls: string[], newImageFiles: File[]) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a service",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const serviceToCreate: Omit<CreateServiceData, "imageUrls"> = {
        ...serviceData,
        seller_id: user.uid,
        type: "SERVICES",
        // Map availability to status for Firestore
        status: serviceData.availability === "available" ? "published" : "draft",
      }

      const serviceId = await ServiceService.createService(serviceToCreate, newImageFiles)

      toast({
        title: "Success",
        description: "Service created successfully!",
      })

      router.push(`/dashboard/products/${serviceId}`) // Redirect to product details page after creation
    } catch (error: any) {
      console.error("Error creating service:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Add New Service</h1>
            <p className="text-gray-600">Create a new service listing</p>
          </div>
        </div>

        {/* Form */}
        <ServiceFormShared
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitButtonText="Create Service"
        />
      </div>
    </div>
  )
}
