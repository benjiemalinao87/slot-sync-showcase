
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

const GoogleAuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Since we're using a company calendar that's pre-authenticated,
    // we don't need to handle OAuth callback for individual users
    
    toast({
      title: "Calendar System Ready",
      description: "The booking system is already connected to the company calendar.",
    });
    
    // Redirect back to the main page
    navigate('/');
  }, [navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Calendar System Ready</h1>
        <p>Redirecting you back to the booking page...</p>
      </div>
    </div>
  );
};

export default GoogleAuthCallback;
