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
    mutationFn: async (data: { status: string }) => {
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
            
            {project.attachments && Array.isArray(project.attachments) && project.attachments.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Attachments</h3>
                <div className="flex flex-wrap gap-2">
                  {project.attachments.map((attachment, index) => (
                    <a 
                      key={index}
                      href={`/api/files/${attachment}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-2 bg-secondary rounded-md hover:bg-secondary/80"
                    >
                      <File className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">{attachment}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Tabs defaultValue="activity">
          <TabsList className="mb-4">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Activity</CardTitle>
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
                        <div className="p-2 h-fit rounded-full bg-blue-100 text-blue-700">
                          <CalendarClock className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className="font-medium">{activity.type}</p>
                            <span className="text-sm text-muted-foreground">
                              {formatDateTime(activity.createdAt)}
                            </span>
                          </div>
                          <p>{activity.content}</p>
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
              <CardHeader>
                <CardTitle>Project Milestones</CardTitle>
              </CardHeader>
              <CardContent>
                {milestones.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No milestones set yet
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
                          <Badge variant={milestone.completed ? "default" : "outline"}>
                            {milestone.completed ? "Completed" : "Pending"}
                          </Badge>
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
                <CardTitle>Client Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                {feedback.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No feedback provided yet
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
                            <p className="font-medium">Feedback</p>
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