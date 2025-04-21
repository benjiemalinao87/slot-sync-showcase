
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { handleAuthCallback } from '@/utils/googleCalendarAuth';

const GoogleAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const processAuthCode = async () => {
      // Get the authorization code from the URL
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      
      if (code) {
        try {
          setStatus('Exchanging authorization code for tokens...');
          // Handle the callback and get tokens
          await handleAuthCallback(code);
          
          toast({
            title: "Auth Code Processed Successfully",
            description: "Check your Supabase Edge Function logs to get the refresh token. Add it to your Supabase secrets as GOOGLE_REFRESH_TOKEN.",
          });
          
          setStatus('Auth code processed successfully. Check logs for refresh token.');
        } catch (error) {
          console.error('Authorization error:', error);
          toast({
            title: "Authentication Failed",
            description: "Failed to process authorization code. See console for details.",
            variant: "destructive",
          });
          setStatus('Failed to process authorization code');
        }
      } else {
        toast({
          title: "No Authorization Code",
          description: "No authorization code found in URL. Try the authorization process again.",
          variant: "destructive",
        });
        setStatus('No authorization code found');
      }
    };

    processAuthCode();
  }, [location.search, toast]);

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
        <h1 className="text-2xl font-bold mb-4">Google Calendar Auth</h1>
        <p className="mb-6">{status}</p>
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md text-sm text-left">
          <p className="font-semibold mb-2">Next steps:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Check your Supabase Edge Function logs to find the refresh token</li>
            <li>Add it to your Supabase secrets as <code className="bg-gray-200 px-1 rounded">GOOGLE_REFRESH_TOKEN</code></li>
            <li>Restart your application to use the new token</li>
          </ol>
        </div>
        <button 
          onClick={handleGoHome}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default GoogleAuthCallback;
