import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { Link, useLocation } from "wouter";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  CircleIcon, 
  GitPullRequest,
  Loader2 as Loader2Icon,
  ClipboardCheck
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Project, Activity, Feedback } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectDetailModalProps {
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectDetailModal({ projectId, isOpen, onClose }: ProjectDetailModalProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [feedbackContent, setFeedbackContent] = useState("");
  const { toast } = useToast();

  const { data: project, isLoading: isLoadingProject } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: isOpen && projectId > 0,
  });

  const { data: activities, isLoading: isLoadingActivities } = useQuery<Activity[]>({
    queryKey: [`/api/projects/${projectId}/activities`],
    enabled: isOpen && projectId > 0,
  });

  const { data: feedbacks, isLoading: isLoadingFeedbacks } = useQuery<Feedback[]>({
    queryKey: [`/api/projects/${projectId}/feedback`],
    enabled: isOpen && projectId > 0,
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest(
        "POST", 
        `/api/projects/${projectId}/feedback`, 
        { content }
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/feedback`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/activities`] });
      queryClient.invalidateQueries({ queryKey: [`/api/activities`] });
      setFeedbackContent("");
      toast({
        title: "Message sent successfully",
        description: "The development team will respond to your message soon."
      });
    }
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: async (paymentStatus: number) => {
      // Melakukan update pembayaran dan membuat activity log
      const res = await apiRequest(
        "PATCH", 
        `/api/projects/${projectId}`, 
        { paymentStatus }
      );
      
      // Buat activity log untuk payment
      let activityContent = "";
      if (paymentStatus === 50) {
        activityContent = "Down payment (50%) has been paid.";
      } else if (paymentStatus === 100) {
        activityContent = "Full payment completed.";
      }
      
      if (activityContent) {
        await apiRequest("POST", `/api/projects/${projectId}/activities`, {
          type: "payment",
          content: activityContent
        });
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/activities`] });
      queryClient.invalidateQueries({ queryKey: [`/api/activities`] });
      
      // Jika ini adalah down payment (50%), otomatis ubah status ke in_progress
      if (data.paymentStatus === 50 && data.status === "awaiting_dp") {
        // Update status proyek
        apiRequest("PATCH", `/api/projects/${projectId}`, {
          status: "in_progress"
        });
        
        toast({
          title: "Payment processed & project started",
          description: "Your down payment has been received. The development team will begin work on your project immediately."
        });
      } 
      // Jika ini adalah full payment (100%), otomatis ubah status ke completed
      else if (data.paymentStatus === 100) {
        // Update status proyek
        apiRequest("PATCH", `/api/projects/${projectId}`, {
          status: "completed"
        });
        
        toast({
          title: "Final payment completed",
          description: "Your project is now completed. All project documentation and deliverables are available."
        });
      }
      else {
        toast({
          title: "Payment status updated",
          description: "Your payment has been processed successfully."
        });
      }
    }
  });

  const handlePayDeposit = () => {
    if (project && project.paymentStatus === 0) {
      updatePaymentStatusMutation.mutate(50);
    }
  };

  const handlePayFull = () => {
    if (project) {
      updatePaymentStatusMutation.mutate(100);
    }
  };

  const handleSubmitFeedback = () => {
    if (feedbackContent.trim()) {
      submitFeedbackMutation.mutate(feedbackContent);
    } else {
      toast({
        title: "Message required",
        description: "Please type your message before sending.",
        variant: "destructive"
      });
    }
  };

  if (isLoadingProject) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Loading Project...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-6">
            <Loader2Icon className="h-10 w-10 animate-spin text-muted" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!project) return null;

  // Format dates
  const startDate = format(new Date(project.createdAt), "MMMM d, yyyy");
  const estimatedEndDate = new Date(project.createdAt);
  estimatedEndDate.setDate(estimatedEndDate.getDate() + (project.timeline * 7));
  const endDate = format(estimatedEndDate, "MMMM d, yyyy");

  // Status Badge Component
  const StatusBadge = ({ status }: { status: string }) => {
    let bgColor = "";
    let textColor = "";
    let label = "";

    switch (status) {
      case "awaiting_dp":
        bgColor = "bg-yellow-100";
        textColor = "text-yellow-800";
        label = "Awaiting DP";
        break;
      case "in_progress":
        bgColor = "bg-blue-100";
        textColor = "text-blue-800";
        label = "In Progress";
        break;
      case "under_review":
        bgColor = "bg-purple-100";
        textColor = "text-purple-800";
        label = "Under Review";
        break;
      case "completed":
        bgColor = "bg-green-100";
        textColor = "text-green-800";
        label = "Completed";
        break;
      default:
        bgColor = "bg-gray-100";
        textColor = "text-gray-800";
        label = status;
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
      >
        {label}
      </span>
    );
  };

  // Determine milestones based on project status and progress
  const getMilestones = () => {
    // Default milestones
    const milestones = [
      { name: "Project Setup & Design", status: "pending" },
      { name: "Backend Development", status: "pending" },
      { name: "Frontend Implementation", status: "pending" },
      { name: "Testing & Bug Fixes", status: "pending" },
      { name: "Deployment", status: "pending" },
    ];

    if (project.status === "completed") {
      // All milestones are complete
      return milestones.map(m => ({ ...m, status: "completed" }));
    }

    // Progress-based milestone status
    if (project.progress >= 20) milestones[0].status = "completed";
    if (project.progress >= 40) milestones[1].status = "completed";
    if (project.progress >= 60) milestones[2].status = "completed";
    if (project.progress >= 80) milestones[3].status = "completed";
    if (project.progress >= 100) milestones[4].status = "completed";

    // Current milestone is in progress
    for (let i = 0; i < milestones.length; i++) {
      if (milestones[i].status === "pending") {
        milestones[i].status = "in_progress";
        break;
      }
    }

    return milestones;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="mb-4 pb-4 border-b border-border">
            <div className="flex justify-between items-start">
              <DialogTitle className="text-xl font-heading font-bold text-foreground">
                {project.title}
              </DialogTitle>
              <StatusBadge status={project.status} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {project.description}
            </p>
          </div>
        </DialogHeader>

        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="w-full"
        >
          <TabsList className="border-b border-border w-full justify-start rounded-none bg-transparent p-0 mb-4">
            <TabsTrigger 
              value="overview" 
              className="py-4 px-1 border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none data-[state=active]:text-primary data-[state=inactive]:border-transparent"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="development" 
              className="py-4 px-1 border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none data-[state=active]:text-primary data-[state=inactive]:border-transparent"
            >
              Development
            </TabsTrigger>
            <TabsTrigger 
              value="payments" 
              className="py-4 px-1 border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none data-[state=active]:text-primary data-[state=inactive]:border-transparent"
            >
              Payments
            </TabsTrigger>
            <TabsTrigger 
              value="feedback" 
              className="py-4 px-1 border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none data-[state=active]:text-primary data-[state=inactive]:border-transparent"
            >
              Messages
            </TabsTrigger>
            {project.status === "under_review" && (
              <TabsTrigger 
                value="review" 
                className="py-4 px-1 border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none data-[state=active]:text-primary data-[state=inactive]:border-transparent"
              >
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Review
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-0">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Start Date</h4>
                <p className="mt-1 text-sm">{startDate}</p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Expected Completion</h4>
                <p className="mt-1 text-sm">{endDate}</p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Cost</h4>
                <p className="mt-1 text-sm">${project.quote.toLocaleString()}</p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment Status</h4>
                <p className="mt-1 text-sm">
                  {project.paymentStatus}% paid (${(project.quote * project.paymentStatus / 100).toLocaleString()})
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Progress</h4>
              <div className="flex justify-between text-xs mb-1">
                <span>Overall Completion</span>
                <span>{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2 mb-4" />

              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                <a href={`/project/${project.id}`} className="text-primary hover:underline">
                  View Detailed Timeline
                </a>
              </h4>
              <ul className="space-y-3">
                {getMilestones().map((milestone, index) => (
                  <li key={index} className="flex items-center">
                    <div className="flex-shrink-0 h-5 w-5">
                      {milestone.status === "completed" ? (
                        <CheckCircle2 className="text-secondary" size={20} />
                      ) : milestone.status === "in_progress" ? (
                        <Loader2Icon className="text-primary animate-spin" size={20} />
                      ) : (
                        <CircleIcon className="text-muted" size={20} />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${
                        milestone.status === "pending" ? "text-muted-foreground" : "text-foreground"
                      }`}>
                        {milestone.name}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="development" className="space-y-4 mt-0">
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">GitHub Activity</h4>
              <div className="border border-border rounded-lg">
                <div className="p-3 border-b border-border bg-muted flex items-center justify-between">
                  <span className="text-sm font-medium">{project.title.toLowerCase().replace(/\s+/g, '-')}</span>
                  <a href="#" className="text-xs text-primary">View on GitHub</a>
                </div>
                <div className="p-3 text-sm font-mono">
                  {isLoadingActivities ? (
                    <div className="flex justify-center p-4">
                      <Loader2Icon className="h-5 w-5 animate-spin text-muted" />
                    </div>
                  ) : activities && activities.filter(a => a.type === "commit").length > 0 ? (
                    activities
                      .filter(a => a.type === "commit")
                      .slice(0, 3)
                      .map((activity, index) => (
                        <div key={index} className="flex items-start mb-2">
                          <div className="flex-shrink-0 text-green-600 mt-1 mr-2">
                            <GitPullRequest size={16} />
                          </div>
                          <div>
                            <p className="text-xs">{activity.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground p-2">No commit activity yet.</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4 mt-0">
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="bg-muted px-4 py-3 border-b border-border">
                <h3 className="text-sm font-medium">Payment Details</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Total Quote</p>
                    <p className="text-lg font-bold">${project.quote.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Payment Schedule</p>
                    <ul className="mt-1 space-y-1">
                      <li className="text-sm flex justify-between">
                        <span>Deposit (50%)</span>
                        <span>${(project.quote * 0.5).toLocaleString()}</span>
                      </li>
                      <li className="text-sm flex justify-between">
                        <span>Final Payment (50%)</span>
                        <span>${(project.quote * 0.5).toLocaleString()}</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm font-medium mb-2">Current Status</p>
                  <div className="flex items-center">
                    <div className="w-full bg-muted rounded-full h-2 mr-2">
                      <div 
                        className="bg-secondary h-2 rounded-full" 
                        style={{ width: `${project.paymentStatus}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{project.paymentStatus}%</span>
                  </div>
                  
                  <div className="mt-4">
                    {project.paymentStatus === 0 && project.status === "awaiting_dp" && (
                      <Button
                        onClick={handlePayDeposit}
                        disabled={updatePaymentStatusMutation.isPending}
                        className="w-full bg-secondary hover:bg-secondary/90"
                      >
                        {updatePaymentStatusMutation.isPending ? (
                          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Pay Deposit Now (${(project.quote * 0.5).toLocaleString()})
                      </Button>
                    )}
                    {project.paymentStatus === 0 && project.status !== "awaiting_dp" && (
                      <div className="text-sm text-muted-foreground text-center">
                        Payment will be available once project is approved
                      </div>
                    )}
                    {project.paymentStatus === 50 && project.status === "completed" && (
                      <Button
                        onClick={handlePayFull}
                        disabled={updatePaymentStatusMutation.isPending}
                        className="w-full"
                      >
                        {updatePaymentStatusMutation.isPending ? (
                          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Complete Payment
                      </Button>
                    )}
                    {project.paymentStatus === 100 && (
                      <div className="text-sm text-secondary text-center font-medium">
                        Payment Complete
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4 mt-0">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Send Message to Developer Team</h4>
                <Textarea 
                  placeholder="Ask questions or provide feedback about your project..." 
                  className="resize-none"
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  rows={4}
                />
                <Button 
                  className="mt-2"
                  onClick={handleSubmitFeedback}
                  disabled={submitFeedbackMutation.isPending}
                >
                  {submitFeedbackMutation.isPending ? (
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Send Message
                </Button>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Message History</h4>
                {isLoadingFeedbacks ? (
                  <div className="flex justify-center p-4">
                    <Loader2Icon className="h-5 w-5 animate-spin text-muted" />
                  </div>
                ) : feedbacks && feedbacks.length > 0 ? (
                  <ul className="space-y-3 mt-2">
                    {feedbacks.map((feedback, index) => (
                      <li key={index} className="p-3 border border-border rounded-md">
                        <p className="text-sm">{feedback.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(feedback.createdAt), { addSuffix: true })}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No messages yet. Start a conversation with the development team.</p>
                )}
              </div>
            </div>
          </TabsContent>
          
          {project.status === "under_review" && (
            <TabsContent value="review" className="space-y-4 mt-0">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-md mb-4">
                <h3 className="text-lg font-medium text-amber-800 mb-2">Evaluasi Proyek Anda</h3>
                <p className="text-amber-700 mb-4">
                  Proyek Anda telah selesai dan siap untuk dievaluasi. Silakan gunakan form di bawah ini untuk memberikan review Anda.
                </p>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <a href={`/projects/${project.id}`}>
                      <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                        Buka Form Review Lengkap
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="pb-2 border-b mb-4">
                  <h3 className="text-lg font-medium">Form Review Proyek</h3>
                  <p className="text-sm text-muted-foreground">
                    Berikan penilaian Anda terhadap proyek yang telah selesai
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Evaluasi Keseluruhan</h4>
                    <Textarea 
                      placeholder="Berikan tanggapan Anda tentang proyek ini secara keseluruhan..." 
                      className="min-h-[150px]"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <a href={`/projects/${project.id}`}>
                      <Button className="w-full">
                        Lanjutkan ke Form Review Lengkap
                      </Button>
                    </a>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Form review lengkap memiliki opsi tambahan termasuk upload lampiran
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>

        <div className="bg-muted px-4 py-3 sm:flex sm:flex-row-reverse mt-4 -mx-6 -mb-6 border-t border-border">
          {project.status === "awaiting_dp" && project.paymentStatus === 0 && (
            <Button
              className="sm:ml-3 bg-secondary hover:bg-secondary/90"
              onClick={handlePayDeposit}
              disabled={updatePaymentStatusMutation.isPending}
            >
              {updatePaymentStatusMutation.isPending ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Pay Deposit
            </Button>
          )}
          {(project.status !== "awaiting_dp" || project.paymentStatus > 0) && (
            <Button
              className="sm:ml-3"
              onClick={() => {
                setActiveTab("feedback");
                setFeedbackContent("Hi dev team, I have a question about my project: ");
              }}
            >
              Ask Question
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onClose}
            className="mt-3 sm:mt-0 sm:ml-3"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
