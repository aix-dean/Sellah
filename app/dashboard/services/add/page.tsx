import AddServicePage from "@/components/add-service-page"
import { ProtectedPageWrapper } from "@/components/auth/protected-page-wrapper"

export default function AddService() {
  return (
    <ProtectedPageWrapper>
      <AddServicePage />
    </ProtectedPageWrapper>
  )
}
