import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

export default function Settings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSaveProfile = (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    }, 1000);
  };
  
  const handleSavePassword = (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
    }, 1000);
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileMenu />
      <div className="flex flex-col flex-1 w-0 overflow-hidden md:ml-64">
        <main className="flex-1 relative overflow-y-auto focus:outline-none custom-scrollbar pt-16 md:pt-0">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-heading font-bold mb-6">Settings</h1>
              
              <Tabs defaultValue="profile" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  <TabsTrigger value="billing">Billing</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Settings</CardTitle>
                      <CardDescription>
                        Update your personal information
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSaveProfile}>
                        <div className="grid gap-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-semibold">
                              {user?.fullName
                                ?.split(" ")
                                .map(n => n[0])
                                .join("")
                                .toUpperCase()
                                .substring(0, 2) || "U"}
                            </div>
                            <Button type="button" variant="outline" size="sm">
                              Change Avatar
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="fullName">Full Name</Label>
                              <Input 
                                id="fullName" 
                                defaultValue={user?.fullName} 
                                placeholder="Your full name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="username">Username</Label>
                              <Input 
                                id="username" 
                                defaultValue={user?.username} 
                                placeholder="Your username"
                                disabled
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input 
                              id="email" 
                              type="email" 
                              defaultValue={user?.email} 
                              placeholder="Your email address"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="company">Company</Label>
                            <Input 
                              id="company" 
                              placeholder="Your company name"
                            />
                          </div>
                          
                          <div className="flex justify-end">
                            <Button type="submit" disabled={isLoading}>
                              {isLoading ? "Saving..." : "Save Changes"}
                            </Button>
                          </div>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="security">
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Settings</CardTitle>
                      <CardDescription>
                        Manage your account security
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSavePassword}>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input 
                              id="current-password" 
                              type="password" 
                              placeholder="Your current password"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input 
                              id="new-password" 
                              type="password" 
                              placeholder="Your new password"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input 
                              id="confirm-password" 
                              type="password" 
                              placeholder="Confirm your new password"
                            />
                          </div>
                          
                          <Separator />
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">Two-Factor Authentication</h3>
                              <p className="text-sm text-muted-foreground">
                                Add an extra layer of security to your account
                              </p>
                            </div>
                            <Switch />
                          </div>
                          
                          <div className="flex justify-end">
                            <Button type="submit" disabled={isLoading}>
                              {isLoading ? "Saving..." : "Update Password"}
                            </Button>
                          </div>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="notifications">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Settings</CardTitle>
                      <CardDescription>
                        Manage how we contact you
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="font-medium">Email Notifications</h3>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="project-updates">Project Updates</Label>
                              <p className="text-sm text-muted-foreground">
                                Receive notifications about your project status changes
                              </p>
                            </div>
                            <Switch id="project-updates" defaultChecked />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="payment-reminders">Payment Reminders</Label>
                              <p className="text-sm text-muted-foreground">
                                Get notified when payments are due
                              </p>
                            </div>
                            <Switch id="payment-reminders" defaultChecked />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="marketing-emails">Marketing Emails</Label>
                              <p className="text-sm text-muted-foreground">
                                Receive promotions and special offers
                              </p>
                            </div>
                            <Switch id="marketing-emails" />
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-4">
                          <h3 className="font-medium">In-App Notifications</h3>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="message-notifications">New Messages</Label>
                              <p className="text-sm text-muted-foreground">
                                Notify when you receive a new message
                              </p>
                            </div>
                            <Switch id="message-notifications" defaultChecked />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="milestone-notifications">Milestone Updates</Label>
                              <p className="text-sm text-muted-foreground">
                                Notify when a project milestone is completed
                              </p>
                            </div>
                            <Switch id="milestone-notifications" defaultChecked />
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button>Save Preferences</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="billing">
                  <Card>
                    <CardHeader>
                      <CardTitle>Billing Information</CardTitle>
                      <CardDescription>
                        Manage your payment methods and billing details
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="font-medium">Payment Methods</h3>
                          
                          <div className="border rounded-md p-4 flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="w-10 h-6 bg-blue-600 rounded mr-3"></div>
                              <div>
                                <p className="font-medium">Visa ending in 4242</p>
                                <p className="text-sm text-muted-foreground">Expires 12/24</p>
                              </div>
                            </div>
                            <div>
                              <Button variant="ghost" size="sm">Delete</Button>
                              <Button variant="ghost" size="sm">Edit</Button>
                            </div>
                          </div>
                          
                          <Button variant="outline">
                            <span className="mr-2">+</span>
                            Add Payment Method
                          </Button>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-4">
                          <h3 className="font-medium">Billing Address</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="billing-name">Full Name</Label>
                              <Input id="billing-name" defaultValue={user?.fullName} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="billing-email">Email</Label>
                              <Input id="billing-email" defaultValue={user?.email} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="billing-address">Address</Label>
                              <Input id="billing-address" placeholder="Your address" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="billing-city">City</Label>
                              <Input id="billing-city" placeholder="Your city" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="billing-state">State</Label>
                              <Input id="billing-state" placeholder="Your state/province" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="billing-zip">ZIP / Postal Code</Label>
                              <Input id="billing-zip" placeholder="Your postal code" />
                            </div>
                          </div>
                          
                          <div className="flex justify-end">
                            <Button>Save Billing Information</Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}