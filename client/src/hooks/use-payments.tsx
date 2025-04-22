import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Payment, InsertPayment } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Hook untuk mengambil pembayaran untuk admin
export function useAdminPayments() {
  return useQuery({
    queryKey: ["/api/admin/payments"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/payments");
      return await res.json() as Payment[];
    }
  });
}

// Hook untuk mengambil pembayaran berdasarkan invoiceId
export function useInvoicePayments(invoiceId: number) {
  return useQuery({
    queryKey: ["/api/invoices", invoiceId, "payments"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/invoices/${invoiceId}/payments`);
      return await res.json() as Payment[];
    },
    enabled: !!invoiceId, // Hanya jalankan query jika invoiceId tersedia
  });
}

// Hook untuk membuat pembayaran baru
export function useCreatePayment() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: InsertPayment) => {
      const res = await apiRequest("POST", "/api/payments", data);
      return await res.json() as Payment;
    },
    onSuccess: (data) => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", data.invoiceId, "payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      
      toast({
        title: "Success",
        description: "Payment record created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create payment: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}