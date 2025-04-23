import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";

const verificationSchema = z.object({
  code: z.string().min(6).max(6),
});

type VerificationFormValues = z.infer<typeof verificationSchema>;

interface EmailVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailVerificationModal({ open, onOpenChange }: EmailVerificationModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verified, setVerified] = useState(false);

  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit = async (data: VerificationFormValues) => {
    try {
      setIsLoading(true);
      
      const response = await apiRequest("POST", "/api/verify-email/verify", { code: data.code });
      
      if (response.ok) {
        setVerified(true);
        
        // Display success toast with a more prominent design
        toast({
          title: "Email successfully verified! ✓",
          description: "You can now access all FourByte application features.",
          variant: "default",
          duration: 6000, // Longer duration (6 seconds)
        });
        
        // Add notification to the application notification system
        try {
          await apiRequest("POST", "/api/notifications", {
            type: "system_message",
            title: "Email Verified",
            content: "Your email has been successfully verified. Thank you!",
            isRead: false
          });
        } catch (err) {
          console.error("Failed to create notification", err);
        }
        
        // Wait a bit longer so users can see the success message
        setTimeout(() => {
          onOpenChange(false);
          
          // Refresh page with full reload, displaying email verification notification directly
          window.location.href = "/dashboard?verified=success";
        }, 2000);
      } else {
        const errorData = await response.json();
        toast({
          title: "Verification failed",
          description: errorData.message || "Invalid verification code",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while verifying your email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsResending(true);
      
      const response = await apiRequest("POST", "/api/verify-email/resend", {});
      
      if (response.ok) {
        toast({
          title: "Verification code sent!",
          description: "A new verification code has been sent to your email",
          variant: "default",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Failed to send code",
          description: errorData.message || "Could not send verification code",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while resending the verification code",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const isVerified = user?.emailVerified || verified;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isVerified ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Email Verified</span>
              </>
            ) : (
              <>
                <Mail className="h-5 w-5 text-primary" />
                <span>Verify Your Email</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isVerified ? (
              "Your email has been verified. Thank you!"
            ) : (
              <>
                We have sent a verification code to your email ({user?.email}).
                Enter the 6-digit code to verify your email address.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {!isVerified && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter 6-digit code"
                        {...field}
                        disabled={isLoading}
                        className="text-center tracking-widest text-lg"
                        maxLength={6}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex-col sm:flex-col gap-2">
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </Button>
                
                <div className="flex justify-between w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResendCode}
                    disabled={isResending}
                    className="text-sm"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Resend Code"
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                    className="text-sm"
                  >
                    Maybe Later
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        )}

        {isVerified && (
          <DialogFooter>
            <Button 
              onClick={() => onOpenChange(false)} 
              className="w-full"
            >
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}