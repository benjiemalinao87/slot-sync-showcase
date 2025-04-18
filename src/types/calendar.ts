
export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  time?: string; // For backward compatibility
}

export interface SalesRepAvailability {
  id: number;
  name: string;
  timeSlots: TimeSlot[];
}

export interface BookingDetails {
  name: string;
  email: string;
  notes?: string;
  slot: TimeSlot;
  rep: number;
}

