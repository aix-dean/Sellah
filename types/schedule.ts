export interface ServiceSchedule {
  monday: { available: boolean; startTime: string; endTime: string };
  tuesday: { available: boolean; startTime: string; endTime: string };
  wednesday: { available: boolean; startTime: string; endTime: string };
  thursday: { available: boolean; startTime: string; endTime: string };
  friday: { available: boolean; startTime: string; endTime: string };
  saturday: { available: boolean; startTime: string; endTime: string };
  sunday: { available: boolean; startTime: string; endTime: string };
}
