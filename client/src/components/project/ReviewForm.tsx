import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Project } from "@shared/schema";
import { Loader2Icon } from "lucide-react";

interface ReviewFormProps {
  project: Project;
  onComplete?: () => void;
}

type ReviewRating = "excellent" | "good" | "fair" | "poor" | "na";
type ReviewCriteria = {
  functionality: ReviewRating;
  codeQuality: ReviewRating;
  performance: ReviewRating;
  uiux: ReviewRating;
  security: ReviewRating;
  documentation: ReviewRating;
};

type ReviewAction = "approve" | "request_changes" | "reject";

export function ReviewForm({ project, onComplete }: ReviewFormProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"evaluation" | "action">("evaluation");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewRatings, setReviewRatings] = useState<ReviewCriteria>({
    functionality: "na",
    codeQuality: "na",
    performance: "na",
    uiux: "na",
    security: "na",
    documentation: "na",
  });
  const [detailedFeedback, setDetailedFeedback] = useState("");
  const [reviewAction, setReviewAction] = useState<ReviewAction | "">("");

  // Progress calculation based on filled ratings
  const calculateProgress = () => {
    const totalCriteria = Object.keys(reviewRatings).length;
    const filledCriteria = Object.values(reviewRatings).filter(rating => rating !== "na").length;
    return Math.round((filledCriteria / totalCriteria) * 100);
  };

  const handleRatingChange = (criteria: keyof ReviewCriteria, rating: ReviewRating) => {
    setReviewRatings(prev => ({
      ...prev,
      [criteria]: rating
    }));
  };

  const handleSubmitReview = async () => {
    if (activeTab === "evaluation") {
      setActiveTab("action");
      return;
    }

    if (!reviewAction) {
      toast({
        title: "Review action required",
        description: "Please select an action (approve, request changes, or reject) before submitting",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewData = {
        projectId: project.id,
        ratings: reviewRatings,
        action: reviewAction,
        feedback: detailedFeedback
      };
      
      // Submit review and update project status based on action
      await apiRequest("POST", `/api/projects/${project.id}/review`, reviewData);
      
      // Update project status based on the action
      const newStatus = 
        reviewAction === "approve" ? "completed" : 
        reviewAction === "request_changes" ? "in_progress" : 
        "rejected";
      
      await apiRequest("PATCH", `/api/projects/${project.id}`, {
        status: newStatus
      });
      
      // Create an activity entry for this review
      await apiRequest("POST", `/api/projects/${project.id}/activities`, {
        type: "review",
        content: `Project ${
          reviewAction === "approve" ? "approved and completed" : 
          reviewAction === "request_changes" ? "sent back for changes" : 
          "rejected"
        }`
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
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Review</CardTitle>
        <CardDescription>
          Evaluate the project and provide feedback to the development team
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as "evaluation" | "action")}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
            <TabsTrigger value="action">Review Action</TabsTrigger>
          </TabsList>
          
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Evaluation progress</span>
              <span className="text-sm font-medium">{calculateProgress()}%</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-300 ease-in-out"
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
          </div>
          
          <TabsContent value="evaluation" className="space-y-6 pt-4">
            {/* Functionality */}
            <div className="space-y-2">
              <h3 className="font-medium flex justify-between">
                <span>Functionality</span>
                <span className="text-muted-foreground text-sm">
                  {reviewRatings.functionality === "na" ? "Not rated" : reviewRatings.functionality}
                </span>
              </h3>
              <p className="text-sm text-muted-foreground mb-2">Does the application work as expected?</p>
              <RadioGroup 
                className="flex space-x-2" 
                value={reviewRatings.functionality}
                onValueChange={(value) => handleRatingChange("functionality", value as ReviewRating)}
              >
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="excellent" id="functionality-excellent" className="peer sr-only" />
                  <Label 
                    htmlFor="functionality-excellent" 
                    className="size-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-green-700"
                  >
                    😊
                  </Label>
                  <span className="text-xs">Excellent</span>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="good" id="functionality-good" className="peer sr-only" />
                  <Label 
                    htmlFor="functionality-good" 
                    className="size-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-blue-700"
                  >
                    🙂
                  </Label>
                  <span className="text-xs">Good</span>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="fair" id="functionality-fair" className="peer sr-only" />
                  <Label 
                    htmlFor="functionality-fair" 
                    className="size-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-amber-700"
                  >
                    😐
                  </Label>
                  <span className="text-xs">Fair</span>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="poor" id="functionality-poor" className="peer sr-only" />
                  <Label 
                    htmlFor="functionality-poor" 
                    className="size-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-red-700"
                  >
                    🙁
                  </Label>
                  <span className="text-xs">Poor</span>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="na" id="functionality-na" className="peer sr-only" />
                  <Label 
                    htmlFor="functionality-na" 
                    className="size-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-gray-700"
                  >
                    ❓
                  </Label>
                  <span className="text-xs">N/A</span>
                </div>
              </RadioGroup>
            </div>
            
            {/* Code Quality */}
            <div className="space-y-2">
              <h3 className="font-medium flex justify-between">
                <span>Code Quality</span>
                <span className="text-muted-foreground text-sm">
                  {reviewRatings.codeQuality === "na" ? "Not rated" : reviewRatings.codeQuality}
                </span>
              </h3>
              <p className="text-sm text-muted-foreground mb-2">Is the code well-structured, maintainable, and follows best practices?</p>
              <RadioGroup 
                className="flex space-x-2"
                value={reviewRatings.codeQuality}
                onValueChange={(value) => handleRatingChange("codeQuality", value as ReviewRating)}
              >
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="excellent" id="codeQuality-excellent" className="peer sr-only" />
                  <Label 
                    htmlFor="codeQuality-excellent" 
                    className="size-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-green-700"
                  >
                    😊
                  </Label>
                  <span className="text-xs">Excellent</span>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="good" id="codeQuality-good" className="peer sr-only" />
                  <Label 
                    htmlFor="codeQuality-good" 
                    className="size-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-blue-700"
                  >
                    🙂
                  </Label>
                  <span className="text-xs">Good</span>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="fair" id="codeQuality-fair" className="peer sr-only" />
                  <Label 
                    htmlFor="codeQuality-fair" 
                    className="size-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-amber-700"
                  >
                    😐
                  </Label>
                  <span className="text-xs">Fair</span>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="poor" id="codeQuality-poor" className="peer sr-only" />
                  <Label 
                    htmlFor="codeQuality-poor" 
                    className="size-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-red-700"
                  >
                    🙁
                  </Label>
                  <span className="text-xs">Poor</span>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="na" id="codeQuality-na" className="peer sr-only" />
                  <Label 
                    htmlFor="codeQuality-na" 
                    className="size-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-gray-700"
                  >
                    ❓
                  </Label>
                  <span className="text-xs">N/A</span>
                </div>
              </RadioGroup>
            </div>
            
            {/* Performance */}
            <div className="space-y-2">
              <h3 className="font-medium flex justify-between">
                <span>Performance</span>
                <span className="text-muted-foreground text-sm">
                  {reviewRatings.performance === "na" ? "Not rated" : reviewRatings.performance}
                </span>
              </h3>
              <p className="text-sm text-muted-foreground mb-2">Does the application perform efficiently?</p>
              <RadioGroup 
                className="flex space-x-2"
                value={reviewRatings.performance}
                onValueChange={(value) => handleRatingChange("performance", value as ReviewRating)}
              >
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="excellent" id="performance-excellent" className="peer sr-only" />
                  <Label 
                    htmlFor="performance-excellent" 
                    className="size-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-green-700"
                  >
                    😊
                  </Label>
                  <span className="text-xs">Excellent</span>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="good" id="performance-good" className="peer sr-only" />
                  <Label 
                    htmlFor="performance-good" 
                    className="size-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-blue-700"
                  >
                    🙂
                  </Label>
                  <span className="text-xs">Good</span>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="fair" id="performance-fair" className="peer sr-only" />
                  <Label 
                    htmlFor="performance-fair" 
                    className="size-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-amber-700"
                  >
                    😐
                  </Label>
                  <span className="text-xs">Fair</span>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="poor" id="performance-poor" className="peer sr-only" />
                  <Label 
                    htmlFor="performance-poor" 
                    className="size-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-red-700"
                  >
                    🙁
                  </Label>
                  <span className="text-xs">Poor</span>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="na" id="performance-na" className="peer sr-only" />
                  <Label 
                    htmlFor="performance-na" 
                    className="size-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-gray-700"
                  >
                    ❓
                  </Label>
                  <span className="text-xs">N/A</span>
                </div>
              </RadioGroup>
            </div>
            
            {/* UI/UX */}
            <div className="space-y-2">
              <h3 className="font-medium flex justify-between">
                <span>UI/UX</span>
                <span className="text-muted-foreground text-sm">
                  {reviewRatings.uiux === "na" ? "Not rated" : reviewRatings.uiux}
                </span>
              </h3>
              <p className="text-sm text-muted-foreground mb-2">Is the user interface well-designed and intuitive?</p>
              <RadioGroup 
                className="flex space-x-2"
                value={reviewRatings.uiux}
                onValueChange={(value) => handleRatingChange("uiux", value as ReviewRating)}
              >
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="excellent" id="uiux-excellent" className="peer sr-only" />
                  <Label 
                    htmlFor="uiux-excellent" 
                    className="size-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-green-700"
                  >
                    😊
                  </Label>
                  <span className="text-xs">Excellent</span>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="good" id="uiux-good" className="peer sr-only" />
                  <Label 
                    htmlFor="uiux-good" 
                    className="size-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-blue-700"
                  >
                    🙂
                  </Label>
                  <span className="text-xs">Good</span>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="fair" id="uiux-fair" className="peer sr-only" />
                  <Label 
                    htmlFor="uiux-fair" 
                    className="size-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-amber-700"
                  >
                    😐
                  </Label>
                  <span className="text-xs">Fair</span>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="poor" id="uiux-poor" className="peer sr-only" />
                  <Label 
                    htmlFor="uiux-poor" 
                    className="size-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-red-700"
                  >
                    🙁
                  </Label>
                  <span className="text-xs">Poor</span>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="na" id="uiux-na" className="peer sr-only" />
                  <Label 
                    htmlFor="uiux-na" 
                    className="size-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-gray-700"
                  >
                    ❓
                  </Label>
                  <span className="text-xs">N/A</span>
                </div>
              </RadioGroup>
            </div>
            
            {/* Security */}
            <div className="space-y-2">
              <h3 className="font-medium flex justify-between">
                <span>Security</span>
                <span className="text-muted-foreground text-sm">
                  {reviewRatings.security === "na" ? "Not rated" : reviewRatings.security}
                </span>
              </h3>
              <p className="text-sm text-muted-foreground mb-2">Are security best practices followed?</p>
              <RadioGroup 
                className="flex space-x-2"
                value={reviewRatings.security}
                onValueChange={(value) => handleRatingChange("security", value as ReviewRating)}
              >
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="excellent" id="security-excellent" className="peer sr-only" />
                  <Label 
                    htmlFor="security-excellent" 
                    className="size-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-green-700"
                  >
                    😊
                  </Label>
                  <span className="text-xs">Excellent</span>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="good" id="security-good" className="peer sr-only" />
                  <Label 
                    htmlFor="security-good" 
                    className="size-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-blue-700"
                  >
                    🙂
                  </Label>
                  <span className="text-xs">Good</span>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="fair" id="security-fair" className="peer sr-only" />
                  <Label 
                    htmlFor="security-fair" 
                    className="size-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-amber-700"
                  >
                    😐
                  </Label>
                  <span className="text-xs">Fair</span>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="poor" id="security-poor" className="peer sr-only" />
                  <Label 
                    htmlFor="security-poor" 
                    className="size-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-red-700"
                  >
                    🙁
                  </Label>
                  <span className="text-xs">Poor</span>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="na" id="security-na" className="peer sr-only" />
                  <Label 
                    htmlFor="security-na" 
                    className="size-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-gray-700"
                  >
                    ❓
                  </Label>
                  <span className="text-xs">N/A</span>
                </div>
              </RadioGroup>
            </div>
            
            {/* Documentation */}
            <div className="space-y-2">
              <h3 className="font-medium flex justify-between">
                <span>Documentation</span>
                <span className="text-muted-foreground text-sm">
                  {reviewRatings.documentation === "na" ? "Not rated" : reviewRatings.documentation}
                </span>
              </h3>
              <p className="text-sm text-muted-foreground mb-2">Is the code and functionality well-documented?</p>
              <RadioGroup 
                className="flex space-x-2"
                value={reviewRatings.documentation}
                onValueChange={(value) => handleRatingChange("documentation", value as ReviewRating)}
              >
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="excellent" id="documentation-excellent" className="peer sr-only" />
                  <Label 
                    htmlFor="documentation-excellent" 
                    className="size-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-green-700"
                  >
                    😊
                  </Label>
                  <span className="text-xs">Excellent</span>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="good" id="documentation-good" className="peer sr-only" />
                  <Label 
                    htmlFor="documentation-good" 
                    className="size-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-blue-700"
                  >
                    🙂
                  </Label>
                  <span className="text-xs">Good</span>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="fair" id="documentation-fair" className="peer sr-only" />
                  <Label 
                    htmlFor="documentation-fair" 
                    className="size-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-amber-700"
                  >
                    😐
                  </Label>
                  <span className="text-xs">Fair</span>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="poor" id="documentation-poor" className="peer sr-only" />
                  <Label 
                    htmlFor="documentation-poor" 
                    className="size-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-red-700"
                  >
                    🙁
                  </Label>
                  <span className="text-xs">Poor</span>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value="na" id="documentation-na" className="peer sr-only" />
                  <Label 
                    htmlFor="documentation-na" 
                    className="size-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-gray-700"
                  >
                    ❓
                  </Label>
                  <span className="text-xs">N/A</span>
                </div>
              </RadioGroup>
            </div>
            
            {/* Detailed Feedback */}
            <div className="space-y-2">
              <h3 className="font-medium">Detailed Feedback</h3>
              <p className="text-sm text-muted-foreground">
                Provide detailed feedback about the project, including specific issues, strengths, and suggestions for improvement.
              </p>
              <Textarea 
                placeholder="Be specific and constructive in your feedback"
                className="min-h-[100px]"
                value={detailedFeedback}
                onChange={(e) => setDetailedFeedback(e.target.value)}
              />
              <div className="text-right text-xs text-muted-foreground">
                {detailedFeedback.length} characters
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="action" className="space-y-6 pt-4">
            <h3 className="font-medium">Select Review Action</h3>
            
            <RadioGroup 
              className="space-y-4" 
              value={reviewAction}
              onValueChange={(value) => setReviewAction(value as ReviewAction)}
            >
              <div className="flex items-start space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors data-[state=checked]:bg-primary/10 data-[state=checked]:border-primary">
                <RadioGroupItem value="approve" id="review-approve" className="mt-1" />
                <div>
                  <Label htmlFor="review-approve" className="text-base font-medium cursor-pointer">
                    Approve & Complete Project
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Project meets all requirements and is ready for delivery.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors data-[state=checked]:bg-primary/10 data-[state=checked]:border-primary">
                <RadioGroupItem value="request_changes" id="review-changes" className="mt-1" />
                <div>
                  <Label htmlFor="review-changes" className="text-base font-medium cursor-pointer">
                    Request Changes
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Project needs specific modifications before approval.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors data-[state=checked]:bg-primary/10 data-[state=checked]:border-primary">
                <RadioGroupItem value="reject" id="review-reject" className="mt-1" />
                <div>
                  <Label htmlFor="review-reject" className="text-base font-medium cursor-pointer">
                    Reject
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Project fails to meet critical requirements.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-between pt-4">
          {activeTab === "evaluation" ? (
            <Button 
              variant="outline" 
              size="sm" 
              disabled={calculateProgress() === 0}
              onClick={handleSubmitReview}
            >
              Continue to Review Action
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setActiveTab("evaluation")}
            >
              Back to Evaluation
            </Button>
          )}
          
          {activeTab === "action" && (
            <Button 
              disabled={isSubmitting || !reviewAction}
              onClick={handleSubmitReview}
              size="sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}