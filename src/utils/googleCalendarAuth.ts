
export const GOOGLE_CLIENT_ID = ''; // You'll need to add your client ID here
export const GOOGLE_REDIRECT_URI = `${window.location.origin}/auth/callback`;

export const initializeGoogleAuth = () => {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&scope=https://www.googleapis.com/auth/calendar.readonly&access_type=offline&prompt=consent`;
  
  window.location.href = authUrl;
};

export const handleAuthCallback = async (code: string) => {
  // Store the authorization code in localStorage for now
  localStorage.setItem('google_auth_code', code);
  return true;
};
