import { supabase } from "@/integrations/supabase/client";

export const GOOGLE_REDIRECT_URI = `https://cobalt-book-a-call.netlify.app/auth/callback`;

// Define required scopes for Google Calendar
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',       // Full access to calendars
  'https://www.googleapis.com/auth/calendar.events', // Manage events
  'https://www.googleapis.com/auth/calendar.readonly', // Read-only access
  'profile',                                        // Basic profile info
  'email'                                          // Email address
];

export const initializeGoogleAuth = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('google-calendar', {
      body: { 
        action: 'getAuthUrl',
        scopes: SCOPES
      }
    });

    if (error) throw error;
    window.location.href = data.url;
  } catch (error) {
    console.error('Failed to initialize Google Auth:', error);
    throw error;
  }
};

export const handleAuthCallback = async (code: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('google-calendar', {
      body: { code, action: 'getToken' }
    });

    if (error) throw error;

    localStorage.setItem('google_auth_tokens', JSON.stringify(data.tokens));
    return true;
  } catch (error) {
    console.error('Failed to handle auth callback:', error);
    throw error;
  }
};

export const isGoogleAuthenticated = () => {
  const tokens = localStorage.getItem('google_auth_tokens');
  return !!tokens;
};

export const getAvailableSlots = async (calendarId: string, date: Date) => {
  try {
    const tokens = localStorage.getItem('google_auth_tokens');
    if (!tokens) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('google-calendar', {
      body: { 
        date: date.toISOString(), 
        calendarId,
        action: 'getAvailableSlots' 
      },
      headers: {
        Authorization: tokens
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
  calendarId: string,
  startTime: string,
  endTime: string,
  summary: string,
  description: string
) => {
  try {
    const tokens = localStorage.getItem('google_auth_tokens');
    if (!tokens) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('google-calendar', {
      body: { 
        startTime, 
        endTime, 
        summary, 
        description,
        action: 'bookAppointment'
      },
      headers: {
        Authorization: tokens
      }
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to book appointment:', error);
    throw error;
  }
};
