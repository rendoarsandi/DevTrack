import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Invoice, InsertInvoice, UpdateInvoice } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Hook untuk mengambil semua invoice
export function useInvoices() {
  return useQuery({
    queryKey: ["/api/invoices"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/invoices");
      return await res.json() as Invoice[];
    }
  });
}

// Hook untuk mengambil invoice untuk admin
export function useAdminInvoices() {
  return useQuery({
    queryKey: ["/api/admin/invoices"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/invoices");
      return await res.json() as Invoice[];
    }
  });
}

// Hook untuk mengambil invoice berdasarkan projectId
export function useProjectInvoices(projectId: number) {
  return useQuery({
    queryKey: ["/api/projects", projectId, "invoices"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/projects/${projectId}/invoices`);
      return await res.json() as Invoice[];
    },
    enabled: !!projectId, // Hanya jalankan query jika projectId tersedia
  });
}

// Hook untuk mengambil detail invoice berdasarkan invoiceId
export function useInvoice(invoiceId: number) {
  return useQuery({
    queryKey: ["/api/invoices", invoiceId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/invoices/${invoiceId}`);
      return await res.json() as Invoice;
    },
    enabled: !!invoiceId, // Hanya jalankan query jika invoiceId tersedia
  });
}

// Hook untuk membuat invoice baru (admin)
export function useCreateInvoice() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: InsertInvoice) => {
      const res = await apiRequest("POST", "/api/invoices", data);
      return await res.json() as Invoice;
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create invoice: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Hook untuk mengupdate invoice (admin)
export function useUpdateInvoice() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: UpdateInvoice) => {
      const res = await apiRequest("PATCH", `/api/invoices/${data.id}`, data);
      return await res.json() as Invoice;
    },
    onSuccess: (data) => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", data.id] });
      if (data.projectId) {
        queryClient.invalidateQueries({ queryKey: ["/api/projects", data.projectId, "invoices"] });
      }
      
      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update invoice: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}