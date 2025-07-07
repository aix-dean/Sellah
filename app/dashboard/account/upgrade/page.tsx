import { ProtectedPageWrapper } from "@/components/auth/protected-page-wrapper"
import UpgradePage from "@/components/upgrade-page"

export default function AccountUpgradePage() {
  return (
    <ProtectedPageWrapper>
      <UpgradePage />
    </ProtectedPageWrapper>
  )
}
