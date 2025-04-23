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
  ClipboardCheck,
  File,
  MessageSquare,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Project, Activity, Feedback } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveChat } from "./LiveChat";

interface ProjectDetailModalProps {
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: string;
}

export function ProjectDetailModal({ projectId, isOpen, onClose, defaultTab = "overview" }: ProjectDetailModalProps) {
  // Cek jika perlu menampilkan tab review berdasarkan localStorage
  const initialTab = (() => {
    if (typeof window !== 'undefined') {
      const openReviewTab = localStorage.getItem('open_review_tab');
      if (openReviewTab === 'true') {
        localStorage.removeItem('open_review_tab'); // Reset state
        return "review";
      }
    }
    return defaultTab;
  })();
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [feedbackContent, setFeedbackContent] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    name: string;
    filename: string;
    type: string;
    size: number;
    url: string;
  }>>([]);
  const [isUploading, setIsUploading] = useState(false);
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
      // Jika ini adalah full payment (100%), otomatis ubah status ke awaiting_handover
      else if (data.paymentStatus === 100) {
        // Update status proyek
        apiRequest("PATCH", `/api/projects/${projectId}`, {
          status: "awaiting_handover",
          progress: 95
        });
        
        toast({
          title: "Final payment completed",
          description: "Pembayaran akhir telah diterima. Tim developer akan segera mengirimkan dokumen dan kode proyek Anda."
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

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      
      // Append all selected files
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      
      console.log("Uploading files...");
      
      // Send files to the server
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type here, it will be set automatically with boundary
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to upload files');
      }
      
      // Get uploaded file data
      const uploadedData = await response.json();
      console.log("Files uploaded successfully:", uploadedData);
      
      // Buat URL absolut untuk setiap file
      const absoluteUrlData = uploadedData.map((file: { url: string; name: string; type: string; size: number }) => {
        // Pastikan URL dimulai dengan / jika belum
        const url = file.url.startsWith('/') ? file.url : `/${file.url}`;
        return {
          ...file,
          // Gunakan origin dari current window jika tersedia
          url: typeof window !== 'undefined' 
            ? `${window.location.origin}${url}`
            : url
        };
      });
      
      console.log("Absolute URLs created:", absoluteUrlData);
      
      // Simpan file dengan URL absolut
      setUploadedFiles(prev => [...prev, ...absoluteUrlData]);
      
      // Success message
      toast({
        title: "Files uploaded",
        description: `${uploadedData.length} file(s) uploaded successfully.`
      });
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Remove uploaded file
  const handleRemoveFile = (fileUrl: string) => {
    const filename = fileUrl.split('/').pop();
    if (!filename) return;
    
    // Remove from state immediately for responsive UI
    setUploadedFiles(prev => prev.filter(file => file.url !== fileUrl));
    
    // Send delete request to server
    fetch(`/api/files/${filename}`, {
      method: 'DELETE'
    }).catch(err => {
      console.error('Error deleting file:', err);
      toast({
        title: "Error removing file",
        description: "The file could not be removed from the server.",
        variant: "destructive"
      });
    });
  };

  const handleSubmitFeedback = () => {
    if (feedbackContent.trim()) {
      // Add attachments info if any
      let content = feedbackContent.trim();
      
      if (uploadedFiles.length > 0) {
        // Gunakan format JSON untuk menyimpan informasi attachment
        const attachmentsData = {
          attachments: uploadedFiles.map(file => ({
            name: file.name,
            url: file.url,
            type: file.type
          }))
        };
        
        // Encode sebagai JSON string
        const attachmentsJSON = JSON.stringify(attachmentsData);
        
        // Tambahkan ke pesan dengan tag pembatas
        content = `${content}\n\n---ATTACHMENTS_DATA---\n${attachmentsJSON}\n---END_ATTACHMENTS_DATA---`;
        
        console.log("Sending message with attachments:", content);
      }
      
      submitFeedbackMutation.mutate(content);
      
      // Reset form
      setFeedbackContent("");
      setUploadedFiles([]);
    } else {
      toast({
        title: "Message required",
        description: "Please type your message before sending.",
        variant: "destructive"
      });
    }
  };

  // Function to handle project acceptance using dedicated endpoint
  const handleAcceptProject = async () => {
    try {
      // Prepare message
      let message = feedbackContent.trim() 
        ? feedbackContent
        : "Project accepted. Thank you for your excellent work!";
      
      // Add attachments info if any
      if (uploadedFiles.length > 0) {
        // Gunakan format JSON untuk menyimpan informasi attachment
        const attachmentsData = {
          attachments: uploadedFiles.map(file => ({
            name: file.name,
            url: file.url,
            type: file.type
          }))
        };
        
        // Encode sebagai JSON string
        const attachmentsJSON = JSON.stringify(attachmentsData);
        
        // Tambahkan ke pesan dengan tag pembatas
        message = `${message.trim()}\n\n---ATTACHMENTS_DATA---\n${attachmentsJSON}\n---END_ATTACHMENTS_DATA---`;
        
        console.log("Sending accept message with attachments:", uploadedFiles.length);
      }
        
      // Use new dedicated endpoint for accepting project
      const response = await apiRequest("POST", `/api/projects/${projectId}/accept`, {
        message: message
      });
      
      // Check if request was successful
      if (!response.ok) {
        const responseData = await response.json().catch(() => ({}));
        const errorMessage = responseData.message || `Failed with status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      // Refresh all relevant data
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/activities`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/feedback`] });
      queryClient.invalidateQueries({ queryKey: [`/api/activities`] });
      
      // Show success message
      toast({
        title: "Project accepted!",
        description: "The project has been accepted and completed successfully!"
      });
      
      // Reset state
      setUploadedFiles([]);
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error("Error accepting project:", error);
      toast({
        title: "Error accepting project",
        description: error instanceof Error ? error.message : "An error occurred while accepting the project",
        variant: "destructive"
      });
    }
  };

  // Function to handle project change requests using dedicated endpoint
  const handleRequestChanges = async () => {
    // Validate feedback content
    if (!feedbackContent.trim()) {
      toast({
        title: "Comment required",
        description: "Please provide a reason for requesting changes",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Prepare message with attachments
      let message = feedbackContent.trim();
      
      // Add attachments info if any
      if (uploadedFiles.length > 0) {
        // Gunakan format JSON untuk menyimpan informasi attachment
        const attachmentsData = {
          attachments: uploadedFiles.map(file => ({
            name: file.name,
            url: file.url,
            type: file.type
          }))
        };
        
        // Encode sebagai JSON string
        const attachmentsJSON = JSON.stringify(attachmentsData);
        
        // Tambahkan ke pesan dengan tag pembatas
        message = `${message.trim()}\n\n---ATTACHMENTS_DATA---\n${attachmentsJSON}\n---END_ATTACHMENTS_DATA---`;
        
        console.log("Sending request changes with attachments:", uploadedFiles.length);
      }
      
      // Use new dedicated endpoint for requesting changes
      const response = await apiRequest("POST", `/api/projects/${projectId}/request-changes`, {
        message: message
      });
      
      // Check if request was successful
      if (!response.ok) {
        const responseData = await response.json().catch(() => ({}));
        const errorMessage = responseData.message || `Failed with status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      // Refresh all relevant data
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/activities`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/feedback`] });
      queryClient.invalidateQueries({ queryKey: [`/api/activities`] });
      
      // Show success message
      toast({
        title: "Changes requested",
        description: "The development team will revise the project based on your feedback"
      });
      
      // Reset state
      setUploadedFiles([]);
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error("Error requesting changes:", error);
      toast({
        title: "Error requesting changes",
        description: error instanceof Error ? error.message : "An error occurred while requesting changes",
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
      case "approved":
        bgColor = "bg-indigo-100";
        textColor = "text-indigo-800";
        label = "Approved";
        break;
      case "awaiting_handover":
        bgColor = "bg-orange-100";
        textColor = "text-orange-800";
        label = "Awaiting Handover";
        break;
      case "completed":
        bgColor = "bg-green-100";
        textColor = "text-green-800";
        label = "Completed";
        break;
      case "rejected":
        bgColor = "bg-red-100";
        textColor = "text-red-800";
        label = "Rejected";
        break;
      default:
        bgColor = "bg-gray-100";
        textColor = "text-gray-800";
        label = status.replace("_", " ").split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
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
              <FileIcon className="mr-2 h-4 w-4" />
              Send Media & Files
            </TabsTrigger>
            <TabsTrigger 
              value="chat" 
              className="py-4 px-1 border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none data-[state=active]:text-primary data-[state=inactive]:border-transparent"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Live Chat
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
            {project.status === "completed" && (
              <TabsTrigger 
                value="deliverables" 
                className="py-4 px-1 border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none data-[state=active]:text-primary data-[state=inactive]:border-transparent"
              >
                <FileIcon className="mr-2 h-4 w-4" />
                Deliverables
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
              <div className="border border-border rounded-md p-4 text-center">
                <p className="text-sm text-muted-foreground">GitHub integration coming soon</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4 mt-0">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Payment Summary</CardTitle>
                  <CardDescription>Payment status for your project</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Quote</h4>
                        <p className="mt-1 text-lg font-bold">${project.quote.toLocaleString()}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Paid Amount</h4>
                        <p className="mt-1 text-lg font-bold">${(project.quote * project.paymentStatus / 100).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Down Payment (50%)</span>
                        <span className="text-sm">
                          {project.paymentStatus >= 50 ? (
                            <span className="text-secondary flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" /> Paid
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Unpaid</span>
                          )}
                        </span>
                      </div>
                      <Progress value={project.paymentStatus >= 50 ? 100 : 0} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Final Payment (50%)</span>
                        <span className="text-sm">
                          {project.paymentStatus >= 100 ? (
                            <span className="text-secondary flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" /> Paid
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Unpaid</span>
                          )}
                        </span>
                      </div>
                      <Progress value={project.paymentStatus >= 100 ? 100 : 0} className="h-2" />
                    </div>
                    
                    {project.status === "awaiting_dp" && project.paymentStatus === 0 && (
                      <Button
                        onClick={handlePayDeposit}
                        disabled={updatePaymentStatusMutation.isPending}
                        className="w-full"
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
                        Pay Final Payment (${(project.quote * 0.5).toLocaleString()})
                      </Button>
                    )}
                    {project.paymentStatus === 50 && project.status === "approved" && (
                      <Button
                        onClick={handlePayFull}
                        disabled={updatePaymentStatusMutation.isPending}
                        className="w-full"
                      >
                        {updatePaymentStatusMutation.isPending ? (
                          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Pay Final Payment (${(project.quote * 0.5).toLocaleString()})
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="mt-0">
            <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md mb-4">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">Live Chat</h3>
              <p className="text-xs text-green-700 dark:text-green-400">
                Real-time text chat for quick discussions with the development team. Perfect for asking questions 
                and getting immediate responses. For file sharing, please use the Send Media & Files tab.
              </p>
            </div>
            {/* Conditionally render LiveChat only when project data is available */}
            {project && <LiveChat projectId={projectId} />}
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4 mt-0">
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md mb-4">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Send Media & Files</h3>
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  This feature allows you to send messages with files, images, and other media attachments. 
                  Perfect for sharing documents and formal communications that need to be preserved.
                </p>
              </div>
              <Textarea 
                placeholder="Type your message here..."
                className="min-h-[100px]"
                value={feedbackContent}
                onChange={(e) => setFeedbackContent(e.target.value)}
              />
              
              {/* File upload area */}
              <div className="border border-dashed border-border rounded-md p-3 bg-muted/30">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium">Attachments</h4>
                  <div className="relative">
                    <input 
                      type="file" 
                      className="hidden" 
                      id="file-upload-message" 
                      multiple
                      onChange={handleFileUpload}
                      accept="image/*,application/pdf"
                    />
                    <label 
                      htmlFor="file-upload-message" 
                      className="inline-flex items-center px-2 py-1 border border-border rounded-md bg-muted/50 hover:bg-muted cursor-pointer text-xs"
                    >
                      {isUploading ? (
                        <Loader2Icon className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <FileIcon className="h-3 w-3 mr-1" />
                      )}
                      {isUploading ? "Uploading..." : "Add Files"}
                    </label>
                  </div>
                </div>
                
                {/* Display uploaded files */}
                {uploadedFiles.length > 0 ? (
                  <ul className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <li key={index} className="flex items-center justify-between bg-muted/50 rounded-md p-2">
                        <div className="flex items-center overflow-hidden">
                          <FileIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveFile(file.url)}
                          className="text-red-500 hover:text-red-700 flex-shrink-0 ml-2"
                          aria-label="Remove file"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No files attached. You can add screenshots or documents to your message.
                  </p>
                )}
              </div>
              
              <Button 
                onClick={handleSubmitFeedback}
                disabled={submitFeedbackMutation.isPending}
                className="w-full"
              >
                {submitFeedbackMutation.isPending ? (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Send Message
              </Button>

              <div className="mt-4">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Messages History
                </h4>
                {isLoadingFeedbacks ? (
                  <div className="text-center py-8">
                    <Loader2Icon className="h-8 w-8 animate-spin mx-auto text-muted" />
                    <p className="mt-2 text-sm text-muted-foreground">Loading messages...</p>
                  </div>
                ) : feedbacks && feedbacks.length > 0 ? (
                  <ul className="space-y-3 mt-2">
                    {feedbacks.map((feedback, index) => {
                      // Periksa apakah pesan berisi tautan lampiran (baik format lama atau baru)
                      const hasAttachments = feedback.content.includes('[Attachment:') || feedback.content.includes('---ATTACHMENTS_DATA---');
                      
                      // Pisahkan konten pesan utama dan lampiran
                      let mainContent = feedback.content;
                      const attachments: Array<{name: string, url: string, type?: string}> = [];
                      
                      // Penanganan lampiran dengan 2 metode berbeda
                      try {
                        console.log("Parsing pesan:", feedback.content);
                        
                        // Metode 1: Cek apakah ada tag JSON dengan format baru
                        const jsonPattern = /---ATTACHMENTS_DATA---\n([\s\S]*?)\n---END_ATTACHMENTS_DATA---/;
                        const jsonDataMatch = feedback.content.match(jsonPattern);
                        
                        if (jsonDataMatch && jsonDataMatch[1]) {
                          console.log("Menemukan format JSON");
                          
                          // Parse data JSON lampiran
                          try {
                            const jsonData = JSON.parse(jsonDataMatch[1]);
                            
                            if (jsonData.attachments && Array.isArray(jsonData.attachments)) {
                              // Gunakan data lampiran dari JSON
                              attachments.push(...jsonData.attachments);
                              
                              // Bersihkan pesan utama (hapus bagian attachment saja)
                              const attachmentRegex = /\n\n---ATTACHMENTS_DATA---\n[\s\S]*?\n---END_ATTACHMENTS_DATA---/;
                              mainContent = feedback.content.replace(attachmentRegex, '');
                              
                              console.log("Hasil ekstraksi pesan:", mainContent);
                              console.log("Jumlah lampiran:", attachments.length);
                            }
                          } catch (jsonErr) {
                            console.error("Error parsing JSON attachments:", jsonErr);
                          }
                        } 
                        // Metode 2: Format lama dengan markdown
                        else if (hasAttachments) {
                          console.log("Menggunakan format lama");
                          
                          // Ekstrak lampiran dengan format markdown
                          const regex = /\[Attachment: ([^\]]+)\]\(([^)]+)\)/g;
                          const text = feedback.content;
                          
                          // Cari posisi kemunculan pertama dari attachment
                          const attachmentPos = text.indexOf('\n\n[Attachment:');
                          if (attachmentPos !== -1) {
                            // Ambil hanya bagian sebelum attachment
                            mainContent = text.substring(0, attachmentPos);
                          }
                          
                          // Ekstrak semua attachment
                          let match;
                          while ((match = regex.exec(text)) !== null) {
                            if (match[1] && match[2]) {
                              attachments.push({
                                name: match[1],
                                url: match[2]
                              });
                            }
                          }
                          
                          console.log("Hasil ekstraksi pesan (format lama):", mainContent);
                          console.log("Jumlah lampiran (format lama):", attachments.length);
                        }
                      } catch (error) {
                        console.error("Error parsing attachments:", error);
                      }
                      
                      return (
                        <li key={index} className="p-3 border border-border rounded-md">
                          <p className="text-sm whitespace-pre-wrap">{mainContent}</p>
                          
                          {/* Tampilkan lampiran jika ada */}
                          {attachments.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-border">
                              <p className="text-xs font-medium mb-2">Attachments ({attachments.length}):</p>
                              <div className="flex flex-col space-y-3">
                                {attachments.map((attachment, i) => {
                                  const isImage = attachment.url && 
                                    (attachment.type?.includes('image/') || 
                                     (attachment.name && attachment.name.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/)));
                                  
                                  // URL yang benar-benar akan digunakan
                                  const attachmentUrl = attachment.url || '#';
                                  const displayName = (() => {
                                    if (!attachment.name) return 'Attachment';
                                    try { return decodeURIComponent(attachment.name); }
                                    catch { return attachment.name; }
                                  })();
                                  
                                  return (
                                    <div key={i} className="border rounded-md overflow-hidden">
                                      {isImage && (
                                        <div className="w-full aspect-video bg-muted relative flex items-center justify-center">
                                          <img 
                                            src={attachmentUrl}
                                            alt={displayName}
                                            className="max-h-full max-w-full object-contain"
                                            style={{maxHeight: "200px"}}
                                            onError={() => {
                                              console.error("Failed to load image:", attachmentUrl);
                                            }}
                                          />
                                        </div>
                                      )}
                                      <div className="p-2 flex justify-between items-center bg-muted/30">
                                        <div className="flex items-center">
                                          <FileIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                                          <span className="text-sm truncate">{displayName}</span>
                                        </div>
                                        <a 
                                          href={attachmentUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="ml-2 p-1 rounded-full hover:bg-muted"
                                          title="Open in new tab"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                            <polyline points="15 3 21 3 21 9"></polyline>
                                            <line x1="10" y1="14" x2="21" y2="3"></line>
                                          </svg>
                                        </a>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(feedback.createdAt), { addSuffix: true })}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No messages yet. Start a conversation with the development team.</p>
                )}
              </div>
            </div>
          </TabsContent>
          
          {project.status === "under_review" && (
            <TabsContent value="review" className="space-y-4 mt-0">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-md mb-4">
                <h3 className="text-lg font-medium text-purple-800 mb-2">Review Your Project</h3>
                <p className="text-purple-700 mb-4">
                  Your project is ready for review. Please provide your evaluation and decision below.
                </p>
              </div>
              
              <div className="p-4 border rounded-lg space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Your Feedback</h3>
                  <Textarea 
                    placeholder="Provide your comments about this project (required for change requests)..."
                    className="min-h-[100px]"
                    value={feedbackContent}
                    onChange={(e) => setFeedbackContent(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Upload Media (Optional)</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload screenshots or other files as testing evidence
                  </p>
                  <div className="border border-dashed border-border rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                    <input 
                      type="file" 
                      className="hidden" 
                      id="file-upload-review" 
                      multiple
                      onChange={handleFileUpload}
                      accept="image/*,application/pdf"
                    />
                    <label htmlFor="file-upload-review" className="cursor-pointer block">
                      <span className="block mb-1">
                        {isUploading ? (
                          <Loader2Icon className="h-6 w-6 mx-auto text-muted-foreground animate-spin" />
                        ) : (
                          <FileIcon className="h-6 w-6 mx-auto text-muted-foreground" />
                        )}
                      </span>
                      <span className="text-sm font-medium">
                        {isUploading ? "Uploading..." : "Click to select files"}
                      </span>
                      <span className="text-xs text-muted-foreground block mt-1">
                        Supports JPG, PNG, PDF up to 5MB
                      </span>
                    </label>
                  </div>
                  
                  {/* Display uploaded files */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Uploaded Files:</h4>
                      <ul className="space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <li key={index} className="flex items-center justify-between bg-muted/50 rounded-md p-2">
                            <div className="flex items-center">
                              {file.name.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/) ? (
                                <img 
                                  src={file.url} 
                                  alt={(() => {
                                    try {
                                      return decodeURIComponent(file.name)
                                    } catch (e) {
                                      return file.name
                                    }
                                  })()} 
                                  className="h-7 w-7 object-cover rounded mr-2 flex-shrink-0" 
                                  onError={(e) => {
                                    // Menyembunyikan gambar jika error
                                    e.currentTarget.style.display = 'none';
                                    // Menggunakan getElementById sebagai fallback untuk fileIcon
                                    const fileIconElement = document.getElementById(`file-icon-${index}`);
                                    if (fileIconElement) {
                                      fileIconElement.style.display = 'block';
                                    }
                                  }}
                                />
                              ) : null}
                              <FileIcon id={`file-icon-${index}`} className="h-4 w-4 mr-2 flex-shrink-0" style={{display: file.name.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/) ? 'none' : 'block'}} />
                              <span className="text-sm truncate max-w-[180px]">
                                {(() => {
                                  try {
                                    return decodeURIComponent(file.name)
                                  } catch (e) {
                                    console.error("Error decoding uploaded filename:", e);
                                    return file.name
                                  }
                                })()}
                              </span>
                            </div>
                            <button
                              onClick={() => handleRemoveFile(file.url)}
                              className="text-red-500 hover:text-red-700"
                              aria-label="Remove file"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 border rounded-lg bg-red-50 hover:bg-red-100 transition-colors">
                    <h4 className="font-semibold mb-2 flex items-center text-red-700">
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Request Changes
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      If the project doesn't meet your requirements, request changes with specific feedback.
                    </p>
                    <Button 
                      variant="destructive"
                      className="w-full"
                      onClick={handleRequestChanges}
                      disabled={submitFeedbackMutation.isPending}
                    >
                      Request Changes
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                    <h4 className="font-semibold mb-2 flex items-center text-green-700">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Accept Project
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      The project meets all requirements and is ready to be completed.
                    </p>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={handleAcceptProject}
                      disabled={submitFeedbackMutation.isPending}
                    >
                      Accept Project
                    </Button>
                  </div>
                </div>
                
                {submitFeedbackMutation.isPending && (
                  <div className="flex items-center justify-center py-2">
                    <Loader2Icon className="animate-spin h-6 w-6 text-primary mr-2" />
                    <span>Processing your review...</span>
                  </div>
                )}
              </div>
            </TabsContent>
          )}
          
          {/* Deliverables tab - hanya ditampilkan untuk proyek yang sudah selesai */}
          {project.status === "completed" && (
            <TabsContent value="deliverables" className="space-y-4 mt-0">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-4">
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-green-800 mb-2">Project Completed</h3>
                    <p className="text-green-700 mb-2">
                      Congratulations! Your project is complete and all documents and code have been delivered.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Project Handover Details */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-3 border-b border-border flex items-center">
                    <FileIcon className="h-4 w-4 mr-2 text-primary" />
                    <h3 className="text-sm font-medium">Documentation & Code</h3>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {/* Find handover message in feedback */}
                    {feedbacks && feedbacks.filter(f => f.content.startsWith("PROJECT HANDOVER:")).length > 0 ? (
                      <>
                        <div className="whitespace-pre-wrap p-4 bg-muted/50 rounded-md text-sm">
                          {feedbacks
                            .filter(f => f.content.startsWith("PROJECT HANDOVER:"))
                            .slice(-1)[0]
                            .content
                            .replace("PROJECT HANDOVER:", "")
                            .trim()}
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Documents & Files</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {/* Repository */}
                            <a 
                              href="#" 
                              className="flex items-center p-3 border rounded-md hover:bg-muted/50 transition-colors"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <div className="p-2 rounded-full bg-blue-100 text-blue-700 mr-3">
                                <GitPullRequest className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">Code Repository</p>
                                <p className="text-xs text-muted-foreground">GitHub Repository</p>
                              </div>
                            </a>
                            
                            {/* Documentation */}
                            <a 
                              href="#" 
                              className="flex items-center p-3 border rounded-md hover:bg-muted/50 transition-colors"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <div className="p-2 rounded-full bg-purple-100 text-purple-700 mr-3">
                                <FileIcon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">Technical Documentation</p>
                                <p className="text-xs text-muted-foreground">PDF Documentation</p>
                              </div>
                            </a>
                            
                            {/* User Manual */}
                            <a 
                              href="#" 
                              className="flex items-center p-3 border rounded-md hover:bg-muted/50 transition-colors"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <div className="p-2 rounded-full bg-green-100 text-green-700 mr-3">
                                <FileIcon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">User Manual</p>
                                <p className="text-xs text-muted-foreground">PDF User Guide</p>
                              </div>
                            </a>
                            
                            {/* Source Code */}
                            <a 
                              href="#" 
                              className="flex items-center p-3 border rounded-md hover:bg-muted/50 transition-colors"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <div className="p-2 rounded-full bg-yellow-100 text-yellow-700 mr-3">
                                <FileIcon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">Source Code</p>
                                <p className="text-xs text-muted-foreground">ZIP Archive</p>
                              </div>
                            </a>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileIcon className="h-12 w-12 mx-auto mb-3 text-muted" />
                        <p>No handover documents found.</p>
                        <p className="text-sm">Please contact the development team for more information.</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-3 border-b border-border">
                    <h3 className="text-sm font-medium">Support & Help</h3>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      If you need additional assistance or have questions about the completed project, 
                      please contact us through the message form in the Messages tab.
                    </p>
                    <Button
                      onClick={() => setActiveTab("feedback")}
                      className="w-full"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Send Support Message
                    </Button>
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
          
          {project.status === "approved" && project.paymentStatus === 50 && (
            <Button
              className="sm:ml-3 bg-secondary hover:bg-secondary/90"
              onClick={handlePayFull}
              disabled={updatePaymentStatusMutation.isPending}
            >
              {updatePaymentStatusMutation.isPending ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Pay Final Payment
            </Button>
          )}
          
          {project.status === "under_review" && (
            <Button
              className="sm:ml-3 bg-primary"
              onClick={() => {
                setActiveTab("review");
              }}
            >
              Submit Review
            </Button>
          )}
          
          {(project.status !== "awaiting_dp" && project.status !== "under_review" && project.status !== "approved") && (
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