export function generateLicenseKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const segments = 4
  const segmentLength = 5

  const generateSegment = () => {
    let segment = ""
    for (let i = 0; i < segmentLength; i++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return segment
  }

  const licenseKey = Array.from({ length: segments }, generateSegment).join("-")
  return licenseKey
}

export function generateLicenseDocument(userId: string, companyId: string, licenseKey: string) {
  return {
    license_key: licenseKey,
    user_id: userId,
    company_id: companyId,
    status: "pending_verification",
    type: "standard",
    created_at: new Date(),
    updated_at: new Date(),
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    features: {
      max_products: 1000,
      max_orders: 10000,
      analytics: true,
      api_access: true,
      multi_user: false,
      custom_branding: false,
    },
    metadata: {
      activation_count: 0,
      last_activated: null,
      created_by: userId,
      version: "1.0",
      platform: "web",
    },
    permissions: {
      can_create_products: true,
      can_manage_orders: true,
      can_view_analytics: true,
      can_export_data: true,
      can_manage_users: false,
      can_access_api: true,
    },
  }
}

export function validateLicenseKey(licenseKey: string): boolean {
  // Check format: XXXXX-XXXXX-XXXXX-XXXXX
  const licensePattern = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/
  return licensePattern.test(licenseKey)
}

export function isLicenseExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt
}

export function getDaysUntilExpiration(expiresAt: Date): number {
  const now = new Date()
  const expiration = new Date(expiresAt)
  const diffTime = expiration.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

export function generateTrialLicense(userId: string, companyId: string): any {
  const licenseKey = generateLicenseKey()
  return {
    license_key: licenseKey,
    user_id: userId,
    company_id: companyId,
    status: "trial",
    type: "trial",
    created_at: new Date(),
    updated_at: new Date(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
    features: {
      max_products: 100,
      max_orders: 500,
      analytics: false,
      api_access: false,
      multi_user: false,
      custom_branding: false,
    },
    metadata: {
      activation_count: 0,
      last_activated: null,
      created_by: userId,
      version: "1.0",
      platform: "web",
      trial: true,
    },
    permissions: {
      can_create_products: true,
      can_manage_orders: true,
      can_view_analytics: false,
      can_export_data: false,
      can_manage_users: false,
      can_access_api: false,
    },
  }
}
