import React from "react";
import { useRoute, useLocation } from "wouter";
import { useInvoice } from "@/hooks/use-invoices";
import { InvoiceForm } from "@/components/invoice/InvoiceForm";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function InvoiceFormPage() {
  // Get invoice ID from URL if editing
  const [, params] = useRoute("/invoices/:id/edit");
  const [isNewRoute] = useRoute("/invoices/new");
  const id = params ? parseInt(params.id) : 0;
  const [, navigate] = useLocation();
  
  // Fetch invoice data if editing
  const { data: invoice, isLoading, error } = useInvoice(id);
  const { user } = useAuth();
  
  // Redirect if not admin
  if (user?.role !== "admin") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/invoices")} 
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to {isNewRoute ? "create" : "edit"} invoices.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Show loading state if fetching invoice for editing
  if (!isNewRoute && isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Show error if invoice not found when editing
  if (!isNewRoute && (error || !invoice)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/invoices")} 
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error ? error.message : "Invoice not found"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate(isNewRoute ? "/invoices" : `/invoices/${id}`)} 
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {isNewRoute ? "Back to Invoices" : "Back to Invoice Details"}
      </Button>
      
      <InvoiceForm
        invoice={isNewRoute ? undefined : invoice}
        onSuccess={() => navigate(isNewRoute ? "/invoices" : `/invoices/${id}`)}
      />
    </div>
  );
}