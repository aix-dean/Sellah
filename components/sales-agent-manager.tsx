"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useUserData } from "@/hooks/use-user-data"
import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { User, Mail, Lock, PlusCircle, Trash2, Edit, ExternalLink, QrCode, Copy } from "lucide-react"
import { Separator } from "@/components/ui/separator"

// Function to generate a simple unique ID (replace with a proper UUID library like 'uuid' if available)
const generateUniqueId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

interface SalesAgent {
  id: string;
  name: string;
  email: string;
  access_points: string[];
  is_active: boolean;
  pin?: string; // Optional PIN for access
  access_id: string; // New field for unique access ID
}

// New component for displaying sales agent link with show/QR options
const SalesAgentLinkDisplay = ({ agent, companyId }: { agent: SalesAgent; companyId: string }) => {
  const [showLink, setShowLink] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const { toast } = useToast();

  const salesAgentLink = agent.access_points[0]?.replace(/\/sales-agent-portal$/, '') || `/website/${companyId}/sales-agent/${agent.access_id}`;

  const copyLinkToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(salesAgentLink);
      toast({
        title: "Link Copied",
        description: "Sales agent link has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const generateQRCode = () => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(salesAgentLink)}`;
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowLink(!showLink)}>
          <ExternalLink className="w-3 h-3 mr-1" />
          {showLink ? "Hide Link" : "Show Link"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowQRCode(!showQRCode)}>
          <QrCode className="w-3 h-3 mr-1" />
          {showQRCode ? "Hide QR" : "Show QR"}
        </Button>
      </div>
      {showLink && (
        <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-md border">
          <a
            href={salesAgentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline break-all"
          >
            {salesAgentLink}
          </a>
          <Button variant="ghost" size="icon" onClick={copyLinkToClipboard} className="h-7 w-7">
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      )}
      {showQRCode && (
        <div className="flex justify-center pt-2">
          <div className="p-2 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
            <img
              src={generateQRCode() || "/placeholder.svg"}
              alt="Sales Agent QR Code"
              className="w-32 h-32 rounded-lg"
            />
            <p className="text-center text-xs text-gray-600 mt-1">Scan to access</p>
          </div>
        </div>
      )}
    </div>
  );
};

export function SalesAgentManager() {
  const { userData } = useUserData()
  const { toast } = useToast()

  const [isAddAgentDialogOpen, setIsAddAgentDialogOpen] = useState(false)
  const [newAgentName, setNewAgentName] = useState("")
  const [newAgentEmail, setNewAgentEmail] = useState("")
  const [newAgentPin, setNewAgentPin] = useState("")
  const [confirmNewAgentPin, setConfirmNewAgentPin] = useState("")
  const [isAddingAgent, setIsAddingAgent] = useState(false)
  const [salesAgents, setSalesAgents] = useState<SalesAgent[]>([])
  const [isLoadingAgents, setIsLoadingAgents] = useState(true)
  const [isEditAgentDialogOpen, setIsEditAgentDialogOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<SalesAgent | null>(null)
  const [editAgentName, setEditAgentName] = useState("")
  const [editAgentEmail, setEditAgentEmail] = useState("")
  const [editAgentPin, setEditAgentPin] = useState("")
  const [confirmEditAgentPin, setConfirmEditAgentPin] = useState("")
  const [isUpdatingAgent, setIsUpdatingAgent] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [agentToDelete, setAgentToDelete] = useState<SalesAgent | null>(null)
  const [isDeletingAgent, setIsDeletingAgent] = useState(false)

  const companyId = userData?.company_id || "company" // Fallback for companyId

  // Fetch sales agents
  const fetchSalesAgents = async () => {
    if (!userData?.company_id) return

    setIsLoadingAgents(true)
    try {
      const q = query(collection(db, "sales_agents"), where("company_id", "==", userData.company_id))
      const querySnapshot = await getDocs(q)
      const agents: SalesAgent[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SalesAgent[]
      setSalesAgents(agents)
    } catch (error) {
      console.error("Error fetching sales agents:", error)
      toast({
        title: "Error",
        description: "Failed to load sales agents.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingAgents(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchSalesAgents()
  }, [userData?.company_id])

  const handleAddAgent = async () => {
    if (!newAgentName.trim() || !newAgentEmail.trim() || !newAgentPin.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      })
      return
    }

    if (newAgentPin.length < 4) {
      toast({
        title: "PIN Too Short",
        description: "PIN must be at least 4 characters long.",
        variant: "destructive",
      })
      return
    }

    if (newAgentPin !== confirmNewAgentPin) {
      toast({
        title: "PINs Do Not Match",
        description: "Please ensure the PIN and confirm PIN match.",
        variant: "destructive",
      })
      return
    }

    setIsAddingAgent(true)
    try {
      const docRef = await addDoc(collection(db, "sales_agents"), {
        company_id: userData?.company_id,
        name: newAgentName,
        email: newAgentEmail,
        pin: newAgentPin, // In production, hash this PIN
        access_points: [`/website/${companyId}/sales-agent/${newAgentEmail}`], // Example access point
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })

      toast({
        title: "Sales Agent Added",
        description: `${newAgentName} has been added as a sales agent.`,
      })
      setIsAddAgentDialogOpen(false)
      setNewAgentName("")
      setNewAgentEmail("")
      setNewAgentPin("")
      setConfirmNewAgentPin("")
      fetchSalesAgents() // Refresh the list
    } catch (error) {
      console.error("Error adding sales agent:", error)
      toast({
        title: "Error",
        description: "Failed to add sales agent. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingAgent(false)
    }
  }

  const handleEditAgent = (agent: SalesAgent) => {
    setEditingAgent(agent)
    setEditAgentName(agent.name)
    setEditAgentEmail(agent.email)
    setEditAgentPin("") // Do not pre-fill PIN for security
    setConfirmEditAgentPin("")
    setIsEditAgentDialogOpen(true)
  }

  const handleUpdateAgent = async () => {
    if (!editingAgent || !editAgentName.trim() || !editAgentEmail.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (editAgentPin) {
      if (editAgentPin.length < 4) {
        toast({
          title: "PIN Too Short",
          description: "New PIN must be at least 4 characters long.",
          variant: "destructive",
        })
        return
      }
      if (editAgentPin !== confirmEditAgentPin) {
        toast({
          title: "PINs Do Not Match",
          description: "Please ensure the new PIN and confirm PIN match.",
          variant: "destructive",
        })
        return
      }
    }

    setIsUpdatingAgent(true)
    try {
      const agentRef = doc(db, "sales_agents", editingAgent.id)
      const updateData: any = {
        name: editAgentName,
        email: editAgentEmail,
        updated_at: new Date(),
      }
      if (editAgentPin) {
        updateData.pin = editAgentPin // In production, hash this PIN
      }

      await updateDoc(agentRef, updateData)

      toast({
        title: "Sales Agent Updated",
        description: `${editAgentName}'s details have been updated.`,
      })
      setIsEditAgentDialogOpen(false)
      setEditingAgent(null)
      setEditAgentName("")
      setEditAgentEmail("")
      setEditAgentPin("")
      setConfirmEditAgentPin("")
      fetchSalesAgents() // Refresh the list
    } catch (error) {
      console.error("Error updating sales agent:", error)
      toast({
        title: "Error",
        description: "Failed to update sales agent. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingAgent(false)
    }
  }

  const handleDeleteAgent = (agent: SalesAgent) => {
    setAgentToDelete(agent)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteAgent = async () => {
    if (!agentToDelete) return

    setIsDeletingAgent(true)
    try {
      await deleteDoc(doc(db, "sales_agents", agentToDelete.id))
      toast({
        title: "Sales Agent Deleted",
        description: `${agentToDelete.name} has been removed.`,
      })
      setIsDeleteDialogOpen(false)
      setAgentToDelete(null)
      fetchSalesAgents() // Refresh the list
    } catch (error) {
      console.error("Error deleting sales agent:", error)
      toast({
        title: "Error",
        description: "Failed to delete sales agent. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeletingAgent(false)
    }
  }

  return (
    <Card className="shadow-sm border-0 mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <User className="w-6 h-6 text-blue-600" />
          Sales Agent Management
        </CardTitle>
        <CardDescription>Manage sales agents and their access to dedicated terminal portals.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={() => setIsAddAgentDialogOpen(true)} className="flex items-center gap-2">
          <PlusCircle className="w-4 h-4" />
          Add New Sales Agent
        </Button>

        <Separator />

        <h3 className="text-lg font-semibold">Existing Sales Agents</h3>
        {isLoadingAgents ? (
          <div className="text-center text-gray-500">Loading sales agents...</div>
        ) : salesAgents.length === 0 ? (
          <div className="text-center text-gray-500">No sales agents added yet.</div>
        ) : (
          <div className="grid gap-4">
            {salesAgents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                <div>
                  <p className="font-medium">{agent.name}</p>
                  <p className="text-sm text-gray-600">{agent.email}</p>
                  <SalesAgentLinkDisplay agent={agent} companyId={companyId} />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditAgent(agent)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteAgent(agent)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Sales Agent Dialog */}
      <Dialog open={isAddAgentDialogOpen} onOpenChange={setIsAddAgentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Sales Agent</DialogTitle>
            <DialogDescription>
              Add a new sales agent who will have a dedicated access point to your terminal.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={newAgentEmail}
                onChange={(e) => setNewAgentEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pin" className="text-right">
                PIN
              </Label>
              <Input
                id="pin"
                type="password"
                value={newAgentPin}
                onChange={(e) => setNewAgentPin(e.target.value)}
                className="col-span-3"
                placeholder="Min 4 characters"
                maxLength={6}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="confirmPin" className="text-right">
                Confirm PIN
              </Label>
              <Input
                id="confirmPin"
                type="password"
                value={confirmNewAgentPin}
                onChange={(e) => setConfirmNewAgentPin(e.target.value)}
                className="col-span-3"
                maxLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddAgentDialogOpen(false)} disabled={isAddingAgent}>
              Cancel
            </Button>
            <Button onClick={handleAddAgent} disabled={isAddingAgent}>
              {isAddingAgent ? "Adding..." : "Add Agent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Sales Agent Dialog */}
      <Dialog open={isEditAgentDialogOpen} onOpenChange={setIsEditAgentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Sales Agent</DialogTitle>
            <DialogDescription>
              Update the details for {editingAgent?.name || "this sales agent"}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editName" className="text-right">
                Name
              </Label>
              <Input
                id="editName"
                value={editAgentName}
                onChange={(e) => setEditAgentName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editEmail" className="text-right">
                Email
              </Label>
              <Input
                id="editEmail"
                type="email"
                value={editAgentEmail}
                onChange={(e) => setEditAgentEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editPin" className="text-right">
                New PIN (Optional)
              </Label>
              <Input
                id="editPin"
                type="password"
                value={editAgentPin}
                onChange={(e) => setEditAgentPin(e.target.value)}
                className="col-span-3"
                placeholder="Leave blank to keep current"
                maxLength={6}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="confirmEditPin" className="text-right">
                Confirm New PIN
              </Label>
              <Input
                id="confirmEditPin"
                type="password"
                value={confirmEditAgentPin}
                onChange={(e) => setConfirmEditAgentPin(e.target.value)}
                className="col-span-3"
                maxLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditAgentDialogOpen(false)} disabled={isUpdatingAgent}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAgent} disabled={isUpdatingAgent}>
              {isUpdatingAgent ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete sales agent <span className="font-semibold">{agentToDelete?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeletingAgent}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAgent} disabled={isDeletingAgent}>
              {isDeletingAgent ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}