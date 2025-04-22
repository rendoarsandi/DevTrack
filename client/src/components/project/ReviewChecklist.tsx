import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ClipboardCheck, ListChecks } from "lucide-react";

interface ReviewChecklistProps {
  projectId: number | string;
}

interface ChecklistItem {
  id: string;
  label: string;
  category: string;
  checked: boolean;
}

const defaultChecklist: ChecklistItem[] = [
  // Functionality Testing
  { id: "func-core", label: "Core features tested", category: "functionality", checked: false },
  { id: "func-edge", label: "Edge cases handled", category: "functionality", checked: false },
  { id: "func-error", label: "Error handling tested", category: "functionality", checked: false },
  { id: "func-inputs", label: "Input validation tested", category: "functionality", checked: false },
  
  // Performance Testing
  { id: "perf-load", label: "Load testing completed", category: "performance", checked: false },
  { id: "perf-response", label: "Response time acceptable", category: "performance", checked: false },
  { id: "perf-resource", label: "Resource usage optimized", category: "performance", checked: false },
  
  // UI/UX Testing
  { id: "ui-responsive", label: "Responsive design verified", category: "ui-ux", checked: false },
  { id: "ui-usability", label: "Usability standards met", category: "ui-ux", checked: false },
  { id: "ui-accessibility", label: "Accessibility checked", category: "ui-ux", checked: false },
  
  // Security Testing
  { id: "sec-auth", label: "Authentication tested", category: "security", checked: false },
  { id: "sec-data", label: "Data protection verified", category: "security", checked: false },
  { id: "sec-vulnerabilities", label: "Common vulnerabilities checked", category: "security", checked: false },
  
  // Documentation
  { id: "doc-code", label: "Code documentation complete", category: "documentation", checked: false },
  { id: "doc-user", label: "User guide created", category: "documentation", checked: false },
  { id: "doc-api", label: "API documentation provided", category: "documentation", checked: false },
];

export function ReviewChecklist({ projectId }: ReviewChecklistProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(defaultChecklist);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  
  // Group checklist items by category
  const categories = {
    functionality: checklist.filter(item => item.category === "functionality"),
    performance: checklist.filter(item => item.category === "performance"),
    "ui-ux": checklist.filter(item => item.category === "ui-ux"),
    security: checklist.filter(item => item.category === "security"),
    documentation: checklist.filter(item => item.category === "documentation"),
  };
  
  // Update checklist item status
  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => 
      prev.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };
  
  // Calculate completion percentage
  const completionPercentage = Math.round(
    (checklist.filter(item => item.checked).length / checklist.length) * 100
  );
  
  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (data: { checklist: ChecklistItem[], notes: string }) => {
      const response = await apiRequest(
        "POST",
        `/api/projects/${projectId}/review`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Review submitted",
        description: "Your review checklist has been submitted successfully",
      });
      
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${projectId}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${projectId}/activities`],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });
  
  const handleSubmitReview = () => {
    // Mock implementation - in real app this would be connected to the API
    submitReviewMutation.mutate({
      checklist,
      notes
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ListChecks className="mr-2 h-5 w-5" />
          Pre-submission Review Checklist
        </CardTitle>
        <CardDescription>
          Complete this checklist before submitting your project for review
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Progress indicator */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Checklist completion</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full">
              <div 
                className="bg-primary h-2 rounded-full" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
          
          {/* Functionality testing section */}
          <div>
            <h3 className="text-sm font-medium mb-3">Functionality Testing</h3>
            <div className="space-y-2">
              {categories.functionality.map(item => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={item.id} 
                    checked={item.checked} 
                    onCheckedChange={() => toggleChecklistItem(item.id)} 
                  />
                  <Label htmlFor={item.id} className="text-sm">{item.label}</Label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Performance testing section */}
          <div>
            <h3 className="text-sm font-medium mb-3">Performance Testing</h3>
            <div className="space-y-2">
              {categories.performance.map(item => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={item.id} 
                    checked={item.checked} 
                    onCheckedChange={() => toggleChecklistItem(item.id)} 
                  />
                  <Label htmlFor={item.id} className="text-sm">{item.label}</Label>
                </div>
              ))}
            </div>
          </div>
          
          {/* UI/UX testing section */}
          <div>
            <h3 className="text-sm font-medium mb-3">UI/UX Testing</h3>
            <div className="space-y-2">
              {categories["ui-ux"].map(item => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={item.id} 
                    checked={item.checked} 
                    onCheckedChange={() => toggleChecklistItem(item.id)} 
                  />
                  <Label htmlFor={item.id} className="text-sm">{item.label}</Label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Security testing section */}
          <div>
            <h3 className="text-sm font-medium mb-3">Security Testing</h3>
            <div className="space-y-2">
              {categories.security.map(item => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={item.id} 
                    checked={item.checked} 
                    onCheckedChange={() => toggleChecklistItem(item.id)} 
                  />
                  <Label htmlFor={item.id} className="text-sm">{item.label}</Label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Documentation section */}
          <div>
            <h3 className="text-sm font-medium mb-3">Documentation</h3>
            <div className="space-y-2">
              {categories.documentation.map(item => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={item.id} 
                    checked={item.checked} 
                    onCheckedChange={() => toggleChecklistItem(item.id)} 
                  />
                  <Label htmlFor={item.id} className="text-sm">{item.label}</Label>
                </div>
              ))}
            </div>
          </div>
          
          <Separator />
          
          {/* Notes for reviewers */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">Additional Notes for Reviewers</Label>
            <Textarea
              id="notes"
              placeholder="Provide any additional context, testing notes, or areas that need special attention..."
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          
          {/* Submit button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmitReview}
              disabled={submitReviewMutation.isPending || completionPercentage < 100}
            >
              {submitReviewMutation.isPending ? (
                <>Processing...</>
              ) : (
                <>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Submit Review Checklist
                </>
              )}
            </Button>
          </div>
          
          {completionPercentage < 100 && (
            <p className="text-sm text-amber-600">
              Please complete the entire checklist before submission.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}