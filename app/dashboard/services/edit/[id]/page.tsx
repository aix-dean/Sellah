"use client"

import { useParams } from "next/navigation"
import { EditServicePage } from "@/components/edit-service-page"

export default function EditServicePageRoute() {
  const params = useParams()
  const serviceId = params.id as string

  return <EditServicePage serviceId={serviceId} />
}
