export interface DaySchedule {
  enabled: boolean;
  startTime: string; // e.g., "09:00" (24-hour format)
  endTime: string;   // e.g., "17:00" (24-hour format)
}

export interface ServiceSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}
