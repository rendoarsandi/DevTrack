import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmailVerificationModal } from "./EmailVerificationModal";

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  
  // Jangan tampilkan banner jika user belum login atau email sudah diverifikasi
  if (!user || user.emailVerified) {
    return null;
  }

  return (
    <>
      <Alert variant="warning" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Verifikasi Email Anda</AlertTitle>
        <AlertDescription className="flex justify-between items-center">
          <span>
            Email Anda ({user.email}) belum diverifikasi. Verifikasi email untuk mengakses semua fitur.
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowModal(true)} 
            className="ml-2"
          >
            Verifikasi Sekarang
          </Button>
        </AlertDescription>
      </Alert>
      
      <EmailVerificationModal 
        open={showModal} 
        onOpenChange={setShowModal} 
      />
    </>
  );
}