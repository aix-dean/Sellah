"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Database,
  User,
  Building2,
  Upload,
  FileText,
  Settings,
  Bug,
  Copy,
  RefreshCw,
} from "lucide-react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { auth, db } from "@/lib/firebase"

interface DebugStep {
  name: string
  status: "pending" | "running" | "success" | "error"
  details?: string
  error?: string
  data?: any
}

interface DebugSession {
  timestamp: string
  steps: DebugStep[]
  summary: string
  recommendations: string[]
}

export default function ProductUploadDebugger() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [debugSteps, setDebugSteps] = useState<DebugStep[]>([])
  const [isDebugging, setIsDebugging] = useState(false)
  const [debugSessions, setDebugSessions] = useState<DebugSession[]>([])
  const [testProductData, setTestProductData] = useState({
    name: "Debug Test Product",
    description: "This is a test product created by the debugger",
    categories: [],
    price: "99.99",
    stock: "10",
    delivery_option: "delivery",
    delivery_days: "3",
    condition: "new",
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
    })
    return () => unsubscribe()
  }, [])

  // Prevent server-side rendering issues
  if (typeof window === "undefined") {
    return <div>Loading...</div>
  }

  const updateStep = (stepName: string, status: DebugStep["status"], details?: string, error?: string, data?: any) => {
    setDebugSteps((prev) =>
      prev.map((step) => (step.name === stepName ? { ...step, status, details, error, data } : step)),
    )
  }

  const initializeDebugSteps = () => {
    const steps: DebugStep[] = [
      { name: "Authentication Check", status: "pending" },
      { name: "Firebase Configuration", status: "pending" },
      { name: "User Data Validation", status: "pending" },
      { name: "Company Information", status: "pending" },
      { name: "Categories Loading", status: "pending" },
      { name: "Form Data Validation", status: "pending" },
      { name: "File Upload Test", status: "pending" },
      { name: "Firestore Write Test", status: "pending" },
      { name: "Complete Product Creation", status: "pending" },
    ]
    setDebugSteps(steps)
  }

  const runDebugSession = async () => {
    setIsDebugging(true)
    initializeDebugSteps()

    const sessionSteps: DebugStep[] = []
    const recommendations: string[] = []

    try {
      // Step 1: Authentication Check
      updateStep("Authentication Check", "running")
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (!currentUser) {
        updateStep(
          "Authentication Check",
          "error",
          "No user authenticated",
          "User must be logged in to create products",
        )
        recommendations.push("Ensure user is properly logged in before attempting to create products")
        return
      }

      updateStep("Authentication Check", "success", `User authenticated: ${currentUser.email}`, undefined, {
        uid: currentUser.uid,
        email: currentUser.email,
        tenantId: currentUser.tenantId,
      })

      // Step 2: Firebase Configuration
      updateStep("Firebase Configuration", "running")
      await new Promise((resolve) => setTimeout(resolve, 300))

      try {
        const firebaseConfig = {
          apiKey: process.env.NEXT_PUBLIC_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_APP_ID,
        }

        const missingVars = Object.entries(firebaseConfig)
          .filter(([key, value]) => !value)
          .map(([key]) => key)

        if (missingVars.length > 0) {
          updateStep(
            "Firebase Configuration",
            "error",
            `Missing environment variables: ${missingVars.join(", ")}`,
            "Required Firebase configuration is incomplete",
          )
          recommendations.push("Check that all Firebase environment variables are properly set")
          return
        }

        updateStep(
          "Firebase Configuration",
          "success",
          "All Firebase environment variables configured",
          undefined,
          firebaseConfig,
        )
      } catch (error) {
        updateStep("Firebase Configuration", "error", "Firebase configuration error", error.message)
        recommendations.push("Verify Firebase configuration and environment variables")
        return
      }

      // Step 3: User Data Validation
      updateStep("User Data Validation", "running")
      await new Promise((resolve) => setTimeout(resolve, 500))

      try {
        const userRef = doc(db, "iboard_users", currentUser.uid)
        const userSnap = await getDoc(userRef)

        if (!userSnap.exists()) {
          updateStep(
            "User Data Validation",
            "error",
            "User document not found in Firestore",
            "User profile is not properly set up",
          )
          recommendations.push("Ensure user profile is created in Firestore during registration")
          return
        }

        const userData = userSnap.data()
        updateStep("User Data Validation", "success", "User data found", undefined, {
          firstName: userData.first_name,
          lastName: userData.last_name,
          companyId: userData.company_id,
        })

        // Step 4: Company Information
        updateStep("Company Information", "running")
        await new Promise((resolve) => setTimeout(resolve, 300))

        if (!userData.company_id) {
          updateStep(
            "Company Information",
            "error",
            "No company_id found in user data",
            "Company information is required for product creation",
          )
          recommendations.push("User must complete company setup before creating products")
          return
        }

        const companyRef = doc(db, "companies", userData.company_id)
        const companySnap = await getDoc(companyRef)

        if (!companySnap.exists()) {
          updateStep("Company Information", "error", "Company document not found", "Referenced company does not exist")
          recommendations.push("Verify company document exists and user has correct company_id")
          return
        }

        const companyData = companySnap.data()
        updateStep("Company Information", "success", `Company found: ${companyData.name}`, undefined, companyData)
      } catch (error) {
        updateStep("User Data Validation", "error", "Error fetching user data", error.message)
        recommendations.push("Check Firestore permissions and user document structure")
        return
      }

      // Step 5: Categories Loading
      updateStep("Categories Loading", "running")
      await new Promise((resolve) => setTimeout(resolve, 300))

      try {
        const { collection, query, where, getDocs } = await import("firebase/firestore")
        const categoriesRef = collection(db, "categories")
        const q = query(categoriesRef, where("type", "==", "MERCHANDISE"))
        const querySnapshot = await getDocs(q)

        const categories: any[] = []
        querySnapshot.forEach((doc) => {
          categories.push({ id: doc.id, ...doc.data() })
        })

        if (categories.length === 0) {
          updateStep("Categories Loading", "error", "No categories found", "No merchandise categories available")
          recommendations.push("Ensure categories collection has MERCHANDISE type categories")
          return
        }

        updateStep(
          "Categories Loading",
          "success",
          `${categories.length} categories loaded`,
          undefined,
          categories.slice(0, 3),
        )

        // Use first category for test
        testProductData.categories = [categories[0].id]
      } catch (error) {
        updateStep("Categories Loading", "error", "Error loading categories", error.message)
        recommendations.push("Check categories collection and Firestore permissions")
        return
      }

      // Step 6: Form Data Validation
      updateStep("Form Data Validation", "running")
      await new Promise((resolve) => setTimeout(resolve, 200))

      const validateStep = (step: number, formData: any): boolean => {
        switch (step) {
          case 1:
            return (
              formData.name?.trim() !== "" && formData.description?.trim() !== "" && formData.categories?.length > 0
            )
          case 3:
            return formData.price?.trim() !== "" && formData.stock?.trim() !== ""
          case 4:
            return formData.delivery_option?.trim() !== ""
          case 6:
            return formData.delivery_days?.trim() !== "" && formData.condition?.trim() !== ""
          default:
            return true
        }
      }

      const validationResults = [
        { step: 1, valid: validateStep(1, testProductData) },
        { step: 3, valid: validateStep(3, testProductData) },
        { step: 4, valid: validateStep(4, testProductData) },
        { step: 6, valid: validateStep(6, testProductData) },
      ]

      const invalidSteps = validationResults.filter((r) => !r.valid)

      if (invalidSteps.length > 0) {
        updateStep(
          "Form Data Validation",
          "error",
          `Validation failed for steps: ${invalidSteps.map((s) => s.step).join(", ")}`,
          "Form data does not meet validation requirements",
        )
        recommendations.push("Ensure all required form fields are properly filled")
        return
      }

      updateStep("Form Data Validation", "success", "All form validation passed", undefined, testProductData)

      // Step 7: File Upload Test
      updateStep("File Upload Test", "running")
      await new Promise((resolve) => setTimeout(resolve, 500))

      try {
        // Create a small test file
        const testFileContent =
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        const response = await fetch(testFileContent)
        const blob = await response.blob()
        const testFile = new File([blob], "test.png", { type: "image/png" })

        const storage = getStorage()
        const storageRef = ref(storage, `products/${currentUser?.uid || "anonymous"}/test_${Date.now()}.png`)

        await uploadBytes(storageRef, testFile)
        const downloadURL = await getDownloadURL(storageRef)

        updateStep("File Upload Test", "success", "File upload successful", undefined, { url: downloadURL })
      } catch (error) {
        updateStep("File Upload Test", "error", "File upload failed", error.message)
        recommendations.push("Check Firebase Storage permissions and configuration")
        return
      }

      // Step 8: Firestore Write Test
      updateStep("Firestore Write Test", "running")
      await new Promise((resolve) => setTimeout(resolve, 500))

      try {
        const testDoc = {
          name: "Debug Test Document",
          created_at: serverTimestamp(),
          created_by: currentUser.uid,
          test: true,
        }

        const testRef = await addDoc(collection(db, "debug_test"), testDoc)
        updateStep("Firestore Write Test", "success", `Test document created: ${testRef.id}`, undefined, {
          docId: testRef.id,
        })
      } catch (error) {
        updateStep("Firestore Write Test", "error", "Firestore write failed", error.message)
        recommendations.push("Check Firestore write permissions and rules")
        return
      }

      // Step 9: Complete Product Creation Test
      updateStep("Complete Product Creation", "running")
      await new Promise((resolve) => setTimeout(resolve, 500))

      try {
        const userRef = doc(db, "iboard_users", currentUser.uid)
        const userSnap = await getDoc(userRef)
        const userData = userSnap.data()

        const productData = {
          name: testProductData.name,
          description: testProductData.description,
          categories: testProductData.categories,
          price: Number.parseFloat(testProductData.price) || 0,
          specs_merchant: {
            stock: Number.parseInt(testProductData.stock) || 0,
          },
          delivery_option: testProductData.delivery_option,
          delivery_days: Number.parseInt(testProductData.delivery_days) || 1,
          condition: testProductData.condition,
          media: [],
          seller_id: currentUser.uid,
          seller_name: `${userData.first_name || ""} ${userData.last_name || ""}`.trim(),
          company_id: userData.company_id,
          type: "MERCHANDISE",
          active: true,
          deleted: false,
          status: "published",
          views: 0,
          likes: 0,
          sales: 0,
          created_at: serverTimestamp(),
          updated: serverTimestamp(),
          debug_test: true, // Mark as debug test
        }

        const productsRef = collection(db, "products")
        const docRef = await addDoc(productsRef, productData)

        updateStep("Complete Product Creation", "success", `Product created successfully: ${docRef.id}`, undefined, {
          productId: docRef.id,
          productData: productData,
        })
      } catch (error) {
        updateStep("Complete Product Creation", "error", "Product creation failed", error.message)
        recommendations.push("Review complete product creation flow and error details")
        return
      }
    } catch (error) {
      console.error("Debug session error:", error)
      recommendations.push("Unexpected error occurred during debugging")
    } finally {
      setIsDebugging(false)

      // Save debug session
      const session: DebugSession = {
        timestamp: new Date().toISOString(),
        steps: [...debugSteps],
        summary: generateSummary(debugSteps),
        recommendations,
      }

      setDebugSessions((prev) => [session, ...prev.slice(0, 4)]) // Keep last 5 sessions
    }
  }

  const generateSummary = (steps: DebugStep[]): string => {
    const successCount = steps.filter((s) => s.status === "success").length
    const errorCount = steps.filter((s) => s.status === "error").length
    const totalSteps = steps.length

    if (errorCount === 0) {
      return `✅ All ${totalSteps} steps completed successfully. Product upload functionality is working correctly.`
    } else if (successCount === 0) {
      return `❌ All steps failed. Critical issues preventing product uploads.`
    } else {
      return `⚠️ ${successCount}/${totalSteps} steps successful, ${errorCount} failed. Partial functionality with issues.`
    }
  }

  const getStepIcon = (status: DebugStep["status"]) => {
    switch (status) {
      case "running":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-300" />
    }
  }

  const copyDebugInfo = () => {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      user: currentUser ? { uid: currentUser.uid, email: currentUser.email } : null,
      steps: debugSteps,
      environment: {
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Server",
        url: typeof window !== "undefined" ? window.location.href : "Server",
      },
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Product Upload Debugger</h1>
        <p className="text-gray-600">Comprehensive analysis of the product creation flow to identify upload issues</p>

        <div className="flex justify-center space-x-4">
          <Button onClick={runDebugSession} disabled={isDebugging} className="bg-blue-500 hover:bg-blue-600 text-white">
            {isDebugging ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Debugging...
              </>
            ) : (
              <>
                <Bug className="w-4 h-4 mr-2" />
                Start Debug Session
              </>
            )}
          </Button>

          {debugSteps.length > 0 && (
            <Button onClick={copyDebugInfo} variant="outline">
              <Copy className="w-4 h-4 mr-2" />
              Copy Debug Info
            </Button>
          )}
        </div>
      </div>

      {/* Current Debug Session */}
      {debugSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Current Debug Session</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {debugSteps.map((step, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                  {getStepIcon(step.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{step.name}</h4>
                      <Badge
                        variant={
                          step.status === "success" ? "default" : step.status === "error" ? "destructive" : "secondary"
                        }
                        className={step.status === "success" ? "bg-green-100 text-green-800" : ""}
                      >
                        {step.status}
                      </Badge>
                    </div>
                    {step.details && <p className="text-sm text-gray-600 mt-1">{step.details}</p>}
                    {step.error && <p className="text-sm text-red-600 mt-1 font-medium">{step.error}</p>}
                    {step.data && (
                      <details className="mt-2">
                        <summary className="text-sm text-blue-600 cursor-pointer">View Data</summary>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(step.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Sessions History */}
      {debugSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Debug Sessions History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {debugSessions.map((session, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">{new Date(session.timestamp).toLocaleString()}</span>
                    <Badge variant="outline">Session {index + 1}</Badge>
                  </div>

                  <p className="text-sm mb-3">{session.summary}</p>

                  {session.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-700">Recommendations:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {session.recommendations.map((rec, recIndex) => (
                          <li key={recIndex} className="flex items-start space-x-2">
                            <AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Fixes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5" />
            <span>Common Issues & Quick Fixes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Alert>
              <User className="w-4 h-4" />
              <AlertDescription>
                <strong>Authentication Issues:</strong>
                <br />
                Ensure user is logged in and has proper tenant ID set. Check Firebase Auth configuration.
              </AlertDescription>
            </Alert>

            <Alert>
              <Building2 className="w-4 h-4" />
              <AlertDescription>
                <strong>Company Setup:</strong>
                <br />
                Users must complete company information before creating products. Check company_id in user document.
              </AlertDescription>
            </Alert>

            <Alert>
              <Database className="w-4 h-4" />
              <AlertDescription>
                <strong>Firestore Permissions:</strong>
                <br />
                Verify Firestore security rules allow authenticated users to read/write products and categories.
              </AlertDescription>
            </Alert>

            <Alert>
              <Upload className="w-4 h-4" />
              <AlertDescription>
                <strong>Storage Permissions:</strong>
                <br />
                Check Firebase Storage rules allow authenticated users to upload files to products/{currentUser.uid}/
                path.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
