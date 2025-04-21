
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { handleAuthCallback } from "@/utils/googleCalendarAuth";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);

  useEffect(() => {
    // Check if this is an OAuth callback from Google
    const isOAuthCallback = location.pathname === "/auth/callback" || 
                           location.search.includes("code=");
    
    if (isOAuthCallback) {
      setIsProcessingOAuth(true);
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      
      if (code) {
        // Process the authorization code
        handleAuthCallback(code)
          .then(result => {
            if (result?.success) {
              toast({
                title: "Authentication Successful",
                description: "You can now copy your refresh token.",
              });
              // Redirect to the proper callback component
              navigate("/auth/callback" + location.search);
            } else {
              throw new Error(result?.error || "Authentication failed");
            }
          })
          .catch(error => {
            toast({
              title: "Authentication Failed",
              description: error.message || "Failed to process authorization code",
              variant: "destructive",
            });
            navigate("/");
          })
          .finally(() => {
            setIsProcessingOAuth(false);
          });
      } else {
        setIsProcessingOAuth(false);
        toast({
          title: "No Authorization Code",
          description: "No authorization code found in URL",
          variant: "destructive",
        });
      }
    } else {
      // Log normal 404 errors
      console.error(
        "404 Error: User attempted to access non-existent route:",
        location.pathname
      );
    }
  }, [location.pathname, location.search, navigate, toast]);

  // If we're processing an OAuth callback, show a loading state
  if (isProcessingOAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <Loader2 className="h-12 w-12 text-purple-600 animate-spin mb-4" />
        <h2 className="text-xl font-semibold mb-2">Processing authentication...</h2>
        <p className="text-gray-600">Please wait while we complete the Google authentication process.</p>
      </div>
    );
  }

  // Standard 404 page
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
