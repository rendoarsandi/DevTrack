import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { ClipboardCheck, GitBranch, RefreshCcw, MessageSquare, Calendar, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface Activity {
  id: number;
  projectId: number;
  type: string;
  content: string;
  createdAt: Date;
}

export function ActivityFeed({ projectId }: { projectId: number | string }) {
  const { user } = useAuth();
  const [updateMessage, setUpdateMessage] = useState("");
  
  // Fetch project activities
  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: [`/api/projects/${projectId}/activities`],
    refetchOnWindowFocus: false,
  });
  
  // Create activity mutation
  const createActivityMutation = useMutation({
    mutationFn: async (data: { type: string; content: string }) => {
      const response = await apiRequest(
        "POST", 
        `/api/projects/${projectId}/activities`, 
        data
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Update posted",
        description: "Your update has been posted successfully",
      });
      setUpdateMessage("");
      
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${projectId}/activities`],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post update",
        variant: "destructive",
      });
    },
  });
  
  const handleCreateUpdate = () => {
    if (!updateMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter an update message",
        variant: "destructive",
      });
      return;
    }
    
    createActivityMutation.mutate({
      type: "update",
      content: updateMessage
    });
  };
  
  const handleLogCommit = () => {
    if (typeof window !== 'undefined') {
      const commitMessage = window.prompt("Enter GitHub commit message:");
      if (commitMessage) {
        createActivityMutation.mutate({
          type: "commit",
          content: commitMessage
        });
      }
    }
  };
  
  // Format date relative to now for activity items
  const formatRelativeTime = (dateString: Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  };
  
  // Get icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'status':
        return <RefreshCcw className="h-4 w-4 text-blue-600" />;
      case 'milestone':
        return <ClipboardCheck className="h-4 w-4 text-green-600" />;
      case 'commit':
        return <GitBranch className="h-4 w-4 text-purple-600" />;
      case 'feedback':
        return <MessageSquare className="h-4 w-4 text-yellow-600" />;
      case 'update':
        return <Calendar className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Project Activity</CardTitle>
        <div className="flex gap-2">
          {user?.role === 'admin' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogCommit}
              disabled={createActivityMutation.isPending}
            >
              <GitBranch className="h-4 w-4 mr-2" />
              Log GitHub Commit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Post an update section */}
        <div className="space-y-2">
          <div className="flex space-x-2">
            <Input
              placeholder="Post a project update..."
              value={updateMessage}
              onChange={(e) => setUpdateMessage(e.target.value)}
              disabled={createActivityMutation.isPending}
            />
            <Button 
              onClick={handleCreateUpdate}
              disabled={createActivityMutation.isPending || !updateMessage.trim()}
            >
              {createActivityMutation.isPending ? 'Posting...' : 'Post Update'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Updates will be visible to all project members.
          </p>
        </div>
        
        <Separator />
        
        {/* Activity feed */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-6">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading activity...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No activity recorded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              ).map((activity) => (
                <div key={activity.id} className="border-l-2 pl-4 -ml-0.5 border-primary/30">
                  <div className="flex items-start">
                    <div className="mt-0.5 mr-2 p-1 rounded-full bg-primary/10">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm capitalize">
                          {activity.type} Update
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(activity.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm">{activity.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}