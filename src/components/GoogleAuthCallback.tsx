
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { handleAuthCallback } from '@/utils/googleCalendarAuth';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clipboard, AlertCircle, CheckCircle2 } from "lucide-react";

const GoogleAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState('Processing...');
  const [refreshToken, setRefreshToken] = useState('');
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const processAuthCode = async () => {
      // Get the authorization code from the URL
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      
      if (code) {
        try {
          setStatus('Exchanging authorization code for tokens...');
          // Handle the callback and get tokens
          const result = await handleAuthCallback(code);
          
          if (result.success) {
            toast({
              title: "Auth Code Processed Successfully",
              description: "Check your Supabase Edge Function logs to get the refresh token. Add it to your Supabase secrets as GOOGLE_REFRESH_TOKEN.",
            });
            
            setStatus('Auth code processed successfully. Copy the refresh token below to add to your Supabase secrets.');
            setRefreshToken(result.refreshToken || 'Check Supabase Edge Function logs for the refresh token');
          } else {
            throw new Error(result.error || 'Unknown error processing auth code');
          }
        } catch (error) {
          console.error('Authorization error:', error);
          toast({
            title: "Authentication Failed",
            description: "Failed to process authorization code. See console for details.",
            variant: "destructive",
          });
          setError(error.message || 'Failed to process authorization code');
          setStatus('Failed to process authorization code');
        } finally {
          setProcessing(false);
        }
      } else {
        toast({
          title: "No Authorization Code",
          description: "No authorization code found in URL. Try the authorization process again.",
          variant: "destructive",
        });
        setError('No authorization code found in URL');
        setStatus('No authorization code found');
        setProcessing(false);
      }
    };

    processAuthCode();
  }, [location.search, toast]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(refreshToken);
      toast({
        title: "Copied to clipboard",
        description: "Refresh token copied to clipboard successfully.",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard. Please select and copy manually.",
        variant: "destructive",
      });
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Google Calendar Auth</h1>
        
        {processing ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p>{status}</p>
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Success</AlertTitle>
              <AlertDescription className="text-green-700">{status}</AlertDescription>
            </Alert>
            
            {refreshToken && (
              <div className="mb-6">
                <p className="font-semibold mb-2">Your Refresh Token:</p>
                <div className="relative">
                  <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-x-auto text-left">
                    {refreshToken}
                  </pre>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="absolute top-2 right-2"
                    onClick={copyToClipboard}
                  >
                    <Clipboard className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md text-sm text-left">
          <p className="font-semibold mb-2">Next steps:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Copy the refresh token displayed above or check your Supabase Edge Function logs</li>
            <li>Add it to your Supabase secrets as <code className="bg-gray-200 px-1 rounded">GOOGLE_REFRESH_TOKEN</code></li>
            <li>Restart your application to use the new token</li>
          </ol>
        </div>
        
        <Button 
          onClick={handleGoHome}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
        >
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default GoogleAuthCallback;
