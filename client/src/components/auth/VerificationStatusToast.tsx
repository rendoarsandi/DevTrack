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
      
      console.log("Menampilkan notifikasi status email terverifikasi");
      
      // Tampilkan toast notifikasi untuk status email terverifikasi
      toast({
        title: "Status Email: Terverifikasi ✓",
        description: (
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Email Telah Terverifikasi</span>
            </div>
            <p className="mt-1">
              Email Anda ({user.email}) telah terverifikasi. Anda memiliki akses penuh ke semua fitur FourByte.
            </p>
          </div>
        ),
        variant: "default",
        className: "bg-green-50 border-green-200 text-green-800",
        duration: 5000,
      });
    }
  }, [user, toast, shown]);

  return null; // Komponen ini tidak merender apapun
}