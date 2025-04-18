
export const GOOGLE_CLIENT_ID = ''; // You'll need to add your client ID here
export const GOOGLE_REDIRECT_URI = `${window.location.origin}/auth/callback`;

export const initializeGoogleAuth = () => {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&scope=https://www.googleapis.com/auth/calendar&access_type=offline&prompt=consent`;
  
  window.location.href = authUrl;
};

export const handleAuthCallback = async (code: string) => {
  // Store the authorization code in localStorage for now
  localStorage.setItem('google_auth_code', code);
  return true;
};

export const getAvailableSlots = async (calendarId: string, startDate: Date, endDate: Date) => {
  const authCode = localStorage.getItem('google_auth_code');
  if (!authCode) {
    throw new Error('Not authenticated');
  }

  // Here you would make an API call to your backend to handle the token exchange and calendar API calls
  // For now, we'll return mock data
  const slots = generateMockTimeSlots(startDate);
  return slots;
};

export const bookAppointment = async (
  calendarId: string,
  startTime: string,
  endTime: string,
  summary: string,
  description: string
) => {
  const authCode = localStorage.getItem('google_auth_code');
  if (!authCode) {
    throw new Error('Not authenticated');
  }

  // Here you would make an API call to your backend to handle the token exchange and calendar API calls
  // For now, we'll return a mock success response
  console.log('Booking appointment:', { startTime, endTime, summary, description });
  return true;
};

const generateMockTimeSlots = (date: Date) => {
  const slots = [];
  const startHour = 9;
  const endHour = 17;

  for (let hour = startHour; hour < endHour; hour++) {
    slots.push({
      id: `${date.toISOString()}-${hour}`,
      startTime: `${hour}:00`,
      endTime: `${hour + 1}:00`,
      isAvailable: Math.random() > 0.3
    });
  }

  return slots;
};

