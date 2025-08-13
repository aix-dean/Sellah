import type { Timestamp } from "firebase/firestore"

export interface DaySchedule {
  available: boolean
  startTime: string // e.g., "09:00"
  endTime: string // e.g., "17:00"
}

export interface ServiceSchedule {
  monday?: DaySchedule
  tuesday?: DaySchedule
  wednesday?: DaySchedule
  thursday?: DaySchedule
  friday?: DaySchedule
  saturday?: DaySchedule
  sunday?: DaySchedule
}
