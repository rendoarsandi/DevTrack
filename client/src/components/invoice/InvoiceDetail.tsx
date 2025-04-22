import React, { useState } from "react";
import { Invoice, Payment } from "@shared/schema";
import { useInvoicePayments } from "@/hooks/use-payments";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { AlertTriangle, Download, Check, CreditCard, Printer } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface InvoiceDetailProps {
  invoice: Invoice;
  onPay?: () => void;
}

export function InvoiceDetail({ invoice, onPay }: InvoiceDetailProps) {
  const { data: payments = [], isLoading } = useInvoicePayments(invoice.id);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  
  // Function to get status badge with appropriate styling
  function getStatusBadge(status: string) {
    switch(status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'sent':
        return <Badge variant="secondary">Sent</Badge>;
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'partial':
        return <Badge variant="warning">Partial</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }
  
  // Function to get payment status badge
  function getPaymentStatusBadge(status: string) {
    switch(status) {
      case 'success':
        return <Badge variant="success">Success</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }
  
  // Calculate the amount remaining
  const amountPaid = invoice.paidAmount || 0;
  const amountRemaining = invoice.amount - amountPaid;
  const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid';
  
  return (
    <div className="space-y-6">
      {/* Invoice Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl">Invoice #{invoice.invoiceNumber}</CardTitle>
            <CardDescription>
              Issued on {format(new Date(invoice.issueDate), "PPP")}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(invoice.status)}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowPrintDialog(true)}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Info */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Project</h3>
              <p className="font-medium">{invoice.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{invoice.description}</p>
            </div>
            
            {/* Payment Info */}
            <div className="md:text-right">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Payment Details</h3>
              <p className="font-medium">Due: {format(new Date(invoice.dueDate), "PPP")}</p>
              <p className="text-sm text-muted-foreground mt-1">Type: {invoice.type.toUpperCase()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(invoice.amount)}</span>
            </div>
            
            {/* Can add tax or discount here if needed */}
            
            <Separator />
            
            <div className="flex justify-between items-center font-medium">
              <span>Total</span>
              <span className="text-lg">{formatCurrency(invoice.amount)}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Amount Paid</span>
              <span>{formatCurrency(amountPaid)}</span>
            </div>
            
            <div className="flex justify-between items-center font-medium">
              <span>Balance Due</span>
              <span className={amountRemaining > 0 ? (isOverdue ? "text-destructive" : "text-primary") : "text-green-500"}>
                {formatCurrency(amountRemaining)}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {invoice.status !== 'paid' ? (
            <>
              {isOverdue && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Overdue</AlertTitle>
                  <AlertDescription>
                    This invoice is past its due date. Please make payment as soon as possible.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="w-full flex justify-end">
                <Button 
                  onClick={onPay} 
                  disabled={invoice.status === 'cancelled'}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay Now
                </Button>
              </div>
            </>
          ) : (
            <div className="w-full flex justify-center items-center text-green-500">
              <Check className="mr-2 h-5 w-5" />
              <span className="font-medium">Paid in Full</span>
            </div>
          )}
        </CardFooter>
      </Card>
      
      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center p-4">
              <p className="text-sm text-muted-foreground">Loading payment history...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center p-4">
              <p className="text-sm text-muted-foreground">No payment records found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{format(new Date(payment.paymentDate), "PP")}</TableCell>
                    <TableCell className="capitalize">{payment.method}</TableCell>
                    <TableCell>
                      {payment.transactionId ? payment.transactionId : 'N/A'}
                    </TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Notes and Terms */}
      {(invoice.notes || invoice.termsAndConditions) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {invoice.notes && (
              <div>
                <h3 className="text-sm font-medium mb-1">Notes</h3>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </div>
            )}
            {invoice.termsAndConditions && (
              <div>
                <h3 className="text-sm font-medium mb-1">Terms and Conditions</h3>
                <p className="text-sm text-muted-foreground">{invoice.termsAndConditions}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Print Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print or Download Invoice</DialogTitle>
            <DialogDescription>
              Choose how you want to save this invoice
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 gap-4 py-4">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print Invoice
            </Button>
            
            <Button variant="outline" onClick={() => {
              // This would be implemented with a proper PDF generation service
              alert('Download feature will be implemented with Xendit API');
            }}>
              <Download className="mr-2 h-4 w-4" />
              Download as PDF
            </Button>
          </div>
          
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowPrintDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}