
import { SalesRepAvailability } from "@/types/calendar";

const STORAGE_KEY = 'calendar_availability';

export const saveAvailability = (availability: SalesRepAvailability[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(availability));
};

export const getAvailability = (): SalesRepAvailability[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Generate mock time slots for testing
export const generateMockTimeSlots = (date: Date) => {
  const times = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM"];
  return times.map(time => ({
    id: `${date.toISOString()}-${time}`,
    time,
    isAvailable: Math.random() > 0.3 // Randomly set availability for testing
  }));
};
