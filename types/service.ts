export interface Service {
  id: string
  name: string
  description: string
  serviceType: "roll_up" | "roll_down" | "delivery"
  price: number
  schedule: {
    [key: string]: {
      available: boolean
      startTime: string
      endTime: string
    }
  }
  userId: string
  type: "SERVICE" | "SERVICES" // Added "SERVICES" for robustness in filtering
  status: "active" | "inactive" | "draft"
  views: number
  bookings: number
  rating: number
  imageUrl: string
  createdAt?: any // Firebase Timestamp type
  updatedAt?: any // Firebase Timestamp type
}

// This interface is not strictly needed if we use Omit<Service, ...>
// export interface CreateServiceData {
//   name: string
//   description: string
//   serviceType: "roll_up" | "roll_down" | "delivery"
//   price: number
//   schedule: {
//     [key: string]: {
//       available: boolean
//       startTime: string
//       endTime: string
//     }
//   }
//   userId: string
//   type: "SERVICE"
//   status: "active" | "inactive" | "draft"
//   views: number
//   bookings: number
//   rating: number
//   imageUrl: string
// }
