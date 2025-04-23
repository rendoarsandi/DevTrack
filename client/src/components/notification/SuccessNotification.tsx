import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle } from "lucide-react";

interface SuccessNotificationProps {
  trigger?: string; // URL parameter that triggers the notification
}

export function SuccessNotification({ trigger = 'verified' }: SuccessNotificationProps) {
  const { toast } = useToast();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // Function to handle URL changes or popstate events
    const checkForSuccessParam = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const triggerValue = urlParams.get(trigger);
      
      if (triggerValue === 'success' && !shown) {
        setShown(true);
        
        console.log("Displaying email verification success notification");
        
        // Show prominent toast notification
        toast({
          title: "Email Successfully Verified! ✓",
          description: (
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Verification Successful</span>
              </div>
              <p className="mt-1">
                Your email has been successfully verified. You can now use all FourByte application features.
              </p>
            </div>
          ),
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800",
          duration: 10000, // 10 seconds
        });
        
        // Remove parameter from URL without page reload
        const url = new URL(window.location.href);
        url.searchParams.delete(trigger);
        window.history.replaceState({}, document.title, url.toString());
      }
    };
    
    // Check parameters when component mounts
    checkForSuccessParam();
    
    // Add event listener to detect history state changes
    window.addEventListener('popstate', checkForSuccessParam);
    
    // Add custom event listener for manual triggering
    const handleVerificationSuccess = () => {
      setShown(false); // Reset state to allow toast to appear again
      setTimeout(checkForSuccessParam, 100); // Check with slight delay
    };
    
    window.addEventListener('email-verified', handleVerificationSuccess);
    
    // Cleanup event listeners
    return () => {
      window.removeEventListener('popstate', checkForSuccessParam);
      window.removeEventListener('email-verified', handleVerificationSuccess);
    };
  }, [toast, trigger, shown]);

  return null; // This component doesn't render anything in the UI
}