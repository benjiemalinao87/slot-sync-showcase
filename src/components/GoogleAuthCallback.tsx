
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleAuthCallback } from '@/utils/googleCalendarAuth';
import { useToast } from '@/components/ui/use-toast';

const GoogleAuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code) {
        try {
          await handleAuthCallback(code);
          toast({
            title: "Authentication Successful",
            description: "Successfully connected to Google Calendar",
          });
          navigate('/');
        } catch (error) {
          toast({
            title: "Authentication Failed",
            description: "Failed to connect to Google Calendar",
            variant: "destructive",
          });
        }
      }
    };

    handleAuth();
  }, [navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Processing Authentication...</h1>
        <p>Please wait while we complete the setup.</p>
      </div>
    </div>
  );
};

export default GoogleAuthCallback;
