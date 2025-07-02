import { Suspense } from "react"
import RegistrationForm from "@/components/registration-form"

function RegistrationFormWrapper() {
  return <RegistrationForm />
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RegistrationFormWrapper />
    </Suspense>
  )
}
