
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { google } from "npm:googleapis@126.0.1"

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
const REDIRECT_URI = 'http://localhost:5173/auth/callback'; // Update this for production

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (!action) {
      throw new Error('No action specified');
    }

    switch (action) {
      case 'getAuthUrl':
        const authUrl = oauth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: ['https://www.googleapis.com/auth/calendar'],
        });
        return new Response(JSON.stringify({ url: authUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'getToken':
        const { code } = await req.json();
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        return new Response(JSON.stringify({ tokens }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'getAvailableSlots':
        const { date, calendarId } = await req.json();
        oauth2Client.setCredentials(JSON.parse(req.headers.get('Authorization') || '{}'));
        
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
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
          const slotStart = new Date(`${date}T${slot.startTime}`);
          const slotEnd = new Date(`${date}T${slot.endTime}`);
          
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

        return new Response(JSON.stringify({ slots: availableSlots }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'bookAppointment':
        const { startTime, endTime, summary, description } = await req.json();
        oauth2Client.setCredentials(JSON.parse(req.headers.get('Authorization') || '{}'));
        
        const calendarApi = google.calendar({ version: 'v3', auth: oauth2Client });
        const event = await calendarApi.events.insert({
          calendarId: 'primary',
          requestBody: {
            summary,
            description,
            start: { dateTime: startTime },
            end: { dateTime: endTime },
          },
        });

        return new Response(JSON.stringify({ event: event.data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
