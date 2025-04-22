import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Search, Send } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const DEMO_MESSAGES = [
  {
    id: 1,
    sender: "Admin",
    content: "Your project request has been approved. We'll start work as soon as the down payment is processed.",
    timestamp: "2023-05-10T14:32:00",
    isFromUser: false,
  },
  {
    id: 2,
    sender: "You",
    content: "That's great! How do I submit the down payment?",
    timestamp: "2023-05-10T14:45:00",
    isFromUser: true,
  },
  {
    id: 3,
    sender: "Admin",
    content: "You can use the payment button on your project details page. Let me know if you have any issues.",
    timestamp: "2023-05-10T15:01:00",
    isFromUser: false,
  },
  {
    id: 4,
    sender: "You",
    content: "Got it, thanks! I'll do that right away.",
    timestamp: "2023-05-10T15:12:00",
    isFromUser: true,
  },
  {
    id: 5,
    sender: "Admin",
    content: "Great! I've set up the milestone schedule for your project. You can check it on the project details page.",
    timestamp: "2023-05-11T09:27:00",
    isFromUser: false,
  },
];

export default function Messages() {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState(DEMO_MESSAGES);
  
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message = {
      id: messages.length + 1,
      sender: "You",
      content: newMessage,
      timestamp: new Date().toISOString(),
      isFromUser: true,
    };
    
    setMessages([...messages, message]);
    setNewMessage("");
    
    // Simulate admin response after 1 second
    setTimeout(() => {
      const adminResponse = {
        id: messages.length + 2,
        sender: "Admin",
        content: "Thanks for your message. I'll get back to you shortly.",
        timestamp: new Date().toISOString(),
        isFromUser: false,
      };
      
      setMessages(prev => [...prev, adminResponse]);
    }, 1000);
  };
  
  // Format date for display
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
    });
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileMenu />
      <div className="flex flex-col flex-1 w-0 overflow-hidden md:ml-64">
        <main className="flex-1 relative overflow-y-auto focus:outline-none custom-scrollbar pt-16 md:pt-0">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-heading font-bold">Messages</h1>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    className="pl-8"
                  />
                </div>
              </div>
              
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle>Communication Center</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-md p-4 max-h-[500px] overflow-y-auto">
                      {messages.map((message, index) => (
                        <div key={message.id} className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'} mb-4`}>
                          <div className={`max-w-[80%] ${message.isFromUser ? 'bg-primary text-white' : 'bg-muted'} rounded-lg p-3`}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-semibold text-sm">{message.sender}</span>
                              <span className="text-xs opacity-70">{formatMessageDate(message.timestamp)}</span>
                            </div>
                            <p className="text-sm">{message.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendMessage();
                        }}
                      />
                      <Button onClick={handleSendMessage}>
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Contact Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Need additional help? Contact our support team directly.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-md p-4">
                        <h3 className="font-medium mb-1">Technical Support</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          For technical issues and implementation questions
                        </p>
                        <Button variant="outline" className="w-full">Contact Tech Support</Button>
                      </div>
                      
                      <div className="border rounded-md p-4">
                        <h3 className="font-medium mb-1">Billing Support</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          For payment and billing related inquiries
                        </p>
                        <Button variant="outline" className="w-full">Contact Billing Support</Button>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Priority Support</h3>
                        <p className="text-sm text-muted-foreground">
                          Get faster responses with priority support
                        </p>
                      </div>
                      <Button>Upgrade Now</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}