import React, { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useInvoice } from "@/hooks/use-invoices";
import { InvoiceDetail } from "@/components/invoice/InvoiceDetail";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Edit, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function InvoiceDetailPage() {
  // Get invoice ID from URL
  const [, params] = useRoute("/invoices/:id");
  const id = params ? parseInt(params.id) : 0;
  const [, navigate] = useLocation();
  
  // Fetch invoice data
  const { data: invoice, isLoading, error } = useInvoice(id);
  const { user } = useAuth();
  
  // Check if user is admin
  const isAdmin = user?.role === "admin";
  
  // Handle "Pay Now" button click
  const handlePayClick = () => {
    navigate(`/invoices/${id}/pay`);
  };
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !invoice) {
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
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/invoices")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
        
        {isAdmin && (
          <Button 
            variant="outline" 
            onClick={() => navigate(`/invoices/${id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Invoice
          </Button>
        )}
      </div>
      
      <InvoiceDetail invoice={invoice} onPay={handlePayClick} />
    </div>
  );
}