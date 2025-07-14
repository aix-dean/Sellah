import DashboardHome from "@/components/dashboard-home"
import { redirect } from "next/navigation"

export default function Dashboard() {
   redirect("/dashboard/products") 
}
