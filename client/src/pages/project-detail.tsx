import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { ProjectDetailModal } from "@/components/project/ProjectDetailModal";
import { ActivityFeed } from "@/components/project/ActivityFeed";
import { ReviewChecklist } from "@/components/project/ReviewChecklist";
import { TestingDocumentation } from "@/components/project/TestingDocumentation";
import { ReviewForm } from "@/components/project/ReviewForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, CheckCircle2, Rocket, FileText, ClipboardCheck } from "lucide-react";
import { Project } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectProgress } from "@/components/project/ProjectProgress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const projectId = parseInt(params.id);

  // Check if id is a valid number
  if (isNaN(projectId)) {
    navigate("/");
    return null;
  }

  // Fetch project data
  const { data: project, isLoading } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
  });

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <MobileMenu />
        <div className="flex flex-col flex-1 w-0 overflow-hidden md:ml-64">
          <main className="flex-1 relative overflow-y-auto focus:outline-none custom-scrollbar pt-16 md:pt-0">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-border" />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!project) {
    navigate("/");
    return null;
  }
  
  // Show review components conditionally based on project status
  const shouldShowReviewComponents = project.status === "in_progress" || project.status === "under_review";
  
  // Mutation for submitting project for review
  const { toast } = useToast();
  const submitForReviewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "PATCH",
        `/api/projects/${projectId}`,
        { status: "under_review" }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Project submitted for review",
        description: "The development team has been notified and will review your project shortly."
      });
      
      // Create activity log for the submission
      apiRequest("POST", `/api/projects/${projectId}/activities`, {
        type: "status_change",
        content: "Project submitted for review"
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${projectId}`],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit project for review",
        variant: "destructive"
      });
    }
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileMenu />
      <div className="flex flex-col flex-1 w-0 overflow-hidden md:ml-64">
        <main className="flex-1 relative overflow-y-auto focus:outline-none custom-scrollbar pt-16 md:pt-0">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Button 
                variant="ghost" 
                className="mb-4" 
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  {/* Main project details modal */}
                  <ProjectDetailModal
                    projectId={projectId}
                    isOpen={true}
                    onClose={() => navigate("/")}
                  />
                  
                  {/* Project progress visualization */}
                  <div className="mt-6">
                    <h2 className="text-lg font-bold mb-4">Project Progress</h2>
                    {project && <ProjectProgress project={project} />}
                  </div>
                  
                  {/* Review components - only shown when project is in progress/under review */}
                  {shouldShowReviewComponents && (
                    <>
                      <div className="mt-6">
                        <Tabs defaultValue="checklist">
                          <TabsList className="w-full">
                            <TabsTrigger value="checklist" className="flex items-center">
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Review Checklist
                            </TabsTrigger>
                            <TabsTrigger value="testing" className="flex items-center">
                              <FileText className="h-4 w-4 mr-2" />
                              Testing & Deployment
                            </TabsTrigger>
                            {project.status === "under_review" && (
                              <TabsTrigger value="review" className="flex items-center">
                                <ClipboardCheck className="h-4 w-4 mr-2" />
                                Review
                              </TabsTrigger>
                            )}
                          </TabsList>
                          
                          <TabsContent value="checklist" className="mt-4">
                            <ReviewChecklist projectId={projectId} />
                          </TabsContent>
                          
                          <TabsContent value="testing" className="mt-4">
                            <TestingDocumentation projectId={projectId} />
                          </TabsContent>
                          
                          {project.status === "under_review" && (
                            <TabsContent value="review" className="mt-4">
                              <ReviewForm 
                                project={project}
                                onComplete={() => {
                                  queryClient.invalidateQueries({
                                    queryKey: [`/api/projects/${projectId}`],
                                  });
                                }}
                              />
                            </TabsContent>
                          )}
                        </Tabs>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="lg:col-span-1">
                  <Tabs defaultValue="activity" className="w-full">
                    <TabsList className="mb-4 w-full">
                      <TabsTrigger value="activity" className="flex-1">Updates</TabsTrigger>
                      <TabsTrigger value="timeline" className="flex-1">Timeline</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="activity">
                      {/* Integrated Activity Feed for real-time updates */}
                      <ActivityFeed projectId={projectId} />
                    </TabsContent>
                    
                    <TabsContent value="timeline">
                      <div className="bg-card rounded-lg border p-4">
                        <h3 className="font-semibold mb-3">Project Timeline</h3>
                        <div className="space-y-4">
                          <div className="border-l-2 border-primary pl-4 pb-8 relative">
                            <div className="absolute w-3 h-3 rounded-full bg-primary -left-[7px]"></div>
                            <p className="font-medium">Project Started</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(project.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <div className="border-l-2 border-muted pl-4 pb-8 relative">
                            <div className="absolute w-3 h-3 rounded-full bg-muted -left-[7px]"></div>
                            <p className="font-medium">Development Phase</p>
                            <p className="text-sm text-muted-foreground">In progress</p>
                          </div>
                          
                          <div className="border-l-2 border-muted pl-4 relative">
                            <div className="absolute w-3 h-3 rounded-full bg-muted -left-[7px]"></div>
                            <p className="font-medium">Estimated Completion</p>
                            <p className="text-sm text-muted-foreground">
                              {(() => {
                                const date = new Date(project.createdAt);
                                date.setDate(date.getDate() + (project.timeline * 7));
                                return date.toLocaleDateString();
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  {/* Submission button (only when in progress) */}
                  {project.status === "in_progress" && (
                    <div className="mt-6">
                      <Button 
                        className="w-full" 
                        size="lg"
                        variant="default"
                        onClick={() => submitForReviewMutation.mutate()}
                        disabled={submitForReviewMutation.isPending}
                      >
                        {submitForReviewMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Rocket className="mr-2 h-5 w-5" />
                            Submit Project for Review
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Before submitting, make sure all checklist items are completed 
                        and testing documentation is provided.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
