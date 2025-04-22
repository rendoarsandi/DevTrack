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
  User,
  ClipboardList,
  ClipboardCheck,
  FileCheck,
  Edit
} from "lucide-react";
import { ProjectReviewForm } from "@/components/admin/ProjectReviewForm";
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
      timeline?: number,
      paymentStatus?: number,
      progress?: number
    }) => {
      // Auto-calculate payment status and progress based on status
      let updatedData = {...data};
      
      if (data.status === "awaiting_dp" && !data.paymentStatus) {
        updatedData.paymentStatus = 0; // Menunggu Down Payment
        updatedData.progress = 10;
      } 
      else if (data.status === "in_progress" && !data.paymentStatus) {
        updatedData.paymentStatus = 50; // DP sudah dibayar (50%)
        updatedData.progress = 30;
      }
      else if (data.status === "under_review" && !data.paymentStatus) {
        updatedData.progress = 80; // Project hampir selesai
      }
      else if (data.status === "completed" && !data.paymentStatus) {
        updatedData.paymentStatus = 100; // Full payment completed
        updatedData.progress = 100;
      }
      else if (data.status === "rejected") {
        updatedData.paymentStatus = 0;
        updatedData.progress = 0;
      }
      
      const response = await apiRequest(
        "PATCH", 
        `/api/admin/projects/${id}`, 
        updatedData
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Status updated",
        description: "Project status has been updated successfully",
      });
      
      // Catat perubahan sebagai activity
      const newStatus = data.status;
      let activityContent = "";
      
      if (newStatus === "awaiting_dp") {
        activityContent = "Project approved by admin. Down payment required.";
      } else if (newStatus === "in_progress") {
        activityContent = "Down payment received. Project development started.";
      } else if (newStatus === "under_review") {
        activityContent = "Project completed and submitted for client review.";
      } else if (newStatus === "approved") {
        activityContent = "Project approved by client. Awaiting final payment.";
      } else if (newStatus === "awaiting_handover") {
        activityContent = "Final payment received. Project files ready for handover.";
      } else if (newStatus === "completed") {
        activityContent = "Project completed and all deliverables handed over.";
      } else if (newStatus === "rejected") {
        activityContent = "Project request rejected by admin.";
      }
      
      // Jika ada perubahan status, catat sebagai activity
      if (activityContent) {
        apiRequest("POST", `/api/projects/${id}/activities`, {
          type: "status_change",
          content: activityContent
        });
      }
      
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
            {/* Action Buttons for Common Status Transitions */}
            {project.status === "in_progress" && (
              <Button
                variant="default"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => handleStatusChange("under_review")}
                disabled={updateProjectMutation.isPending}
              >
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Submit for Client Review
              </Button>
            )}
            
            {project.status === "awaiting_handover" && (
              <Button
                variant="default" 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleStatusChange("completed")}
                disabled={updateProjectMutation.isPending}
              >
                <FileCheck className="h-4 w-4 mr-2" />
                Complete Handover
              </Button>
            )}
            
            {/* Status Dropdown */}
            <Select
              value={project.status}
              onValueChange={handleStatusChange}
              disabled={updateProjectMutation.isPending}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Change Status" />
              </SelectTrigger>
              <SelectContent>
                {/* Admin hanya dapat mengubah status dalam flow process tertentu */}
                {project.status === "pending_review" && (
                  <>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="awaiting_dp">Approve & Request Down Payment</SelectItem>
                    <SelectItem value="rejected">Reject Project</SelectItem>
                  </>
                )}
                {project.status === "awaiting_dp" && (
                  <>
                    <SelectItem value="awaiting_dp">Awaiting Down Payment</SelectItem>
                    <SelectItem value="in_progress">Payment Received & Start Work</SelectItem>
                  </>
                )}
                {project.status === "in_progress" && (
                  <>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="under_review">Submit for Client Review</SelectItem>
                  </>
                )}
                {project.status === "under_review" && (
                  <SelectItem value="under_review">Under Review</SelectItem>
                )}
                {project.status === "approved" && (
                  <>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="awaiting_handover">Final Payment Received</SelectItem>
                  </>
                )}
                {project.status === "awaiting_handover" && (
                  <>
                    <SelectItem value="awaiting_handover">Awaiting Handover</SelectItem>
                    <SelectItem value="completed">Complete Handover</SelectItem>
                  </>
                )}
                {project.status === "completed" && (
                  <SelectItem value="completed">Completed</SelectItem>
                )}
                {project.status === "rejected" && (
                  <SelectItem value="rejected">Rejected</SelectItem>
                )}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline"
              onClick={() => navigate(`/admin/projects/${id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Project
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
            
            {project.attachments && typeof project.attachments === 'object' && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Attachments</h3>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(project.attachments) && project.attachments.length > 0 && project.attachments.map((attachment: unknown, index: number) => {
                    // Handle different attachment formats (string or object)
                    const attachmentName = typeof attachment === 'string' 
                      ? attachment 
                      : (attachment && typeof attachment === 'object' && 'name' in attachment && typeof attachment.name === 'string') 
                        ? attachment.name 
                        : 'file';
                    
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
            {project.status === "under_review" && (
              <TabsTrigger value="review" className="flex items-center">
                <ClipboardList className="mr-2 h-4 w-4" />
                Review
              </TabsTrigger>
            )}
            {project.status === "awaiting_handover" && (
              <TabsTrigger value="handover" className="flex items-center">
                <File className="mr-2 h-4 w-4" />
                Handover
              </TabsTrigger>
            )}
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
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                  <span>Client Feedback & Revisions</span>
                </CardTitle>
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
                            <p className="font-medium">
                              {item.content.includes("REQUEST CHANGES:") ? (
                                <span className="text-orange-600">Revision Request</span>
                              ) : item.content.includes("REVIEW:") ? (
                                <span className="text-blue-600">Project Review</span>
                              ) : (
                                "Message"
                              )}
                            </p>
                            <span className="text-sm text-muted-foreground">
                              {formatDateTime(item.createdAt)}
                            </span>
                          </div>
                          <div className="mt-2 whitespace-pre-wrap">
                            {item.content.includes("REQUEST CHANGES:") ? (
                              <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                                <span className="block text-xs font-medium text-orange-800 mb-1">
                                  Client Requested Changes:
                                </span>
                                {item.content.replace("REQUEST CHANGES:", "")}
                              </div>
                            ) : item.content.includes("REVIEW:") ? (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <span className="block text-xs font-medium text-blue-800 mb-1">
                                  Project Review Feedback:
                                </span>
                                {item.content.replace("REVIEW:", "")}
                              </div>
                            ) : (
                              <p>{item.content}</p>
                            )}
                          </div>
                          
                          {/* Tampilkan lampiran jika ada */}
                          {item && 'attachments' in item && item.attachments && Array.isArray(item.attachments) && item.attachments.length > 0 && (
                            <div className="mt-3">
                              <h4 className="text-xs font-medium text-muted-foreground mb-2">Lampiran:</h4>
                              <div className="flex flex-wrap gap-2">
                                {(item.attachments as any[]).map((attachment: any, index: number) => {
                                  const fileName = typeof attachment === 'string' 
                                    ? attachment 
                                    : (attachment && typeof attachment === 'object' && 'name' in attachment) 
                                      ? String(attachment.name)
                                      : `file-${index}`;
                                  
                                  return (
                                    <a 
                                      key={index}
                                      href={`/api/files/${fileName}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center p-2 bg-secondary rounded-md hover:bg-secondary/80"
                                    >
                                      <File className="h-4 w-4 mr-2" />
                                      <span className="text-xs font-medium">{fileName}</span>
                                    </a>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          <Separator className="my-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Project Review Tab - Only shown for projects under review */}
          {project.status === "under_review" && (
            <TabsContent value="review" className="space-y-4">
              <ProjectReviewForm 
                project={project} 
                onComplete={() => {
                  // Refresh data after review is submitted
                  queryClient.invalidateQueries({
                    queryKey: [`/api/admin/projects/${id}`],
                  });
                  
                  toast({
                    title: "Review submitted",
                    description: "Your review has been recorded and the project status has been updated."
                  });
                }} 
              />
            </TabsContent>
          )}
          
          {/* Project Handover Tab - Only shown for projects awaiting handover */}
          {project.status === "awaiting_handover" && (
            <TabsContent value="handover" className="space-y-4">
              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="flex items-center">
                    <File className="h-5 w-5 mr-2 text-orange-600" />
                    <span>Project Handover</span>
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Client has completed final payment. Provide all project deliverables and documentation.
                  </p>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6" onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const handoverMessage = (form.elements.namedItem('handoverMessage') as HTMLTextAreaElement).value;
                    
                    if (!handoverMessage.trim()) {
                      toast({
                        title: "Error",
                        description: "Please provide handover instructions",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    // Submit handover feedback
                    apiRequest("POST", `/api/projects/${id}/feedback`, {
                      content: `PROJECT HANDOVER: ${handoverMessage}`,
                    }).then(() => {
                      // Update project status to completed
                      updateProjectMutation.mutate({
                        status: "completed",
                        progress: 100
                      });
                      
                      toast({
                        title: "Handover Complete",
                        description: "All project deliverables have been sent to the client",
                      });
                    });
                  }}>
                    <div className="space-y-4">
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                        <h3 className="text-sm font-medium text-amber-800 mb-2">Project Handover Checklist</h3>
                        <ul className="text-sm text-amber-700 space-y-2">
                          <li className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 mr-2 shrink-0 text-amber-600" />
                            <span>Source code repository access (GitHub, GitLab, etc.)</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 mr-2 shrink-0 text-amber-600" />
                            <span>Technical documentation including setup instructions</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 mr-2 shrink-0 text-amber-600" />
                            <span>Administrator credentials and access details</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 mr-2 shrink-0 text-amber-600" />
                            <span>API documentation (if applicable)</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 mr-2 shrink-0 text-amber-600" />
                            <span>User manual or usage instructions</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="handoverMessage">Handover Instructions</Label>
                        <Textarea 
                          id="handoverMessage" 
                          placeholder="Provide detailed instructions for the client to access and use their deliverables. Include repository URLs, credentials, documentation links, and any other relevant information..."
                          rows={8}
                          required
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label>Upload Final Deliverables</Label>
                        <div className="border border-dashed border-border rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                          <input type="file" className="hidden" id="deliverables-upload" multiple />
                          <label htmlFor="deliverables-upload" className="cursor-pointer block">
                            <span className="block mb-2">
                              <File className="h-6 w-6 mx-auto text-muted-foreground" />
                            </span>
                            <span className="text-sm font-medium">Click to upload files</span>
                            <span className="text-xs text-muted-foreground block mt-1">
                              ZIP, PDF, DOC up to 50MB
                            </span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={updateProjectMutation.isPending}>
                          {updateProjectMutation.isPending ? (
                            <span className="mr-2">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </span>
                          ) : null}
                          Complete Handover
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AdminLayout>
  );
}