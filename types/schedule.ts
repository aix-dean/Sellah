export interface DaySchedule {
  available: boolean;
  endTime: string;
  startTime: string;
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
