import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatStatusLabel, statusColorMap } from "@/lib/utils";
import { 
  ArrowLeft, 
  CalendarClock, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  File, 
  MessageSquare, 
  User
} from "lucide-react";
import { Project, Feedback, Milestone } from "@shared/schema";

// Define Activity interface to match updated schema
interface Activity {
  id: number;
  projectId: number;
  type: string;
  content: string;
  createdAt: Date;
}

export default function AdminProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  
  // Fetch project details
  const { data: project, isLoading: isLoadingProject } = useQuery<Project>({
    queryKey: [`/api/admin/projects/${id}`],
    refetchOnWindowFocus: false,
  });
  
  // Fetch project activities
  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: [`/api/projects/${id}/activities`],
    refetchOnWindowFocus: false,
    enabled: !!project, 
  });
  
  // Fetch project milestones
  const { data: milestones = [] } = useQuery<Milestone[]>({
    queryKey: [`/api/projects/${id}/milestones`],
    refetchOnWindowFocus: false,
    enabled: !!project,
  });
  
  // Fetch project feedback
  const { data: feedback = [] } = useQuery<Feedback[]>({
    queryKey: [`/api/projects/${id}/feedback`],
    refetchOnWindowFocus: false,
    enabled: !!project,
  });
  
  // Mutation for updating project status
  const updateProjectMutation = useMutation({
    mutationFn: async (data: { 
      status: string, 
      adminFeedback?: string,
      quote?: number,
      timeline?: number
    }) => {
      const response = await apiRequest(
        "PATCH", 
        `/api/admin/projects/${id}`, 
        data
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "Project status has been updated successfully",
      });
      
      queryClient.invalidateQueries({
        queryKey: [`/api/admin/projects/${id}`],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/projects"],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${id}/activities`],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update project status",
        variant: "destructive",
      });
    },
  });
  
  // Handle status change
  const handleStatusChange = (newStatus: string) => {
    updateProjectMutation.mutate({ status: newStatus });
  };
  
  if (isLoadingProject) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }
  
  if (!project) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
          <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The project you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => navigate("/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </AdminLayout>
    );
  }
  
  // Format date with time
  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  const statusColor = statusColorMap[project.status];
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="ghost" 
              onClick={() => navigate("/admin")}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-heading font-bold">{project.title}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge style={{
                backgroundColor: statusColor.bg,
                color: statusColor.text,
              }}>
                {formatStatusLabel(project.status)}
              </Badge>
              <span className="text-muted-foreground">
                Client ID: {project.clientId}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select
              value={project.status}
              onValueChange={handleStatusChange}
              disabled={updateProjectMutation.isPending}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Change Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="awaiting_dp">Awaiting Down Payment</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline"
              onClick={() => navigate(`/admin/projects/${id}/edit`)}
            >
              Update Project
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-blue-100 text-blue-700">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-muted-foreground">
                    Created
                  </div>
                  <div className="font-medium">
                    {formatDateTime(project.createdAt)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-green-100 text-green-700">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-muted-foreground">
                    Budget
                  </div>
                  <div className="font-medium">
                    {formatCurrency(project.quote)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-purple-100 text-purple-700">
                  <User className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-muted-foreground">
                    Client
                  </div>
                  <div className="font-medium">
                    Client #{project.clientId}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-yellow-100 text-yellow-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-muted-foreground">
                    Progress
                  </div>
                  <div className="font-medium">
                    {project.progress}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Project Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{project.description}</p>
            
            {project.attachments && Array.isArray(project.attachments) && project.attachments.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Attachments</h3>
                <div className="flex flex-wrap gap-2">
                  {project.attachments.map((attachment, index) => {
                    // Handle different attachment formats (string or object)
                    const attachmentName = typeof attachment === 'string' 
                      ? attachment 
                      : attachment.name || 'file';
                    
                    return (
                      <a 
                        key={index}
                        href={`/api/files/${attachmentName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-2 bg-secondary rounded-md hover:bg-secondary/80"
                      >
                        <File className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">{attachmentName}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Admin Feedback Form - Only shown for pending review projects */}
        {project.status === "pending_review" && (
          <Card>
            <CardHeader>
              <CardTitle>Review Project Request</CardTitle>
              <p className="text-muted-foreground">
                Provide feedback to the client and approve this project request or request changes
              </p>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const feedback = (form.elements.namedItem('feedback') as HTMLTextAreaElement).value;
                const adminFeedback = feedback.trim();
                
                // Get quote and timeline values (if changed)
                const quoteInput = form.elements.namedItem('quote') as HTMLInputElement;
                const timelineInput = form.elements.namedItem('timeline') as HTMLInputElement;
                const quote = quoteInput.value ? parseInt(quoteInput.value) : undefined;
                const timeline = timelineInput.value ? parseInt(timelineInput.value) : undefined;
                
                if (!adminFeedback) {
                  toast({
                    title: "Error",
                    description: "Please provide feedback before changing status",
                    variant: "destructive",
                  });
                  return;
                }
                
                // Get selected status from form
                const status = (form.elements.namedItem('status') as HTMLSelectElement).value;
                
                // Update project with feedback, status, and potentially new quote/timeline
                updateProjectMutation.mutate({
                  status,
                  adminFeedback,
                  ...(quote !== undefined && { quote }),
                  ...(timeline !== undefined && { timeline }),
                });
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quote">Suggested Price (USD)</Label>
                    <Input 
                      id="quote" 
                      name="quote"
                      type="number" 
                      placeholder={project.quote.toString()}
                      min="1"
                    />
                    <p className="text-xs text-muted-foreground">
                      Current: ${project.quote}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timeline">Timeline (Weeks)</Label>
                    <Input 
                      id="timeline" 
                      name="timeline"
                      type="number"
                      placeholder={project.timeline.toString()}
                      min="1"
                    />
                    <p className="text-xs text-muted-foreground">
                      Current: {project.timeline} weeks
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label htmlFor="feedback">Feedback to Client</Label>
                  <Textarea 
                    id="feedback" 
                    placeholder="Provide feedback about the project request, suggest changes to pricing or timeline if needed..."
                    rows={4}
                    defaultValue={project.adminFeedback || ""}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Decision</Label>
                  <Select name="status" defaultValue="pending_review">
                    <SelectTrigger>
                      <SelectValue placeholder="Select decision" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending_review">Keep in Review (Request Changes)</SelectItem>
                      <SelectItem value="awaiting_dp">Approve & Request Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="reset" variant="outline">
                    Reset
                  </Button>
                  <Button type="submit" disabled={updateProjectMutation.isPending}>
                    {updateProjectMutation.isPending && (
                      <span className="mr-2">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                    )}
                    Submit Feedback
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        
        {/* Show Admin Feedback when available and not in pending review */}
        {project.adminFeedback && project.status !== "pending_review" && (
          <Card>
            <CardHeader>
              <CardTitle>Admin Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-md bg-secondary/30">
                <p className="whitespace-pre-wrap">{project.adminFeedback}</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Tabs defaultValue="activity">
          <TabsList className="mb-4">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="feedback">Messages</TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Project Activity</CardTitle>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // Log a commit activity
                    if (typeof window !== 'undefined') {
                      const commitMessage = window.prompt("Enter GitHub commit message:");
                      if (commitMessage) {
                        apiRequest("POST", `/api/projects/${id}/activities`, {
                          type: "commit",
                          content: commitMessage
                        })
                        .then(() => {
                          queryClient.invalidateQueries({
                            queryKey: [`/api/projects/${id}/activities`],
                          });
                          toast({
                            title: "Commit logged",
                            description: "GitHub commit has been logged to the project"
                          });
                        })
                        .catch(err => {
                          toast({
                            title: "Error",
                            description: err.message || "Failed to log commit",
                            variant: "destructive"
                          });
                        });
                      }
                    }
                  }}
                  size="sm"
                >
                  Log GitHub Commit
                </Button>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No activities recorded yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex gap-3">
                        <div className={`p-2 h-fit rounded-full ${
                          activity.type === 'commit' 
                            ? 'bg-green-100 text-green-700' 
                            : activity.type === 'payment' 
                              ? 'bg-yellow-100 text-yellow-700'
                              : activity.type === 'quotation'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                        }`}>
                          {activity.type === 'commit' ? (
                            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="4"></circle>
                              <line x1="1.05" y1="12" x2="7" y2="12"></line>
                              <line x1="17.01" y1="12" x2="22.96" y2="12"></line>
                            </svg>
                          ) : activity.type === 'payment' ? (
                            <DollarSign className="h-4 w-4" />
                          ) : (
                            <CalendarClock className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className="font-medium capitalize">{activity.type}</p>
                            <span className="text-sm text-muted-foreground">
                              {formatDateTime(activity.createdAt)}
                            </span>
                          </div>
                          <p className={activity.type === 'commit' ? 'font-mono text-sm' : ''}>{activity.content}</p>
                          <Separator className="my-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="milestones" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Project Milestones</CardTitle>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // Open a dialog to create a new milestone
                    if (typeof window !== 'undefined') {
                      const title = window.prompt("Enter milestone title:");
                      if (title) {
                        const description = window.prompt("Enter description (optional):");
                        const dueDate = new Date();
                        dueDate.setDate(dueDate.getDate() + 7); // Default due in 1 week
                        
                        // Create a new milestone
                        apiRequest("POST", `/api/projects/${id}/milestones`, {
                          title,
                          description: description || "",
                          dueDate: dueDate.toISOString(),
                          completed: false
                        })
                        .then(() => {
                          queryClient.invalidateQueries({
                            queryKey: [`/api/projects/${id}/milestones`],
                          });
                          toast({
                            title: "Milestone added",
                            description: "New milestone has been created"
                          });
                        })
                        .catch(err => {
                          toast({
                            title: "Error",
                            description: err.message || "Failed to create milestone",
                            variant: "destructive"
                          });
                        });
                      }
                    }
                  }}
                  size="sm"
                >
                  Add Milestone
                </Button>
              </CardHeader>
              <CardContent>
                {milestones.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No milestones set yet. Add some milestones to track project progress.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {milestones.map((milestone) => (
                      <div key={milestone.id} className="border p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{milestone.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              Due: {formatDateTime(milestone.dueDate)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge 
                              variant={milestone.completed ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => {
                                // Toggle milestone completion status
                                const newStatus = !milestone.completed;
                                apiRequest("PATCH", `/api/projects/${id}/milestones/${milestone.id}`, {
                                  completed: newStatus
                                })
                                .then(() => {
                                  queryClient.invalidateQueries({
                                    queryKey: [`/api/projects/${id}/milestones`],
                                  });
                                  
                                  // Also update project progress
                                  const completedCount = milestones.filter(m => 
                                    m.id !== milestone.id ? m.completed : newStatus
                                  ).length;
                                  const progress = Math.round((completedCount / milestones.length) * 100);
                                  
                                  apiRequest("PATCH", `/api/admin/projects/${id}`, {
                                    progress: progress
                                  })
                                  .then(() => {
                                    queryClient.invalidateQueries({
                                      queryKey: [`/api/admin/projects/${id}`],
                                    });
                                    queryClient.invalidateQueries({
                                      queryKey: ["/api/admin/projects"],
                                    });
                                  });
                                  
                                  toast({
                                    title: newStatus ? "Milestone completed" : "Milestone reopened",
                                    description: `Milestone "${milestone.title}" has been ${newStatus ? 'marked as completed' : 'reopened'}`
                                  });
                                })
                                .catch(err => {
                                  toast({
                                    title: "Error",
                                    description: err.message || "Failed to update milestone",
                                    variant: "destructive"
                                  });
                                });
                              }}
                            >
                              {milestone.completed ? "Completed" : "Mark Complete"}
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                if (typeof window !== 'undefined' && confirm("Are you sure you want to delete this milestone?")) {
                                  apiRequest("DELETE", `/api/projects/${id}/milestones/${milestone.id}`)
                                  .then(() => {
                                    queryClient.invalidateQueries({
                                      queryKey: [`/api/projects/${id}/milestones`],
                                    });
                                    toast({
                                      title: "Milestone deleted",
                                      description: `Milestone "${milestone.title}" has been deleted`
                                    });
                                  })
                                  .catch(err => {
                                    toast({
                                      title: "Error",
                                      description: err.message || "Failed to delete milestone",
                                      variant: "destructive"
                                    });
                                  });
                                }
                              }}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                        {milestone.description && (
                          <p className="mt-2">{milestone.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Client Messages</CardTitle>
              </CardHeader>
              <CardContent>
                {feedback.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No messages yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedback.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="p-2 h-fit rounded-full bg-indigo-100 text-indigo-700">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className="font-medium">Message</p>
                            <span className="text-sm text-muted-foreground">
                              {formatDateTime(item.createdAt)}
                            </span>
                          </div>
                          <p>{item.content}</p>
                          <Separator className="my-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}