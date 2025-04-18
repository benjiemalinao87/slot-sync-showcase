
export interface TimeSlot {
  id: string;
  time: string;
  isAvailable: boolean;
}

export interface SalesRepAvailability {
  id: number;
  name: string;
  timeSlots: TimeSlot[];
}
