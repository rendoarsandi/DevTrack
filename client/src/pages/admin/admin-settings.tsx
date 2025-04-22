import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export default function AdminSettings() {
  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure system settings and preferences
          </p>
        </div>
        
        <Tabs defaultValue="general">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
                <CardDescription>
                  Configure general platform settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platform-name">Platform Name</Label>
                  <Input id="platform-name" defaultValue="DevTrack" />
                  <p className="text-sm text-muted-foreground">
                    This will be displayed in the main header and emails
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="platform-description">Platform Description</Label>
                  <Textarea 
                    id="platform-description" 
                    defaultValue="A comprehensive project management platform for software development" 
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="font-medium">Maintenance Mode</h4>
                    <p className="text-sm text-muted-foreground">
                      Only administrators can access the platform
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <Separator />
                
                <div className="flex justify-end">
                  <Button type="submit">Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure the system's notification behaviors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Send email notifications for important events
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="font-medium">Project Updates</h4>
                      <p className="text-sm text-muted-foreground">
                        Notify clients about project status changes
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="font-medium">Payment Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Send reminders for upcoming and overdue payments
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="font-medium">Admin Alerts</h4>
                      <p className="text-sm text-muted-foreground">
                        Get notified about system issues and critical events
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-end">
                    <Button type="submit">Save Changes</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure security policies and access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input id="session-timeout" type="number" defaultValue="60" min="5" max="240" />
                  <p className="text-sm text-muted-foreground">
                    Users will be logged out after this period of inactivity
                  </p>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for all administrative users
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="font-medium">Strong Password Policy</h4>
                    <p className="text-sm text-muted-foreground">
                      Enforce complex passwords with minimum requirements
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <Separator />
                
                <div className="flex justify-end">
                  <Button type="submit">Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>
                  Customize the platform's visual appearance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border p-4 rounded-md cursor-pointer bg-primary/5 ring-2 ring-primary ring-offset-2">
                    <div className="h-20 bg-primary rounded-md mb-2"></div>
                    <p className="font-medium text-center">Default Theme</p>
                  </div>
                  <div className="border p-4 rounded-md cursor-pointer hover:bg-muted/50">
                    <div className="h-20 bg-zinc-800 rounded-md mb-2"></div>
                    <p className="font-medium text-center">Dark Theme</p>
                  </div>
                  <div className="border p-4 rounded-md cursor-pointer hover:bg-muted/50">
                    <div className="h-20 bg-blue-600 rounded-md mb-2"></div>
                    <p className="font-medium text-center">Blue Theme</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="font-medium">Custom Branding</h4>
                    <p className="text-sm text-muted-foreground">
                      Use custom logo and color scheme
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <Separator />
                
                <div className="flex justify-end">
                  <Button type="submit">Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}