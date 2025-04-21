import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { google } from "npm:googleapis@126.0.1"

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
const GOOGLE_REFRESH_TOKEN = Deno.env.get('GOOGLE_REFRESH_TOKEN');
const REDIRECT_URI = 'https://appointment-request-with-cobalt.netlify.app/auth/callback';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

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
    const requestData = await req.json();
    const { action } = requestData;

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'No action specified' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!GOOGLE_REFRESH_TOKEN && action !== 'handleAuthCallback') {
      console.error("GOOGLE_REFRESH_TOKEN is not set in environment variables");
      return new Response(
        JSON.stringify({ 
          error: "Google Calendar not fully configured. GOOGLE_REFRESH_TOKEN is missing.", 
          help: "Add the GOOGLE_REFRESH_TOKEN to your Supabase Edge Function secrets." 
        }), 
        { 
          status: 200, // Sending 200 with error in body for easier client handling
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    switch (action) {
      case 'handleAuthCallback': {
        const { code } = requestData;
        
        if (!code) {
          return new Response(
            JSON.stringify({ error: 'No authorization code provided' }), 
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
        try {
          oauth2Client.redirectUri_ = REDIRECT_URI;
          
          const { tokens } = await oauth2Client.getToken(code);
          
          console.log("Auth successful! Copy this refresh token to your Supabase secrets:");
          console.log("REFRESH TOKEN:", tokens.refresh_token);
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: "Auth successful! Check edge function logs for the refresh token.",
              refreshToken: tokens.refresh_token 
            }), 
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } catch (tokenError) {
          console.error("Error getting tokens:", tokenError);
          return new Response(
            JSON.stringify({ 
              error: `Failed to exchange code for tokens: ${tokenError.message}` 
            }), 
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }

      case 'getAvailableSlots': {
        const { date, calendarId } = requestData;
        
        if (!date) {
          return new Response(
            JSON.stringify({ error: 'Date is required for getAvailableSlots' }), 
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        try {
          const startTime = new Date(date);
          startTime.setHours(0, 0, 0, 0);
          const endTime = new Date(date);
          endTime.setHours(23, 59, 59, 999);

          const response = await calendar.freebusy.query({
            requestBody: {
              timeMin: startTime.toISOString(),
              timeMax: endTime.toISOString(),
              items: [{ id: calendarId }],
            },
          });

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
          return new Response(
            JSON.stringify({ error: `Google Calendar API error: ${err.message}` }), 
            { 
              status: 200, // Using 200 for application errors to make client-side handling easier
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }

      case 'bookAppointment': {
        const { startTime, endTime, summary, description, calendarId } = requestData;
        
        if (!startTime || !endTime) {
          return new Response(
            JSON.stringify({ error: 'Start time and end time are required for bookAppointment' }), 
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
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
          return new Response(
            JSON.stringify({ error: `Google Calendar API error: ${err.message}` }), 
            { 
              status: 200, // Using 200 for application errors
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
