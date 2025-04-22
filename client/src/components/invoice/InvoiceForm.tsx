import React, { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useCreateInvoice, useUpdateInvoice } from "@/hooks/use-invoices";
import { Invoice } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Schema for form validation
const invoiceFormSchema = z.object({
  projectId: z.number({
    required_error: "Project is required",
  }),
  clientId: z.number({
    required_error: "Client is required",
  }),
  title: z.string().min(1, {
    message: "Title is required",
  }),
  description: z.string().min(1, {
    message: "Description is required",
  }),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  type: z.enum(["dp", "final", "milestone", "full"], {
    required_error: "Invoice type is required",
  }),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  status: z.enum(["draft", "sent", "paid", "partial", "overdue", "cancelled"], {
    required_error: "Status is required",
  }).default("draft"),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  invoice?: Invoice;
  projectId?: number;
  clientId?: number;
  onSuccess?: () => void;
}

export function InvoiceForm({ invoice, projectId, clientId, onSuccess }: InvoiceFormProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  
  // Define default values for form
  const defaultValues: Partial<InvoiceFormValues> = invoice 
    ? {
        projectId: invoice.projectId,
        clientId: invoice.clientId,
        title: invoice.title,
        description: invoice.description,
        amount: invoice.amount.toString(),
        type: invoice.type as any,
        status: invoice.status as any,
        dueDate: new Date(invoice.dueDate),
        notes: invoice.notes || "",
        termsAndConditions: invoice.termsAndConditions || "",
      } 
    : {
        projectId: projectId,
        clientId: clientId,
        status: "draft",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      };
  
  // Initialize form
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues,
  });
  
  // Form submission handler
  async function onSubmit(data: InvoiceFormValues) {
    try {
      // Convert amount to number
      const formattedData = {
        ...data,
        amount: Number(data.amount),
      };
      
      if (invoice) {
        // Update existing invoice
        await updateInvoice.mutateAsync({
          id: invoice.id,
          ...formattedData,
        });
      } else {
        // Create new invoice
        await createInvoice.mutateAsync(formattedData as any);
      }
      
      // Show success message
      toast({
        title: invoice ? "Invoice Updated" : "Invoice Created",
        description: invoice 
          ? `Invoice #${invoice.invoiceNumber} has been updated` 
          : "A new invoice has been created",
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Otherwise navigate back
        navigate(invoice ? `/invoices/${invoice.id}` : "/invoices");
      }
    } catch (error) {
      console.error("Error submitting invoice:", error);
      
      // Show error message
      toast({
        title: "Error",
        description: "There was a problem saving the invoice. Please try again.",
        variant: "destructive",
      });
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{invoice ? "Edit Invoice" : "Create New Invoice"}</CardTitle>
        <CardDescription>
          {invoice 
            ? `Edit details for invoice #${invoice.invoiceNumber}` 
            : "Fill out the form to create a new invoice"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Invoice for project services" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Invoice Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select invoice type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="dp">Down Payment</SelectItem>
                        <SelectItem value="final">Final Payment</SelectItem>
                        <SelectItem value="milestone">Milestone</SelectItem>
                        <SelectItem value="full">Full Payment</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed description of services included in this invoice" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
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
                    <FormDescription>Enter the amount in IDR (Indonesian Rupiah)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Due Date */}
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className="w-full pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() // Can't select dates in the past
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select invoice status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional notes or special instructions" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Terms and Conditions */}
              <FormField
                control={form.control}
                name="termsAndConditions"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Terms and Conditions</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Terms and conditions for this invoice" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(invoice ? `/invoices/${invoice.id}` : "/invoices")}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createInvoice.isPending || updateInvoice.isPending}
              >
                {createInvoice.isPending || updateInvoice.isPending ? "Saving..." : invoice ? "Update Invoice" : "Create Invoice"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}