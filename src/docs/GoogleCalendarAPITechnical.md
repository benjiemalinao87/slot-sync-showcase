
# Google Calendar API Integration - Technical Documentation

## Overview
This document outlines the technical implementation of Google Calendar API integration for our scheduling application. It covers API setup, authentication flow, and integration with our existing frontend application.

## Prerequisites
- Google Cloud Platform (GCP) account
- Project with billing enabled (Google provides a free tier with limited quota)
- Basic understanding of OAuth 2.0 authentication flow

## 1. Setting Up Google Cloud Project

### 1.1. Create a New Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click on "New Project"
4. Enter a project name (e.g., "Company-Schedule-App")
5. Click "Create"

### 1.2. Enable Google Calendar API
1. In your Google Cloud Project, navigate to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click on "Google Calendar API" in the search results
4. Click "Enable"

## 2. Setting Up OAuth 2.0 Credentials

### 2.1. Configure OAuth Consent Screen
1. Navigate to "APIs & Services" > "OAuth consent screen"
2. Select the appropriate user type (External or Internal)
   - For testing and development, "External" is usually sufficient
   - For production, choose based on your organization's needs
3. Click "Create"
4. Fill in the required information:
   - App name
   - User support email
   - Developer contact information
5. Click "Save and Continue"
6. Add necessary scopes:
   - `https://www.googleapis.com/auth/calendar.readonly` (for read-only access)
   - `https://www.googleapis.com/auth/calendar` (for full access)
7. Click "Save and Continue"
8. Add test users if needed (for External user type)
9. Click "Save and Continue"
10. Review your settings and click "Back to Dashboard"

### 2.2. Create OAuth Client ID
1. Navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Enter a name for your client (e.g., "Company-Calendar-Web-Client")
5. Add authorized JavaScript origins:
   - For development: `http://localhost:5173` (Vite default port)
   - For production: Your application's domain
6. Add authorized redirect URIs:
   - For development: `http://localhost:5173/auth/callback`
   - For production: `https://your-domain.com/auth/callback`
7. Click "Create"
8. A modal will display your Client ID and Client Secret
9. Save these values securely for later use in the application

## 3. Integration with Our React Application

### 3.1. Required Dependencies
```bash
npm install @react-oauth/google googleapis
```

### 3.2. Authentication Implementation
1. Create a GoogleCalendarService utility:
```typescript
// src/utils/googleCalendarService.ts

import { google, calendar_v3 } from 'googleapis';
import { SalesRepAvailability, TimeSlot } from '@/types/calendar';

// Configuration constants
const CLIENT_ID = 'YOUR_CLIENT_ID';  // Store securely
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';  // Store securely
const REDIRECT_URI = 'http://localhost:5173/auth/callback'; // Update for production
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

// OAuth2 client setup
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Get auth URL
export const getAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
};

// Exchange code for tokens
export const getTokensFromCode = async (code: string) => {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

// Set tokens for authenticated requests
export const setTokens = (tokens: any) => {
  oauth2Client.setCredentials(tokens);
  // Store tokens in localStorage for persistence
  localStorage.setItem('googleCalendarTokens', JSON.stringify(tokens));
};

// Load tokens from storage
export const loadTokens = () => {
  const tokens = localStorage.getItem('googleCalendarTokens');
  if (tokens) {
    oauth2Client.setCredentials(JSON.parse(tokens));
    return true;
  }
  return false;
};

// Get calendar service
const getCalendarService = () => {
  return google.calendar({
    version: 'v3',
    auth: oauth2Client
  });
};

// Fetch available slots from Google Calendar
export const fetchAvailableSlots = async (
  calendarId: string,
  startDate: Date,
  endDate: Date
): Promise<TimeSlot[]> => {
  try {
    const calendar = getCalendarService();
    
    // Get busy times from calendar
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        items: [{ id: calendarId }]
      }
    });
    
    const busySlots = response.data.calendars?.[calendarId]?.busy || [];
    
    // Generate all possible time slots for the day
    const allTimeSlots = generateTimeSlots(startDate);
    
    // Mark slots as unavailable if they overlap with busy times
    return allTimeSlots.map(slot => {
      const slotStart = new Date(`${startDate.toDateString()} ${slot.time}`);
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000); // 1 hour later
      
      const isOverlapping = busySlots.some(busySlot => {
        const busyStart = new Date(busySlot.start || '');
        const busyEnd = new Date(busySlot.end || '');
        return (
          (slotStart >= busyStart && slotStart < busyEnd) ||
          (slotEnd > busyStart && slotEnd <= busyEnd) ||
          (slotStart <= busyStart && slotEnd >= busyEnd)
        );
      });
      
      return {
        ...slot,
        isAvailable: !isOverlapping
      };
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    throw error;
  }
};

// Generate time slots for a day
const generateTimeSlots = (date: Date): TimeSlot[] => {
  const times = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM"];
  return times.map(time => ({
    id: `${date.toISOString()}-${time}`,
    time,
    isAvailable: true // Default to available, will be updated based on calendar
  }));
};

// Get sales rep availability
export const getSalesRepAvailability = async (
  repId: number,
  repName: string,
  calendarId: string,
  date: Date
): Promise<SalesRepAvailability> => {
  // Clone the date and set hours to 0
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  
  // Clone the date and set hours to 23:59:59
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);
  
  const timeSlots = await fetchAvailableSlots(calendarId, startDate, endDate);
  
  return {
    id: repId,
    name: repName,
    timeSlots
  };
};
```

### 3.3. Component Implementation (Callback Handler)
```typescript
// src/components/GoogleAuthCallback.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTokensFromCode, setTokens } from '@/utils/googleCalendarService';
import { useToast } from '@/components/ui/use-toast';

const GoogleAuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const processAuth = async () => {
      try {
        // Get code from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (!code) {
          throw new Error('No authorization code found in the URL');
        }
        
        // Exchange code for tokens
        const tokens = await getTokensFromCode(code);
        
        // Store tokens
        setTokens(tokens);
        
        toast({
          title: 'Authentication Successful',
          description: 'Successfully connected to Google Calendar',
        });
        
        // Redirect back to calendar
        navigate('/');
      } catch (err) {
        console.error('Authentication error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        
        toast({
          title: 'Authentication Failed',
          description: err instanceof Error ? err.message : 'Unknown error occurred',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    processAuth();
  }, [navigate, toast]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Processing authentication...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <h1 className="text-xl font-bold text-red-600">Authentication Error</h1>
        <p>{error}</p>
        <button 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => navigate('/')}
        >
          Return to Calendar
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen">
      Redirecting...
    </div>
  );
};

export default GoogleAuthCallback;
```

## 4. Updating the SchedulingCalendar Component

The existing `SchedulingCalendar` component needs to be updated to use the Google Calendar integration instead of mock data. Here are the key modifications required:

1. Add authentication state and login button
2. Replace the mock data generation with Google Calendar API calls
3. Handle authentication flow
4. Add calendar selection for each sales rep

## 5. Deployment Considerations

### 5.1. Secure Storage of Credentials
In a production environment, never store client secrets in the frontend code. Instead:
- Use environment variables for the client ID (can be exposed in frontend)
- Store the client secret in a secure backend service
- Use a backend proxy for token exchange to avoid exposing the client secret

### 5.2. Handling Token Refresh
OAuth tokens expire. Implement token refresh logic:
```typescript
// Add to googleCalendarService.ts
export const refreshToken = async () => {
  if (!oauth2Client.credentials.refresh_token) {
    throw new Error('No refresh token available');
  }
  
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    localStorage.setItem('googleCalendarTokens', JSON.stringify(credentials));
    return true;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};
```

### 5.3. Production URLs
Update the redirect URIs in both the Google Cloud Console and your application code when deploying to production.

## 6. Testing

1. Verify API access with a simple call after authentication
2. Test the token refresh mechanism
3. Validate the busy/free slots logic with known calendar data
4. Test error handling for various scenarios (network issues, permission problems, etc.)

## 7. Troubleshooting

### Common Issues
- **API Quota Exceeded**: Check your Google Cloud Console for quota usage and limits
- **Authentication Errors**: Verify the correct scopes are requested and granted
- **Invalid Credentials**: Ensure client ID and secret match what's in Google Cloud Console
- **CORS Issues**: Add all necessary origins to the allowed origins list in the OAuth client settings

## 8. Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google APIs Node.js Client](https://github.com/googleapis/google-api-nodejs-client)
