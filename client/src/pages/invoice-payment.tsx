import React, { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useInvoice } from "@/hooks/use-invoices";
import { useCreatePayment } from "@/hooks/use-payments";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ArrowLeft, AlertTriangle, CreditCard, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Schema for payment form validation
const paymentFormSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  method: z.enum(["bank_transfer", "virtual_account", "credit_card", "ewallet"], {
    required_error: "Payment method is required",
  }),
  notes: z.string().optional(),
  paymentProofUrl: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export default function InvoicePaymentPage() {
  // Get invoice ID from URL
  const [, params] = useRoute("/invoices/:id/pay");
  const id = params ? parseInt(params.id) : 0;
  const [, navigate] = useLocation();
  
  // State for file upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Fetch invoice data
  const { data: invoice, isLoading, error } = useInvoice(id);
  const { user } = useAuth();
  const createPayment = useCreatePayment();
  
  // Initialize form
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: invoice ? (invoice.amount - (invoice.paidAmount || 0)).toString() : "",
      method: "bank_transfer",
      notes: "",
    },
  });
  
  // File input change handler
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    
    // In a real app, we'd upload the file here and get a URL back
    // For now, we'll just pretend we have a URL
    if (file) {
      form.setValue("paymentProofUrl", "https://example.com/payment-proof.jpg");
    } else {
      form.setValue("paymentProofUrl", "");
    }
  };
  
  // Form submission handler
  async function onSubmit(data: PaymentFormValues) {
    if (!invoice || !user) return;
    
    try {
      setIsUploading(true);
      
      // In a real app, we'd upload the file here if not already done
      
      // Create payment record
      await createPayment.mutateAsync({
        invoiceId: invoice.id,
        projectId: invoice.projectId,
        clientId: user.id,
        amount: Number(data.amount),
        method: data.method,
        status: "pending", // Admin will need to verify the payment
        notes: data.notes,
        paymentProofUrl: data.paymentProofUrl,
      });
      
      // Navigate back to invoice detail
      navigate(`/invoices/${id}`);
    } catch (error) {
      console.error("Error submitting payment:", error);
    } finally {
      setIsUploading(false);
    }
  }
  
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
  
  // Don't allow payment if invoice is paid or cancelled
  if (invoice.status === "paid" || invoice.status === "cancelled") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/invoices/${id}`)} 
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoice
        </Button>
        
        <Alert variant={invoice.status === "paid" ? "default" : "destructive"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {invoice.status === "paid" ? "Invoice Already Paid" : "Invoice Cancelled"}
          </AlertTitle>
          <AlertDescription>
            {invoice.status === "paid" 
              ? "This invoice has already been paid in full."
              : "This invoice has been cancelled and cannot be paid."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Calculate amount due
  const amountPaid = invoice.paidAmount || 0;
  const amountDue = invoice.amount - amountPaid;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate(`/invoices/${id}`)} 
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Invoice
      </Button>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Payment Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Make a Payment</CardTitle>
              <CardDescription>
                Fill out the form to record a payment for invoice #{invoice.invoiceNumber}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Amount */}
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Amount</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                              Rp
                            </span>
                            <Input 
                              type="text"
                              placeholder="0.00" 
                              className="pl-10" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Amount due: {formatCurrency(amountDue)}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Payment Method */}
                  <FormField
                    control={form.control}
                    name="method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="virtual_account">Virtual Account</SelectItem>
                            <SelectItem value="credit_card">Credit Card</SelectItem>
                            <SelectItem value="ewallet">E-Wallet (OVO, GoPay, etc.)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose how you made the payment
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Payment Proof */}
                  <FormItem>
                    <FormLabel>Payment Proof</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("payment-proof")?.click()}
                          className="w-full"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {selectedFile ? selectedFile.name : "Upload payment proof"}
                        </Button>
                        <input
                          id="payment-proof"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Upload a screenshot of your payment receipt
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                  
                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Additional information about this payment" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createPayment.isPending || isUploading}
                  >
                    {createPayment.isPending || isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Submit Payment
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        {/* Invoice Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
              <CardDescription>
                {invoice.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice #:</span>
                <span className="font-medium">{invoice.invoiceNumber}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span>
                  {invoice.status === "sent" && <Badge variant="secondary">Sent</Badge>}
                  {invoice.status === "partial" && <Badge variant="warning">Partial</Badge>}
                  {invoice.status === "overdue" && <Badge variant="destructive">Overdue</Badge>}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date:</span>
                <span>{format(new Date(invoice.dueDate), "PP")}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-medium">{formatCurrency(invoice.amount)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span>{formatCurrency(amountPaid)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Due:</span>
                <span className="font-semibold text-primary">{formatCurrency(amountDue)}</span>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 px-6 py-4">
              <div className="text-sm text-muted-foreground">
                <p>Your payment will be reviewed by our admin team. Once verified, 
                   the invoice status will be updated.</p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}