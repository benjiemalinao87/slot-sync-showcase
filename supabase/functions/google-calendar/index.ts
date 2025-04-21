
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { google } from "npm:googleapis@126.0.1"

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
const GOOGLE_REFRESH_TOKEN = Deno.env.get('GOOGLE_REFRESH_TOKEN');
const REDIRECT_URI = 'https://appointment-request-with-cobalt.netlify.app/';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

// Set up authentication with the company's refresh token if available
if (GOOGLE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if we have a refresh token configured
    if (!GOOGLE_REFRESH_TOKEN) {
      console.error("GOOGLE_REFRESH_TOKEN is not set in environment variables");
      return new Response(
        JSON.stringify({ 
          error: "Google Calendar not fully configured. GOOGLE_REFRESH_TOKEN is missing.", 
          help: "Add the GOOGLE_REFRESH_TOKEN to your Supabase Edge Function secrets." 
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const requestData = await req.json();
    const { action } = requestData;

    if (!action) {
      throw new Error('No action specified');
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    switch (action) {
      case 'handleAuthCallback': {
        // This handles the OAuth code exchange to get refresh token
        const { code } = requestData;
        
        if (!code) {
          throw new Error('No authorization code provided');
        }
        
        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        
        // You would normally store these tokens securely
        // For this demo, we just log them so you can copy the refresh token
        console.log("Auth successful! Copy this refresh token to your Supabase secrets:");
        console.log("REFRESH TOKEN:", tokens.refresh_token);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Auth successful! Check edge function logs for the refresh token." 
          }), 
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      case 'getAvailableSlots': {
        const { date, calendarId } = requestData;
        
        if (!date) {
          throw new Error('Date is required for getAvailableSlots');
        }

        const startTime = new Date(date);
        startTime.setHours(0, 0, 0, 0);
        const endTime = new Date(date);
        endTime.setHours(23, 59, 59, 999);

        try {
          const response = await calendar.freebusy.query({
            requestBody: {
              timeMin: startTime.toISOString(),
              timeMax: endTime.toISOString(),
              items: [{ id: calendarId }],
            },
          });

          // Generate all possible time slots
          const slots = [];
          for (let hour = 9; hour < 17; hour++) {
            const slotStart = new Date(date);
            slotStart.setHours(hour, 0, 0, 0);
            
            slots.push({
              id: `${date}-${hour}`,
              startTime: `${hour}:00`,
              endTime: `${hour + 1}:00`,
              isAvailable: true,
            });
          }

          // Mark busy slots as unavailable
          const busySlots = response.data.calendars?.[calendarId]?.busy || [];
          const availableSlots = slots.map(slot => {
            const slotStart = new Date(`${date.split('T')[0]}T${slot.startTime}`);
            const slotEnd = new Date(`${date.split('T')[0]}T${slot.endTime}`);
            
            const isOverlapping = busySlots.some(busySlot => {
              const busyStart = new Date(busySlot.start);
              const busyEnd = new Date(busySlot.end);
              return (
                (slotStart >= busyStart && slotStart < busyEnd) ||
                (slotEnd > busyStart && slotEnd <= busyEnd)
              );
            });
            
            return { ...slot, isAvailable: !isOverlapping };
          });

          return new Response(
            JSON.stringify({ slots: availableSlots }), 
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (err) {
          console.error("Google Calendar API error:", err);
          throw new Error(`Google Calendar API error: ${err.message}`);
        }
      }

      case 'bookAppointment': {
        const { startTime, endTime, summary, description, calendarId } = requestData;
        
        if (!startTime || !endTime) {
          throw new Error('Start time and end time are required for bookAppointment');
        }

        try {
          const event = await calendar.events.insert({
            calendarId,
            requestBody: {
              summary,
              description,
              start: { dateTime: startTime },
              end: { dateTime: endTime },
            },
          });

          return new Response(
            JSON.stringify({ event: event.data }), 
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (err) {
          console.error("Google Calendar API error:", err);
          throw new Error(`Google Calendar API error: ${err.message}`);
        }
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
