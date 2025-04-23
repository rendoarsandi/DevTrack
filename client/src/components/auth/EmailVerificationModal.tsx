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
        
        // Tampilkan toast sukses dengan desain yang lebih menonjol
        toast({
          title: "Email berhasil diverifikasi! ✓",
          description: "Sekarang Anda dapat mengakses semua fitur aplikasi FourByte.",
          variant: "default",
          duration: 6000, // Durasi lebih lama (6 detik)
        });
        
        // Tambahkan notifikasi pada sistem notifikasi aplikasi
        try {
          await apiRequest("POST", "/api/notifications", {
            type: "system_message",
            title: "Email Terverifikasi",
            content: "Email Anda telah berhasil diverifikasi. Terima kasih!",
            isRead: false
          });
        } catch (err) {
          console.error("Failed to create notification", err);
        }
        
        // Tunggu sedikit lebih lama sehingga pengguna dapat melihat pesan sukses
        setTimeout(() => {
          onOpenChange(false);
          
          // Tambahkan parameter URL verified=success untuk memicu notifikasi
          const url = new URL(window.location.href);
          url.searchParams.set('verified', 'success');
          
          // Gunakan history API untuk tidak memicu refresh penuh
          window.history.pushState({}, '', url.toString());
          
          console.log("Email berhasil diverifikasi, memicu notifikasi sukses");
          
          // Picu event kustom untuk memberi tahu SuccessNotification
          window.dispatchEvent(new Event('email-verified'));
          
          // Picu juga event popstate sebagai backup
          window.dispatchEvent(new Event('popstate'));
          
          // Tampilkan toast langsung dari sini juga untuk memastikan
          toast({
            title: "Email Berhasil Diverifikasi! ✓",
            description: (
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">Verifikasi Berhasil</span>
                </div>
                <p className="mt-1">
                  Email Anda telah berhasil diverifikasi. Anda sekarang dapat menggunakan semua fitur FourByte.
                </p>
              </div>
            ),
            variant: "default",
            className: "bg-green-50 border-green-200 text-green-800",
            duration: 10000, // 10 detik
          });
        }, 2000);
      } else {
        const errorData = await response.json();
        toast({
          title: "Verifikasi gagal",
          description: errorData.message || "Kode verifikasi tidak valid",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memverifikasi email",
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
          title: "Kode verifikasi terkirim!",
          description: "Kode verifikasi baru telah dikirim ke email Anda",
          variant: "default",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Gagal mengirim kode",
          description: errorData.message || "Tidak dapat mengirim kode verifikasi",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mengirim ulang kode verifikasi",
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
                <span>Email Terverifikasi</span>
              </>
            ) : (
              <>
                <Mail className="h-5 w-5 text-primary" />
                <span>Verifikasi Email Anda</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isVerified ? (
              "Email Anda telah terverifikasi. Terima kasih!"
            ) : (
              <>
                Kami telah mengirimkan kode verifikasi ke email Anda ({user?.email}).
                Masukkan kode 6 digit untuk memverifikasi email Anda.
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
                    <FormLabel>Kode Verifikasi</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Masukkan kode 6 digit"
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
                      Memverifikasi...
                    </>
                  ) : (
                    "Verifikasi"
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
                        Mengirim...
                      </>
                    ) : (
                      "Kirim Ulang Kode"
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                    className="text-sm"
                  >
                    Nanti saja
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
              Tutup
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}