"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { ServiceService } from "@/lib/service-service"
import { ServiceFormShared } from "./service-form-shared"
import type { CreateServiceData } from "@/types/service"

const DAYS_OF_WEEK = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
]

const SERVICE_TYPES = [
  { value: "roll_up", label: "Roll Up" },
  { value: "roll_down", label: "Roll Down" },
  { value: "delivery", label: "Delivery" },
]

interface ScheduleDay {
  available: boolean
  startTime: string
  endTime: string
}

type Schedule = {
  [key: string]: ScheduleDay
}

export default function AddServicePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (serviceData: CreateServiceData) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a service.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Create the service with type "SERVICES"
      const serviceId = await ServiceService.createService({
        ...serviceData,
        userId: user.uid,
        type: "SERVICES", // Explicitly set type to SERVICES
      })

      toast({
        title: "Service created successfully!",
        description: "Your service has been added to your inventory.",
      })

      // Redirect to the services list
      router.push("/dashboard/products?tab=services")
    } catch (error: any) {
      console.error("Error creating service:", error)
      toast({
        title: "Error creating service",
        description: error.message || "Failed to create service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4 hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Service</h1>
          <p className="text-gray-600 mt-2">Create a new service offering for your customers</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceFormShared
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitButtonText={
              isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Service...
                </>
              ) : (
                "Create Service"
              )
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
