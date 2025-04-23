import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmailVerificationModal } from "./EmailVerificationModal";

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showVerifiedSuccess, setShowVerifiedSuccess] = useState(false);
  
  // Tampilkan pesan sukses sesaat jika baru saja diverifikasi
  useEffect(() => {
    // Cek apakah ada parameter URL yang menunjukkan verifikasi berhasil
    const urlParams = new URLSearchParams(window.location.search);
    const verified = urlParams.get('verified');
    
    if (user?.emailVerified && verified === 'success') {
      setShowVerifiedSuccess(true);
      
      // Hilangkan parameter dari URL tanpa reload page
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
      
      // Sembunyikan banner sukses setelah 7 detik
      const timer = setTimeout(() => {
        setShowVerifiedSuccess(false);
      }, 7000);
      
      return () => clearTimeout(timer);
    }
  }, [user]);
  
  // Tampilkan banner sukses jika email baru saja diverifikasi
  if (showVerifiedSuccess) {
    return (
      <Alert variant="default" className="mb-4 bg-green-50 text-green-800 border-green-500">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <AlertTitle className="text-green-800 font-medium text-lg">Email Berhasil Diverifikasi!</AlertTitle>
        <AlertDescription className="text-green-700">
          <p>Terima kasih! Email Anda telah berhasil diverifikasi. Anda sekarang memiliki akses penuh ke semua fitur FourByte.</p>
          <p className="mt-1 text-sm">Sekarang Anda dapat membuat permintaan proyek baru dan menggunakan semua fitur platform.</p>
        </AlertDescription>
      </Alert>
    );
  }
  
  // Jangan tampilkan banner jika user belum login atau email sudah diverifikasi
  if (!user || user.emailVerified) {
    return null;
  }

  return (
    <>
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle className="text-lg">Verifikasi Email Anda</AlertTitle>
        <AlertDescription className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <span>
            Email Anda ({user.email}) belum diverifikasi. Verifikasi email untuk mengakses semua fitur.
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowModal(true)} 
            className="ml-0 sm:ml-2 whitespace-nowrap"
          >
            <Mail className="h-4 w-4 mr-2" />
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