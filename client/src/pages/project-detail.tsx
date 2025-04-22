import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { ProjectDetailModal } from "@/components/project/ProjectDetailModal";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Project } from "@shared/schema";

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
              
              {/* Used as a placeholder since the actual content is in the modal */}
              <ProjectDetailModal
                projectId={projectId}
                isOpen={true}
                onClose={() => navigate("/")}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
