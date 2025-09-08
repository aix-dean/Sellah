"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { doc, getDoc, getDocs, query, where, collection, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Terminal } from "lucide-react"

interface SalesAgent {
  id: string;
  name: string;
  email: string;
  access_points: string[];
  is_active: boolean;
  pin?: string;
  company_id: string;
}

export default function SalesAgentTerminalPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  const companySlug = params.slug as string
  const agentEmail = params.email as string

  const [salesAgent, setSalesAgent] = useState<SalesAgent | null>(null)
  const [isLoadingAgent, setIsLoadingAgent] = useState(true)
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(true)
  const [pinInput, setPinInput] = useState("")
  const [isVerifyingPin, setIsVerifyingPin] = useState(false)
  const [accessGranted, setAccessGranted] = useState(false)

  useEffect(() => {
    const fetchSalesAgent = async () => {
      if (!companySlug || !agentEmail) {
        toast({
          title: "Error",
          description: "Invalid access URL.",
          variant: "destructive",
        })
        router.push("/") // Redirect to home or an error page
        return
      }

      try {
        const q = query(
          collection(db, "sales_agents"),
          where("company_id", "==", companySlug),
          where("email", "==", agentEmail)
        )
        const querySnapshot = await getDocs(q)
        
        if (querySnapshot.docs.length > 0) {
          const agentData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as SalesAgent;
          setSalesAgent(agentData);
          // If agent has no PIN or PIN is disabled, grant access immediately
          if (!agentData.pin || agentData.is_active === false) {
            setAccessGranted(true);
            setIsPinDialogOpen(false);
          }
        } else {
          toast({
            title: "Access Denied",
            description: "Sales agent not found or inactive.",
            variant: "destructive",
          })
          router.push("/")
        }
      } catch (error) {
        console.error("Error fetching sales agent:", error)
        toast({
          title: "Error",
          description: "Failed to load sales agent data.",
          variant: "destructive",
        })
        router.push("/")
      } finally {
        setIsLoadingAgent(false)
      }
    }

    fetchSalesAgent()
  }, [companySlug, agentEmail, router, toast])

  const handlePinSubmit = async () => {
    if (!pinInput.trim()) {
      toast({
        title: "PIN Required",
        description: "Please enter your PIN to continue.",
        variant: "destructive",
      })
      return
    }

    if (!salesAgent) {
      toast({
        title: "Error",
        description: "Sales agent data not loaded.",
        variant: "destructive",
      })
      return
    }

    setIsVerifyingPin(true)
    try {
      // In production, compare hashed PINs
      if (salesAgent.pin === pinInput) {
        setAccessGranted(true)
        setIsPinDialogOpen(false)
        toast({
          title: "Access Granted",
          description: `Welcome, ${salesAgent.name}!`,
        })
      } else {
        toast({
          title: "Invalid PIN",
          description: "Please check your PIN and try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error verifying PIN:", error)
      toast({
        title: "Error",
        description: "An error occurred during PIN verification.",
        variant: "destructive",
      })
    } finally {
      setIsVerifyingPin(false)
    }
  }

  if (isLoadingAgent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p>Loading sales agent terminal...</p>
      </div>
    )
  }

  if (!accessGranted) {
    return (
      <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen} defaultOpen>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              Sales Agent Access
            </DialogTitle>
            <DialogDescription>
              Please enter your PIN to access your dedicated terminal portal.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                type="password"
                placeholder="Enter your PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handlePinSubmit()
                  }
                }}
                className="text-center text-lg tracking-widest"
                maxLength={6}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => router.push("/")} disabled={isVerifyingPin}>
              Go to Home
            </Button>
            <Button onClick={handlePinSubmit} disabled={isVerifyingPin || !pinInput.trim()}>
              {isVerifyingPin ? "Verifying..." : "Access Terminal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Terminal className="w-6 h-6 text-green-600" />
                Welcome, {salesAgent?.name || "Sales Agent"}!
              </CardTitle>
              <CardDescription>
                This is your dedicated terminal portal for <span className="font-semibold">{companySlug}</span>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Here you can access your assigned content and tools.</p>
              {/* Placeholder for actual sales agent content */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
                <p>
                  <strong>Access Point:</strong>{" "}
                  <code className="bg-blue-100 p-1 rounded">{salesAgent?.access_points[0]}</code>
                </p>
                <p className="mt-2">
                  In a full implementation, this section would display dynamic content, product listings,
                  customer management tools, or other features relevant to the sales agent's role.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}