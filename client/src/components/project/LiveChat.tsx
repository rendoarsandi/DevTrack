import { useState, useEffect, useRef } from "react";
import { Send, MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface LiveChatProps {
  projectId: number;
  isAdmin?: boolean;
}

interface ChatMessage {
  type: 'system' | 'chat';
  content: string;
  timestamp: string;
  sender: {
    id: string | number;
    username: string;
    role: string;
  };
  projectId?: number;
}

export function LiveChat({ projectId, isAdmin = false }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Connect to WebSocket when component mounts
  useEffect(() => {
    if (!user || !projectId) return;

    // Clear messages when component mounts or project changes
    setMessages([
      {
        type: 'system',
        content: 'Connecting to chat...',
        timestamp: new Date().toISOString(),
        sender: {
          id: 'system',
          username: 'System',
          role: 'system'
        }
      }
    ]);

    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?user=${encodeURIComponent(
      JSON.stringify({
        id: user.id,
        username: user.username,
        role: user.role
      })
    )}&projectId=${projectId}`;

    console.log("Attempting to connect to WebSocket at:", wsUrl);
    const socket = new WebSocket(wsUrl);
    
    // Setup event handlers
    socket.onopen = () => {
      console.log('WebSocket connection established');
      setWsConnected(true);
      
      // Add connected message
      setMessages(prev => [
        ...prev, 
        {
          type: 'system',
          content: 'Connected to chat server',
          timestamp: new Date().toISOString(),
          sender: {
            id: 'system',
            username: 'System',
            role: 'system'
          }
        }
      ]);
      
      toast({
        title: "Chat connected",
        description: "You are now connected to the live chat."
      });
    };
    
    socket.onmessage = (event) => {
      try {
        console.log("Message received:", event.data);
        const message = JSON.parse(event.data);
        setMessages(prev => [...prev, message]);
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setMessages(prev => [
        ...prev, 
        {
          type: 'system',
          content: 'Error connecting to chat server',
          timestamp: new Date().toISOString(),
          sender: {
            id: 'system',
            username: 'System',
            role: 'system'
          }
        }
      ]);
      
      toast({
        title: "Connection error",
        description: "Failed to connect to chat server",
        variant: "destructive"
      });
    };
    
    socket.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      setWsConnected(false);
      
      setMessages(prev => [
        ...prev, 
        {
          type: 'system',
          content: 'Disconnected from chat server',
          timestamp: new Date().toISOString(),
          sender: {
            id: 'system',
            username: 'System',
            role: 'system'
          }
        }
      ]);
    };
    
    ws.current = socket;
    
    // Cleanup function to close WebSocket on unmount
    return () => {
      console.log("Closing WebSocket connection");
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
      setWsConnected(false);
    };
  }, [user, projectId, toast]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Function to send a message
  const sendMessage = () => {
    if (!messageInput.trim() || !wsConnected || !ws.current) return;
    
    const messageText = messageInput.trim();
    const message = {
      content: messageText
    };
    
    try {
      console.log("Sending message:", message);
      
      // Send to server
      ws.current.send(JSON.stringify(message));
      
      // Add optimistic message to UI (this will be replaced with server's response)
      const optimisticMessage: ChatMessage = {
        type: 'chat',
        content: messageText,
        timestamp: new Date().toISOString(),
        sender: {
          id: user?.id || 0,
          username: user?.username || 'You',
          role: user?.role || 'client'
        },
        projectId: projectId
      };
      
      // Add to local messages
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Clear input
      setMessageInput("");
    } catch (e) {
      console.error('Error sending message:', e);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="flex flex-col h-[400px] border rounded-md overflow-hidden">
      <div className="bg-muted border-b border-border px-4 py-2">
        <h3 className="text-sm font-medium">
          {isAdmin ? "Admin Chat Support" : "Live Chat"}
        </h3>
        <p className="text-xs text-muted-foreground">
          {wsConnected ? (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
              Connected {isAdmin && "as Admin"}
            </>
          ) : (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>
              Disconnected
            </>
          )}
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">No messages yet</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex ${msg.sender.id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              {msg.type === 'system' ? (
                <div className="bg-muted px-3 py-2 rounded-md text-center text-xs text-muted-foreground w-full">
                  {msg.content}
                </div>
              ) : (
                <div 
                  className={`max-w-[70%] ${
                    msg.sender.id === user?.id 
                      ? 'bg-primary text-primary-foreground' 
                      : msg.sender.role === 'admin'
                        ? 'bg-secondary text-secondary-foreground'
                        : 'bg-muted text-foreground'
                  } rounded-lg px-3 py-2`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium">{msg.sender.username}</span>
                    <span className="text-xs opacity-70">{formatTimestamp(msg.timestamp)}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="bg-background p-3 border-t border-border flex items-center">
        <Input
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 mr-2"
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          disabled={!wsConnected}
        />
        <Button 
          size="icon"
          onClick={sendMessage}
          disabled={!wsConnected || !messageInput.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}