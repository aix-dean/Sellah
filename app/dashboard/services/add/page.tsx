import { Suspense } from "react"
import AddServicePage from "@/components/add-service-page"

export default function AddServicePageRoute() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddServicePage />
    </Suspense>
  )
}
