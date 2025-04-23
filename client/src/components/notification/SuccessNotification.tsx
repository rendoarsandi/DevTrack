import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle } from "lucide-react";

interface SuccessNotificationProps {
  trigger?: string; // Parameter URL yang memicu notifikasi
}

export function SuccessNotification({ trigger = 'verified' }: SuccessNotificationProps) {
  const { toast } = useToast();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // Fungsi untuk menangani perubahan URL atau event popstate
    const checkForSuccessParam = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const triggerValue = urlParams.get(trigger);
      
      if (triggerValue === 'success' && !shown) {
        setShown(true);
        
        console.log("Menampilkan notifikasi sukses verifikasi email");
        
        // Tampilkan toast notifikasi yang menonjol
        toast({
          title: "Email Berhasil Diverifikasi! ✓",
          description: (
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Verifikasi Berhasil</span>
              </div>
              <p className="mt-1">
                Email Anda telah berhasil diverifikasi. Anda dapat menggunakan semua fitur aplikasi FourByte sekarang.
              </p>
            </div>
          ),
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800",
          duration: 10000, // 10 detik
        });
        
        // Hapus parameter dari URL tanpa reload halaman
        const url = new URL(window.location.href);
        url.searchParams.delete(trigger);
        window.history.replaceState({}, document.title, url.toString());
      }
    };
    
    // Periksa parameter saat komponen di-mount
    checkForSuccessParam();
    
    // Tambahkan event listener untuk mendeteksi perubahan state history
    window.addEventListener('popstate', checkForSuccessParam);
    
    // Tambahkan custom event listener untuk trigger manual
    const handleVerificationSuccess = () => {
      setShown(false); // Reset state untuk memungkinkan toast muncul lagi
      setTimeout(checkForSuccessParam, 100); // Cek dengan sedikit delay
    };
    
    window.addEventListener('email-verified', handleVerificationSuccess);
    
    // Cleanup event listeners
    return () => {
      window.removeEventListener('popstate', checkForSuccessParam);
      window.removeEventListener('email-verified', handleVerificationSuccess);
    };
  }, [toast, trigger, shown]);

  return null; // Komponen ini tidak merender apapun di UI
}