export async function getFirebaseConfig() {
  // Fetch config from server action to avoid exposing sensitive data
  const response = await fetch("/api/firebase-config")
  if (!response.ok) {
    throw new Error("Failed to fetch Firebase configuration")
  }
  return response.json()
}

export async function getTenantId() {
  const response = await fetch("/api/tenant-id")
  if (!response.ok) {
    throw new Error("Failed to fetch tenant ID")
  }
  const data = await response.json()
  return data.tenantId
}
