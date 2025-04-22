import React, { useState } from "react";
import { useNavigate } from "wouter";
import { Invoice } from "@shared/schema";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Eye, FileText, CreditCard } from "lucide-react";

interface InvoiceListProps {
  invoices: Invoice[];
  title?: string;
  description?: string;
  showProjectInfo?: boolean;
}

export function InvoiceList({ 
  invoices, 
  title = "Invoices", 
  description = "Manage your invoices and payments",
  showProjectInfo = false
}: InvoiceListProps) {
  const navigate = useNavigate();
  
  // Function to get status badge
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
  
  // Function to get invoice type badge
  function getTypeBadge(type: string) {
    switch(type) {
      case 'dp':
        return <Badge variant="outline">Down Payment</Badge>;
      case 'final':
        return <Badge variant="outline">Final Payment</Badge>;
      case 'milestone':
        return <Badge variant="outline">Milestone</Badge>;
      case 'full':
        return <Badge variant="outline">Full Payment</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center p-4">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No invoices found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice Number</TableHead>
                {showProjectInfo && <TableHead>Project</TableHead>}
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  {showProjectInfo && <TableCell>{invoice.title}</TableCell>}
                  <TableCell>{getTypeBadge(invoice.type)}</TableCell>
                  <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                  <TableCell>{format(new Date(invoice.dueDate), "PP")}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(`/invoices/${invoice.id}`)}
                        title="View Invoice"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {invoice.status !== 'paid' && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => navigate(`/invoices/${invoice.id}/pay`)}
                          title="Make Payment"
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}