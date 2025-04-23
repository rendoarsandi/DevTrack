import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { ProjectDetailModal } from "@/components/project/ProjectDetailModal";
import { ActivityFeed } from "@/components/project/ActivityFeed";
import { ReviewChecklist } from "@/components/project/ReviewChecklist";
import { TestingDocumentation } from "@/components/project/TestingDocumentation";
import { EnhancedReviewForm } from "@/components/project/EnhancedReviewForm";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, CheckCircle2, Rocket, FileText, ClipboardCheck, AlertCircle, MessageSquare, File } from "lucide-react";
import { Project } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectProgress } from "@/components/project/ProjectProgress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
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
                  {/* Main project details */}
                  <div className="mb-6">
                    <div className="border rounded-lg p-5 shadow-sm bg-card">
                      <div className="pb-2">
                        <h2 className="text-2xl font-bold">{project.title}</h2>
                        <div className="flex justify-between items-center">
                          <p className="text-muted-foreground">{project.description}</p>
                          <div className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {project.status === "pending_review" ? "Under Review" :
                             project.status === "awaiting_dp" ? "Awaiting Deposit" :
                             project.status === "in_progress" ? "In Progress" :
                             project.status === "under_review" ? "Review Required" :
                             project.status === "completed" ? "Completed" : "Unknown"}
                          </div>
                        </div>
                      </div>
                      
                      {project.status === "under_review" && (
                        <div className="pb-0">
                          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800 mt-2">
                            <div className="flex items-center">
                              <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
                              <p className="font-medium">Project Review Required</p>
                            </div>
                            <p className="ml-7 text-sm mt-0.5">
                              Please review the project and provide your feedback. You can approve the project, request changes, or reject it.
                            </p>
                            <Button 
                              onClick={() => {
                                const reviewElement = document.getElementById('review-section');
                                if (reviewElement) {
                                  reviewElement.scrollIntoView({ behavior: 'smooth' });
                                }
                              }} 
                              variant="outline"
                              className="ml-7 mt-2 border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-200"
                            >
                              Go to Review Section
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Project details section - No modal needed here */}
                  <div className="mb-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Project Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</h4>
                            <p className="mt-1 text-sm">{project.description}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Start Date</h4>
                              <p className="mt-1 text-sm">{new Date(project.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Expected Completion</h4>
                              <p className="mt-1 text-sm">
                                {(() => {
                                  const date = new Date(project.createdAt);
                                  date.setDate(date.getDate() + (project.timeline * 7));
                                  return date.toLocaleDateString();
                                })()}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Budget</h4>
                              <p className="mt-1 text-sm">${project.quote.toLocaleString()}</p>
                            </div>
                            <div>
                              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment Status</h4>
                              <p className="mt-1 text-sm">
                                {project.paymentStatus}% paid (${(project.quote * project.paymentStatus / 100).toLocaleString()})
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Project review notification - more prominent */}
                  {project.status === "under_review" && (
                    <div className="my-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertCircle className="h-6 w-6 text-amber-500" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-lg font-medium text-amber-800">Review Diperlukan!</h3>
                          <div className="mt-2 text-amber-700">
                            <p>Proyek Anda telah memasuki tahap akhir pengembangan dan siap untuk dievaluasi.</p>
                            <p className="mt-1">Silahkan gunakan <span className="font-bold">form review di bawah</span> ini untuk menyetujui atau meminta perubahan pada proyek Anda.</p>
                            <div className="mt-4">
                              <Button 
                                onClick={() => {
                                  // Scroll ke form review dan ubah tab secara otomatis
                                  const reviewElement = document.getElementById('review-section');
                                  if (reviewElement) {
                                    reviewElement.scrollIntoView({ behavior: 'smooth' });
                                    
                                    // Temukan tab review dan klik
                                    const reviewTab = document.querySelector('[value="review"]');
                                    if (reviewTab) {
                                      (reviewTab as HTMLElement).click();
                                    }
                                  }
                                }}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                              >
                                Submit Review Now &rarr;
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Project progress visualization */}
                  <div className="mt-6">
                    <h2 className="text-lg font-bold mb-4">Project Progress</h2>
                    {project && <ProjectProgress project={project} />}
                  </div>
                  
                  {/* Review components - only shown when project is in progress/under review */}
                  {shouldShowReviewComponents && (
                    <>
                      <div className="mt-6">
                        <Tabs defaultValue={project.status === "under_review" ? "review" : "checklist"}>
                          <TabsList className="w-full">
                            <TabsTrigger value="checklist" className="flex items-center">
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Review Checklist
                            </TabsTrigger>
                            <TabsTrigger value="testing" className="flex items-center">
                              <FileText className="h-4 w-4 mr-2" />
                              Testing & Deployment
                            </TabsTrigger>
                            {/* Only show Review tab when under review for client to approve/reject */}
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
                            <TabsContent value="review" className="mt-4" id="review-section">
                              <EnhancedReviewForm 
                                project={project}
                                onComplete={() => {
                                  queryClient.invalidateQueries({
                                    queryKey: [`/api/projects/${projectId}`],
                                  });
                                  
                                  // Tampilkan notifikasi sukses
                                  toast({
                                    title: "Review berhasil dikirim",
                                    description: "Terima kasih telah mengirimkan review Anda. Status proyek telah diperbarui."
                                  });
                                  
                                  // Arahkan ke halaman proyek setelah beberapa detik
                                  setTimeout(() => {
                                    navigate("/");
                                  }, 3000);
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
                      <TabsTrigger value="communication" className="flex-1">Communication</TabsTrigger>
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
                    
                    <TabsContent value="communication">
                      <div className="space-y-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Communication Options</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 gap-3">
                              <Button 
                                variant="outline" 
                                className="justify-start"
                                onClick={() => {
                                  // Buka modal proyek dengan tab LiveChat
                                  // Menggunakan ProjectDetailModal sebagai dialog
                                  // Logic akan ditambahkan nanti
                                  const link = document.createElement('a');
                                  link.href = `/`;
                                  link.setAttribute('data-action', 'open-modal');
                                  link.setAttribute('data-project-id', projectId.toString());
                                  link.setAttribute('data-tab', 'chat');
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                              >
                                <MessageSquare className="mr-2 h-4 w-4" />
                                <div className="text-left">
                                  <div className="font-medium">Live Chat</div>
                                  <div className="text-xs text-muted-foreground">Real-time conversation with the team</div>
                                </div>
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                className="justify-start"
                                onClick={() => {
                                  // Buka modal proyek dengan tab Send Media & Files
                                  const link = document.createElement('a');
                                  link.href = `/`;
                                  link.setAttribute('data-action', 'open-modal');
                                  link.setAttribute('data-project-id', projectId.toString());
                                  link.setAttribute('data-tab', 'feedback');
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                              >
                                <File className="mr-2 h-4 w-4" />
                                <div className="text-left">
                                  <div className="font-medium">Send Media & Files</div>
                                  <div className="text-xs text-muted-foreground">Share documents and formal communications</div>
                                </div>
                              </Button>

                              {project.status === "under_review" && (
                                <Button 
                                  variant="outline" 
                                  className="justify-start"
                                  onClick={() => {
                                    // Scroll ke form review
                                    const reviewElement = document.getElementById('review-section');
                                    if (reviewElement) {
                                      reviewElement.scrollIntoView({ behavior: 'smooth' });
                                      // Temukan tab review dan klik
                                      const reviewTab = document.querySelector('[value="review"]');
                                      if (reviewTab) {
                                        (reviewTab as HTMLElement).click();
                                      }
                                    }
                                  }}
                                >
                                  <ClipboardCheck className="mr-2 h-4 w-4" />
                                  <div className="text-left">
                                    <div className="font-medium">Project Review</div>
                                    <div className="text-xs text-muted-foreground">Approve or request changes</div>
                                  </div>
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  {/* Dalam workflow otomatis, client tidak lagi perlu submit project untuk review
                     Status proyek diubah oleh admin saat development selesai */}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
