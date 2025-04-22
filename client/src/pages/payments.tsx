import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Download, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

// Mock payment data
const PAYMENT_HISTORY = [
  { 
    id: "INV-001", 
    date: "2023-04-15", 
    amount: 500.00, 
    status: "paid", 
    project: "E-Commerce Website", 
    description: "50% Down Payment" 
  },
  { 
    id: "INV-002", 
    date: "2023-05-30", 
    amount: 500.00, 
    status: "paid", 
    project: "E-Commerce Website", 
    description: "Final Payment" 
  },
  { 
    id: "INV-003", 
    date: "2023-06-10", 
    amount: 350.00, 
    status: "pending", 
    project: "Mobile App Design", 
    description: "50% Down Payment" 
  },
  { 
    id: "INV-004", 
    date: "2023-07-01", 
    amount: 120.00, 
    status: "overdue", 
    project: "Logo Redesign", 
    description: "Full Payment" 
  },
];

// Mock upcoming payments
const UPCOMING_PAYMENTS = [
  { 
    id: "UP-001", 
    dueDate: "2023-08-15", 
    amount: 750.00, 
    project: "Dashboard Project", 
    description: "Down Payment (50%)" 
  },
  { 
    id: "UP-002", 
    dueDate: "2023-09-01", 
    amount: 350.00, 
    project: "Mobile App Design", 
    description: "Final Payment (50%)" 
  },
];

export default function Payments() {
  const { user } = useAuth();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  
  const handleMakePayment = () => {
    // Simulate payment processing
    toast({
      title: "Payment successful",
      description: `Your payment of $${selectedInvoice?.amount.toFixed(2)} has been processed.`,
    });
    
    setIsPaymentDialogOpen(false);
  };
  
  // Format date to readable format
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return "bg-green-100 text-green-800";
      case 'pending':
        return "bg-yellow-100 text-yellow-800";
      case 'overdue':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileMenu />
      <div className="flex flex-col flex-1 w-0 overflow-hidden md:ml-64">
        <main className="flex-1 relative overflow-y-auto focus:outline-none custom-scrollbar pt-16 md:pt-0">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-heading font-bold mb-6">Payments</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                        <p className="text-2xl font-semibold">$1,000.00</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Pending</p>
                        <p className="text-2xl font-semibold">$350.00</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                        <p className="text-2xl font-semibold">$120.00</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Tabs defaultValue="history" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="history">Payment History</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming Payments</TabsTrigger>
                  <TabsTrigger value="methods">Payment Methods</TabsTrigger>
                </TabsList>
                
                <TabsContent value="history">
                  <Card>
                    <CardHeader>
                      <CardTitle>Transaction History</CardTitle>
                      <CardDescription>
                        View your past payment transactions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {PAYMENT_HISTORY.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell className="font-medium">{payment.id}</TableCell>
                              <TableCell>{formatDate(payment.date)}</TableCell>
                              <TableCell>{payment.project}</TableCell>
                              <TableCell>{payment.description}</TableCell>
                              <TableCell>${payment.amount.toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(payment.status)}>
                                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {payment.status === 'pending' || payment.status === 'overdue' ? (
                                  <Button 
                                    size="sm" 
                                    onClick={() => {
                                      setSelectedInvoice(payment);
                                      setIsPaymentDialogOpen(true);
                                    }}
                                  >
                                    Pay Now
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="outline">
                                    <Download className="h-4 w-4 mr-1" />
                                    Receipt
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="upcoming">
                  <Card>
                    <CardHeader>
                      <CardTitle>Upcoming Payments</CardTitle>
                      <CardDescription>
                        View your scheduled payments
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {UPCOMING_PAYMENTS.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Invoice #</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead>Project</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {UPCOMING_PAYMENTS.map((payment) => (
                              <TableRow key={payment.id}>
                                <TableCell className="font-medium">{payment.id}</TableCell>
                                <TableCell>{formatDate(payment.dueDate)}</TableCell>
                                <TableCell>{payment.project}</TableCell>
                                <TableCell>{payment.description}</TableCell>
                                <TableCell>${payment.amount.toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    size="sm" 
                                    onClick={() => {
                                      setSelectedInvoice(payment);
                                      setIsPaymentDialogOpen(true);
                                    }}
                                  >
                                    Pay Now
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No upcoming payments</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="methods">
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Methods</CardTitle>
                      <CardDescription>
                        Manage your payment methods
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="border rounded-md p-4 flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-10 h-6 bg-blue-600 rounded mr-3"></div>
                          <div>
                            <p className="font-medium">Visa ending in 4242</p>
                            <p className="text-sm text-muted-foreground">Expires 12/24</p>
                          </div>
                        </div>
                        <div>
                          <Badge>Default</Badge>
                        </div>
                      </div>
                      
                      <div className="border rounded-md p-4 flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-10 h-6 bg-red-600 rounded mr-3"></div>
                          <div>
                            <p className="font-medium">Mastercard ending in 5555</p>
                            <p className="text-sm text-muted-foreground">Expires 06/25</p>
                          </div>
                        </div>
                        <div>
                          <Button variant="ghost" size="sm">Make Default</Button>
                        </div>
                      </div>
                      
                      <Button className="w-full" variant="outline">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Add Payment Method
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              
              {/* Payment Dialog */}
              <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Make Payment</DialogTitle>
                    <DialogDescription>
                      Complete your payment for {selectedInvoice?.project}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Invoice</p>
                        <p className="font-medium">{selectedInvoice?.id}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Amount</p>
                        <p className="font-medium">${selectedInvoice?.amount.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <Select 
                        value={selectedPaymentMethod}
                        onValueChange={setSelectedPaymentMethod}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="card">Visa ending in 4242</SelectItem>
                          <SelectItem value="card2">Mastercard ending in 5555</SelectItem>
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {selectedPaymentMethod === 'bank' && (
                      <div className="space-y-2">
                        <Label>Reference Number</Label>
                        <Input placeholder="Enter payment reference" />
                      </div>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleMakePayment}>
                      Complete Payment
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}