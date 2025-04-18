
import { supabase } from "@/integrations/supabase/client";

// This is now the company's calendar where appointments will be booked
const COMPANY_CALENDAR_ID = 'primary';

export const getAvailableSlots = async (date: Date) => {
  try {
    const { data, error } = await supabase.functions.invoke('google-calendar', {
      body: { 
        date: date.toISOString(),
        calendarId: COMPANY_CALENDAR_ID,
        action: 'getAvailableSlots' 
      }
    });

    if (error) throw error;
    return data.slots;
  } catch (error) {
    console.error('Failed to fetch available slots:', error);
    throw error;
  }
};

export const bookAppointment = async (
  startTime: string,
  endTime: string,
  bookingDetails: {
    name: string;
    email: string;
    notes?: string;
  }
) => {
  try {
    const { data, error } = await supabase.functions.invoke('google-calendar', {
      body: { 
        startTime, 
        endTime, 
        summary: `Meeting with ${bookingDetails.name}`,
        description: `Booking details:\nName: ${bookingDetails.name}\nEmail: ${bookingDetails.email}\nNotes: ${bookingDetails.notes || 'No notes provided'}`,
        calendarId: COMPANY_CALENDAR_ID,
        action: 'bookAppointment'
      }
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to book appointment:', error);
    throw error;
  }
};
