import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Project } from "@shared/schema";
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  PlayCircle, 
  XCircle 
} from "lucide-react";

interface ProjectReviewFormProps {
  project: Project;
  onComplete?: () => void;
}

// Define review categories and rating options
const reviewCategories = [
  { id: "functionality", label: "Functionality", description: "Does the application work as expected?" },
  { id: "code_quality", label: "Code Quality", description: "Is the code well-structured, maintainable, and follows best practices?" },
  { id: "performance", label: "Performance", description: "Does the application perform efficiently?" },
  { id: "ui_ux", label: "UI/UX", description: "Is the user interface well-designed and intuitive?" },
  { id: "security", label: "Security", description: "Are security best practices followed?" },
  { id: "documentation", label: "Documentation", description: "Is the code and functionality well-documented?" },
];

const ratingOptions = [
  { value: "excellent", label: "Excellent", icon: <CheckCircle2 className="h-5 w-5 text-green-500" /> },
  { value: "good", label: "Good", icon: <PlayCircle className="h-5 w-5 text-blue-500" /> },
  { value: "fair", label: "Fair", icon: <AlertTriangle className="h-5 w-5 text-amber-500" /> },
  { value: "poor", label: "Poor", icon: <AlertCircle className="h-5 w-5 text-red-500" /> },
  { value: "na", label: "N/A", icon: <XCircle className="h-5 w-5 text-muted-foreground" /> },
];

// Action options after review
const reviewActions = [
  { value: "approve", label: "Approve & Complete Project", description: "Project meets all requirements and is ready for delivery." },
  { value: "request_changes", label: "Request Changes", description: "Project needs specific modifications before approval." },
  { value: "reject", label: "Reject", description: "Project fails to meet critical requirements." },
];

export function ProjectReviewForm({ project, onComplete }: ProjectReviewFormProps) {
  const [activeTab, setActiveTab] = useState("evaluation");
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (data: {
      projectId: number;
      ratings: Record<string, string>;
      feedback: string;
      action: string | null;
    }) => {
      const response = await apiRequest(
        "POST",
        `/api/admin/projects/${data.projectId}/review`,
        {
          ratings: data.ratings,
          feedback: data.feedback,
          action: data.action,
        }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Review submitted",
        description: "Your review has been submitted successfully.",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: [`/api/admin/projects/${project.id}`],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/projects"],
      });
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });
  
  // Handler for rating change
  const handleRatingChange = (categoryId: string, value: string) => {
    setRatings((prev) => ({
      ...prev,
      [categoryId]: value,
    }));
  };
  
  // Calculate completeness of evaluation
  const evaluationCompleteness = () => {
    const ratedCategories = Object.keys(ratings).length;
    return Math.round((ratedCategories / reviewCategories.length) * 100);
  };
  
  // Check if form is ready to submit
  const isFormComplete = () => {
    const hasAllRatings = Object.keys(ratings).length === reviewCategories.length;
    const hasFeedback = feedbackNotes.trim().length > 20;
    const hasAction = selectedAction !== null;
    
    return hasAllRatings && hasFeedback && hasAction;
  };
  
  // Handle form submission
  const handleSubmitReview = () => {
    if (!isFormComplete()) {
      toast({
        title: "Incomplete review",
        description: "Please complete all sections of the review form.",
        variant: "destructive",
      });
      return;
    }
    
    submitReviewMutation.mutate({
      projectId: project.id,
      ratings,
      feedback: feedbackNotes,
      action: selectedAction,
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Review</CardTitle>
        <CardDescription>
          Evaluate the project and provide feedback to the development team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
            <TabsTrigger value="action">Review Action</TabsTrigger>
          </TabsList>
          
          <TabsContent value="evaluation" className="space-y-6 mt-4">
            {/* Progress indicator */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Evaluation progress</span>
                <span>{evaluationCompleteness()}%</span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${evaluationCompleteness()}%` }}
                ></div>
              </div>
            </div>
            
            {/* Evaluation criteria */}
            {reviewCategories.map((category) => (
              <div key={category.id} className="space-y-2">
                <div className="flex justify-between">
                  <Label className="font-medium">{category.label}</Label>
                  <span className="text-sm text-muted-foreground">
                    {ratings[category.id] 
                      ? ratings[category.id].charAt(0).toUpperCase() + ratings[category.id].slice(1) 
                      : "Not rated"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
                
                <RadioGroup 
                  value={ratings[category.id] || ""} 
                  onValueChange={(value) => handleRatingChange(category.id, value)}
                  className="flex space-x-2"
                >
                  {ratingOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-1">
                      <RadioGroupItem 
                        value={option.value} 
                        id={`${category.id}-${option.value}`} 
                        className="sr-only"
                      />
                      <Label 
                        htmlFor={`${category.id}-${option.value}`}
                        className={`flex flex-col items-center p-2 rounded-md cursor-pointer ${
                          ratings[category.id] === option.value 
                            ? 'bg-primary/10 border border-primary' 
                            : 'bg-muted/40 hover:bg-muted/60 border border-transparent'
                        }`}
                      >
                        {option.icon}
                        <span className="text-xs mt-1">{option.label}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                
                <Separator className="my-4" />
              </div>
            ))}
            
            {/* Feedback notes */}
            <div className="space-y-2">
              <Label htmlFor="feedback">Detailed Feedback</Label>
              <Textarea
                id="feedback"
                placeholder="Provide detailed feedback about the project, including specific issues, strengths, and suggestions for improvement..."
                rows={6}
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
              />
              <p className="text-xs text-muted-foreground flex justify-between">
                <span>Be specific and constructive in your feedback.</span>
                <span className={feedbackNotes.length < 20 ? "text-red-500" : ""}>
                  {feedbackNotes.length} characters
                </span>
              </p>
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={() => setActiveTab("action")}
                disabled={evaluationCompleteness() < 100 || feedbackNotes.length < 20}
              >
                Continue to Review Action
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="action" className="space-y-6 mt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Select Review Action</h3>
              
              <RadioGroup 
                value={selectedAction || ""} 
                onValueChange={setSelectedAction}
                className="space-y-4"
              >
                {reviewActions.map((action) => (
                  <div key={action.value} className="flex items-start space-x-2">
                    <RadioGroupItem value={action.value} id={action.value} />
                    <div className="grid gap-1">
                      <Label htmlFor={action.value} className="font-medium">
                        {action.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
              
              <Separator />
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("evaluation")}
                >
                  Back to Evaluation
                </Button>
                
                <Button
                  onClick={handleSubmitReview}
                  disabled={submitReviewMutation.isPending || !selectedAction}
                >
                  {submitReviewMutation.isPending ? (
                    "Submitting..."
                  ) : (
                    "Submit Review"
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}