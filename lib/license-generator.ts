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

// Alias for backward compatibility
export const createLicenseDocument = generateLicenseDocument

export function validateLicenseKey(licenseKey: string): boolean {
  // Check format: XXXXX-XXXXX-XXXXX-XXXXX
  const licensePattern = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/
  return licensePattern.test(licenseKey)
}

// Add the missing validateLicenseFormat export
export const validateLicenseFormat = validateLicenseKey

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

export function createTrialLicense(userId: string, companyId: string) {
  return generateTrialLicense(userId, companyId)
}

export function formatLicenseKey(input: string): string {
  // Remove all non-alphanumeric characters and convert to uppercase
  const cleaned = input.replace(/[^A-Z0-9]/g, "").toUpperCase()

  // Add dashes every 5 characters
  const formatted = cleaned.match(/.{1,5}/g)?.join("-") || cleaned

  // Limit to 23 characters (XXXXX-XXXXX-XXXXX-XXXXX)
  return formatted.substring(0, 23)
}

export function isValidLicenseFormat(licenseKey: string): boolean {
  return validateLicenseKey(licenseKey)
}

export function parseLicenseKey(licenseKey: string) {
  const parts = licenseKey.split("-")
  if (parts.length !== 4) {
    return null
  }

  return {
    segments: parts,
    isValid: validateLicenseKey(licenseKey),
    length: licenseKey.length,
    format: "XXXXX-XXXXX-XXXXX-XXXXX",
  }
}

export function generateCompanyLicense(
  userId: string,
  companyId: string,
  licenseType: "trial" | "standard" | "premium" = "standard",
) {
  const licenseKey = generateLicenseKey()

  const baseDocument = {
    license_key: licenseKey,
    user_id: userId,
    company_id: companyId,
    created_at: new Date(),
    updated_at: new Date(),
    metadata: {
      activation_count: 0,
      last_activated: null,
      created_by: userId,
      version: "1.0",
      platform: "web",
    },
  }

  switch (licenseType) {
    case "trial":
      return {
        ...baseDocument,
        status: "trial",
        type: "trial",
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        features: {
          max_products: 100,
          max_orders: 500,
          analytics: false,
          api_access: false,
          multi_user: false,
          custom_branding: false,
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

    case "premium":
      return {
        ...baseDocument,
        status: "active",
        type: "premium",
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        features: {
          max_products: -1, // unlimited
          max_orders: -1, // unlimited
          analytics: true,
          api_access: true,
          multi_user: true,
          custom_branding: true,
        },
        permissions: {
          can_create_products: true,
          can_manage_orders: true,
          can_view_analytics: true,
          can_export_data: true,
          can_manage_users: true,
          can_access_api: true,
        },
      }

    default: // standard
      return {
        ...baseDocument,
        status: "pending_verification",
        type: "standard",
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        features: {
          max_products: 1000,
          max_orders: 10000,
          analytics: true,
          api_access: true,
          multi_user: false,
          custom_branding: false,
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
}

// Additional utility functions for license management
export function checkLicenseStatus(license: any) {
  if (!license) {
    return { status: "invalid", message: "License not found" }
  }

  if (isLicenseExpired(license.expires_at)) {
    return { status: "expired", message: "License has expired" }
  }

  if (license.status === "suspended") {
    return { status: "suspended", message: "License is suspended" }
  }

  if (license.status === "trial") {
    const daysLeft = getDaysUntilExpiration(license.expires_at)
    return {
      status: "trial",
      message: `Trial license - ${daysLeft} days remaining`,
    }
  }

  return { status: "active", message: "License is active" }
}

export function getLicenseFeatures(licenseType: string) {
  switch (licenseType) {
    case "trial":
      return {
        max_products: 100,
        max_orders: 500,
        analytics: false,
        api_access: false,
        multi_user: false,
        custom_branding: false,
      }
    case "premium":
      return {
        max_products: -1,
        max_orders: -1,
        analytics: true,
        api_access: true,
        multi_user: true,
        custom_branding: true,
      }
    default: // standard
      return {
        max_products: 1000,
        max_orders: 10000,
        analytics: true,
        api_access: true,
        multi_user: false,
        custom_branding: false,
      }
  }
}

export function canPerformAction(license: any, action: string): boolean {
  if (!license || !license.permissions) {
    return false
  }

  const permissionMap: { [key: string]: string } = {
    create_product: "can_create_products",
    manage_orders: "can_manage_orders",
    view_analytics: "can_view_analytics",
    export_data: "can_export_data",
    manage_users: "can_manage_users",
    access_api: "can_access_api",
  }

  const permission = permissionMap[action]
  return permission ? license.permissions[permission] : false
}
