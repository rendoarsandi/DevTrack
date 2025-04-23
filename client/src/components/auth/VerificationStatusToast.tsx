import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle } from "lucide-react";

export function VerificationStatusToast() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (user?.emailVerified && !shown) {
      setShown(true);
      
      console.log("Displaying email verification status notification");
      
      // Show toast notification for verified email status
      toast({
        title: "Email Status: Verified ✓",
        description: (
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Email Successfully Verified</span>
            </div>
            <p className="mt-1">
              Your email ({user.email}) has been verified. You now have full access to all FourByte features.
            </p>
          </div>
        ),
        variant: "default",
        className: "bg-green-50 border-green-200 text-green-800",
        duration: 5000,
      });
    }
  }, [user, toast, shown]);

  return null; // This component doesn't render anything
}