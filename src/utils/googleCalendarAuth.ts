
import { supabase } from "@/integrations/supabase/client";

export const GOOGLE_REDIRECT_URI = `${window.location.origin}/auth/callback`;

export const initializeGoogleAuth = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('google-calendar', {
      query: { action: 'getAuthUrl' }
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
      body: { code },
      query: { action: 'getToken' }
    });

    if (error) throw error;

    // Store tokens in localStorage
    localStorage.setItem('google_auth_tokens', JSON.stringify(data.tokens));
    return true;
  } catch (error) {
    console.error('Failed to handle auth callback:', error);
    throw error;
  }
};

export const getAvailableSlots = async (calendarId: string, date: Date) => {
  try {
    const tokens = localStorage.getItem('google_auth_tokens');
    if (!tokens) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('google-calendar', {
      body: { date: date.toISOString(), calendarId },
      headers: { Authorization: tokens },
      query: { action: 'getAvailableSlots' }
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
      body: { startTime, endTime, summary, description },
      headers: { Authorization: tokens },
      query: { action: 'bookAppointment' }
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to book appointment:', error);
    throw error;
  }
};
