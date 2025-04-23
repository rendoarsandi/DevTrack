import { useState, useRef, ChangeEvent } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Project } from "@shared/schema";
import { 
  Loader2, 
  Upload, 
  X, 
  Image, 
  FileText as FileTextIcon, 
  File as FileIcon, 
  CheckCircle, 
  XCircle, 
  AlertCircle 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";

interface ReviewFormProps {
  project: Project;
  onComplete?: () => void;
}

type ReviewAction = "approve" | "request_changes" | "reject";

interface UploadedFile {
  name: string;
  filename: string;
  type: string;
  size: number;
  url: string;
}

export function EnhancedReviewForm({ project, onComplete }: ReviewFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"review" | "uploads" | "action">("review");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ReviewAction | "">("");
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [detailedFeedback, setDetailedFeedback] = useState("");
  const [reviewAction, setReviewAction] = useState<ReviewAction | "">("");
  
  // Handle file upload click
  const handleFileUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle file selection
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingFiles(true);
    
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('File upload failed');
      }
      
      const data = await response.json();
      setUploadedFiles(prev => [...prev, ...data]);
      
      toast({
        title: "Files uploaded",
        description: `${files.length} file(s) uploaded successfully.`,
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive"
      });
    } finally {
      setUploadingFiles(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Remove a file from the list
  const handleRemoveFile = (filename: string) => {
    setUploadedFiles(prev => prev.filter(file => file.filename !== filename));
  };
  
  // Show file type icon
  const renderFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-600" />;
    } else if (type.includes('pdf')) {
      return <FileTextIcon className="h-5 w-5 text-red-600" />;
    } else {
      return <FileIcon className="h-5 w-5 text-gray-600" />;
    }
  };
  
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  // Handle review submission
  const handleSubmitReview = async () => {
    if (!reviewAction) {
      toast({
        title: "Review action required",
        description: "Please select an action (approve, request changes, or reject) before submitting",
        variant: "destructive"
      });
      return;
    }
    
    if (reviewAction === "reject" && !detailedFeedback.trim()) {
      toast({
        title: "Feedback required",
        description: "Please provide a reason for rejecting the project",
        variant: "destructive"
      });
      return;
    }
    
    // If it's a rejection, show confirmation dialog
    if (reviewAction === "reject") {
      setConfirmAction(reviewAction);
      setShowConfirmation(true);
      return;
    }
    
    // Otherwise proceed with the submission
    submitReviewToServer(reviewAction);
  };
  
  // Submit the review to the server
  const submitReviewToServer = async (action: ReviewAction) => {
    setIsSubmitting(true);
    
    try {
      const reviewData = {
        projectId: project.id,
        action: action,
        feedback: detailedFeedback,
        attachments: uploadedFiles.map(file => file.filename)
      };
      
      // Submit review and update project status based on action
      await apiRequest("POST", `/api/projects/${project.id}/review`, reviewData);
      
      // Update project status based on the action
      const newStatus = 
        action === "approve" ? "completed" : 
        action === "request_changes" ? "in_progress" : 
        "rejected";
      
      await apiRequest("PATCH", `/api/projects/${project.id}`, {
        status: newStatus
      });
      
      // Create an activity entry for this review
      await apiRequest("POST", `/api/projects/${project.id}/activities`, {
        type: "review",
        content: `Project ${
          action === "approve" ? "approved and completed" : 
          action === "request_changes" ? "sent back for changes" : 
          "rejected"
        }. ${detailedFeedback ? 'Feedback: ' + detailedFeedback.substring(0, 50) + (detailedFeedback.length > 50 ? '...' : '') : ''}`
      });
      
      toast({
        title: "Review submitted",
        description: "Your review has been submitted successfully"
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${project.id}`],
      });
      
      if (onComplete) {
        onComplete();
      }
    } catch (error: any) {
      toast({
        title: "Error submitting review",
        description: error.message || "An error occurred while submitting your review",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false);
    }
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Review Project</CardTitle>
          <CardDescription className="text-foreground/70">
            Evaluate the completed project and provide your feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as "review" | "uploads" | "action")}>
            <TabsList className="w-full grid grid-cols-1 sm:grid-cols-3 gap-1">
              <TabsTrigger value="review" className="flex items-center gap-1">
                <FileTextIcon className="h-4 w-4" />
                Review
              </TabsTrigger>
              <TabsTrigger value="uploads" className="flex items-center gap-1">
                <Upload className="h-4 w-4" />
                Attachments
              </TabsTrigger>
              <TabsTrigger value="action" className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Decision
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="review" className="space-y-6 pt-4">
              <div className="space-y-4">
                <h3 className="font-medium">Project Feedback</h3>
                <Textarea 
                  placeholder="Provide detailed feedback about the project. What works well? What needs improvement? Any concerns?"
                  className="min-h-[150px]"
                  value={detailedFeedback}
                  onChange={(e) => setDetailedFeedback(e.target.value)}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="uploads" className="space-y-6 pt-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Upload Documents</h3>
                  <span className="text-xs text-muted-foreground">Max 5MB per file</span>
                </div>
                
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    multiple 
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleFileUploadClick}
                    disabled={uploadingFiles}
                    className="w-full"
                  >
                    {uploadingFiles ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Files
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Drag and drop files here or click to browse
                  </p>
                </div>
                
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Uploaded Files</h4>
                    <ul className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <li key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                          <div className="flex items-center gap-2">
                            {renderFileIcon(file.type)}
                            <span className="text-sm truncate max-w-[150px]">{file.name}</span>
                            <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleRemoveFile(file.filename)}
                            className="h-7 w-7"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="action" className="space-y-6 pt-4">
              <div className="space-y-4">
                <h3 className="font-medium">Your Decision</h3>
                <p className="text-sm text-muted-foreground">
                  Choose one of the following actions to proceed with this project review.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div 
                    className={`border border-border rounded-lg p-4 cursor-pointer hover:bg-muted transition-colors ${reviewAction === 'approve' ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setReviewAction('approve')}
                  >
                    <div className="flex flex-col items-center justify-center text-center h-full">
                      <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2">
                        <CheckCircle className="h-6 w-6" />
                      </div>
                      <h4 className="font-medium">Approve</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Accept the project as completed and make final payment
                      </p>
                    </div>
                  </div>
                  
                  <div 
                    className={`border border-border rounded-lg p-4 cursor-pointer hover:bg-muted transition-colors ${reviewAction === 'request_changes' ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setReviewAction('request_changes')}
                  >
                    <div className="flex flex-col items-center justify-center text-center h-full">
                      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-2">
                        <AlertCircle className="h-6 w-6" />
                      </div>
                      <h4 className="font-medium">Request Changes</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Send back for revisions with your feedback
                      </p>
                    </div>
                  </div>
                  
                  <div 
                    className={`border border-border rounded-lg p-4 cursor-pointer hover:bg-muted transition-colors ${reviewAction === 'reject' ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setReviewAction('reject')}
                  >
                    <div className="flex flex-col items-center justify-center text-center h-full">
                      <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2">
                        <XCircle className="h-6 w-6" />
                      </div>
                      <h4 className="font-medium">Reject</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Reject the project completely (requires explanation)
                      </p>
                    </div>
                  </div>
                </div>
                
                {reviewAction === 'reject' && (
                  <div className="pt-2">
                    <p className="text-sm text-destructive mb-2">
                      Please provide a detailed reason for rejection in the Review tab.
                    </p>
                    {!detailedFeedback && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setActiveTab('review')}
                      >
                        Add Review Comments
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex-1">
            {activeTab === "review" && (
              <Button 
                className="w-full" 
                onClick={() => setActiveTab('uploads')}
              >
                Next: Attachments
              </Button>
            )}
            {activeTab === "uploads" && (
              <Button 
                className="w-full" 
                onClick={() => setActiveTab('action')}
              >
                Next: Decision
              </Button>
            )}
            {activeTab === "action" && (
              <Button 
                className="w-full" 
                onClick={handleSubmitReview}
                disabled={isSubmitting || !reviewAction}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Submit Review'
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
      
      {/* Confirmation Dialog for Rejection */}
      <AlertDialog open={showConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Project Rejection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this project? This action cannot be undone and will terminate the development process.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmation(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => submitReviewToServer('reject')}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Confirm Rejection'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}