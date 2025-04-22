import React from "react";
import { useInvoices } from "@/hooks/use-invoices";
import { InvoiceList } from "@/components/invoice/InvoiceList";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "wouter";

export default function InvoicesPage() {
  const { data: invoices, isLoading, error } = useInvoices();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Admin can create new invoices
  const isAdmin = user?.role === "admin";
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center">
        <p className="text-red-500">Error loading invoices</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Invoices</h1>
        {isAdmin && (
          <Button onClick={() => navigate("/invoices/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        )}
      </div>
      
      <InvoiceList 
        invoices={invoices || []} 
        showProjectInfo={true}
      />
    </div>
  );
}