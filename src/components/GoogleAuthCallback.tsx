
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { handleAuthCallback } from '@/utils/googleCalendarAuth';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clipboard, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const GoogleAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState('Processing...');
  const [refreshToken, setRefreshToken] = useState('');
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

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
              description: "Copy the refresh token to add it to your Supabase secrets.",
            });
            
            setStatus('Auth code processed successfully. Copy the refresh token below to add to your Supabase secrets.');
            setRefreshToken(result.refreshToken || '');
          } else {
            throw new Error(result.error || 'Unknown error processing auth code');
          }
        } catch (error) {
          console.error('Authorization error:', error);
          toast({
            title: "Authentication Failed",
            description: error.message || "Failed to process authorization code.",
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
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Refresh token copied to clipboard successfully.",
      });
      
      // Reset copied status after 2 seconds
      setTimeout(() => setCopied(false), 2000);
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
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-purple-100">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent">
          <CardTitle className="text-2xl font-bold text-purple-900">Google Calendar Auth</CardTitle>
          <CardDescription>Authentication process results</CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-4">
          {processing ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-lg font-medium text-gray-700">{status}</p>
            </div>
          ) : error ? (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Success</AlertTitle>
                <AlertDescription className="text-green-700">{status}</AlertDescription>
              </Alert>
              
              {refreshToken && (
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-2">
                    <KeyRound className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold text-lg">Your Refresh Token:</h3>
                  </div>
                  <div className="relative mt-2 mb-6">
                    <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-x-auto text-left whitespace-pre-wrap break-all border border-gray-300">
                      {refreshToken}
                    </pre>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className={`absolute top-2 right-2 ${copied ? 'bg-green-100 text-green-700' : ''}`}
                      onClick={copyToClipboard}
                    >
                      <Clipboard className="h-4 w-4 mr-1" />
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-sm text-left">
            <p className="font-semibold mb-2">Next steps:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Copy the refresh token displayed above</li>
              <li>Add it to your Supabase secrets as <code className="bg-gray-200 px-1 py-0.5 rounded">GOOGLE_REFRESH_TOKEN</code></li>
              <li>Restart your application to use the new token</li>
            </ol>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center pt-2 pb-6">
          <Button 
            onClick={handleGoHome}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default GoogleAuthCallback;
