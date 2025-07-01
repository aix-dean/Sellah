import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Return Firebase configuration from environment variables
    const config = {
      apiKey: process.env.NEXT_PUBLIC_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_APP_ID,
    }

    // Validate that all required config values are present
    const requiredFields = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"]
    const missingFields = requiredFields.filter((field) => !config[field as keyof typeof config])

    if (missingFields.length > 0) {
      console.error("Missing Firebase configuration fields:", missingFields)
      return NextResponse.json({ error: "Firebase configuration incomplete" }, { status: 500 })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error("Error providing Firebase config:", error)
    return NextResponse.json({ error: "Failed to provide Firebase configuration" }, { status: 500 })
  }
}
