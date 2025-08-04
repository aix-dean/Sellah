"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { ServiceService } from "@/lib/service-service"
import { ServiceFormShared } from "@/components/service-form-shared"
import { useState } from "react"
import type { Service } from "@/types/service"

export default function AddServicePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (
    formData: Omit<Service, "id" | "userId" | "createdAt" | "updatedAt" | "imageUrl">,
    imageFile?: File,
  ) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add a service",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const serviceData: Omit<Service, "id" | "createdAt" | "updatedAt" | "imageUrl"> = {
        ...formData,
        userId: user.uid,
        type: "SERVICES", // Changed from "SERVICE" to "SERVICES"
        status: "active",
        views: 0,
        bookings: 0,
        rating: 5,
      }

      await ServiceService.createService(serviceData, imageFile)

      toast({
        title: "Success",
        description: "Service added successfully!",
      })

      router.push("/dashboard/products")
    } catch (error: any) {
      console.error("Error adding service:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Wrench className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Service</h1>
          <p className="text-gray-600">Create a new service offering for your customers</p>
        </div>
      </div>
      <ServiceFormShared onSubmit={handleSubmit} isSubmitting={isSubmitting} submitButtonText="Create Service" />
    </div>
  )
}
