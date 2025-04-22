import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { ActivityItem } from "@/components/dashboard/ActivityItem";
import { ProjectDetailModal } from "@/components/project/ProjectDetailModal";
import { Project, Activity } from "@shared/schema";
import { 
  Loader2, 
  CircleDollarSign, 
  CheckCircle, 
  MessageSquare, 
  Briefcase,
  PlusIcon
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Dashboard() {
  const [location, navigate] = useLocation();
  const [filter, setFilter] = useState<string>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  
  // Load projects
  const { 
    data: projects, 
    isLoading: isLoadingProjects 
  } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Load activities
  const { 
    data: activities, 
    isLoading: isLoadingActivities 
  } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  // Calculate stats
  const stats = {
    activeProjects: projects?.filter(p => p.status === "in_progress").length || 0,
    awaitingFeedback: projects?.filter(p => p.status === "under_review").length || 0,
    completedProjects: projects?.filter(p => p.status === "completed").length || 0,
    pendingPayments: projects
      ?.filter(p => p.paymentStatus < 100)
      .reduce((total, project) => {
        // Calculate remaining payment
        const remainingPercentage = 100 - project.paymentStatus;
        const remainingAmount = (project.quote * remainingPercentage) / 100;
        return total + remainingAmount;
      }, 0) || 0,
  };

  // Filter projects based on selected filter
  const filteredProjects = projects ? projects.filter(project => {
    if (filter === "all") return true;
    return project.status === filter;
  }) : [];

  const handleNewProject = () => {
    navigate("/projects/new");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Mobile Menu */}
      <MobileMenu />
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden md:ml-64">
        <main className="flex-1 relative overflow-y-auto focus:outline-none custom-scrollbar pt-16 md:pt-0">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Header */}
              <div className="md:flex md:items-center md:justify-between mb-6">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-heading font-bold text-foreground sm:text-3xl leading-7">Dashboard</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Welcome back to your project management dashboard.</p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                  <Button onClick={handleNewProject}>
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    New Project
                  </Button>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                  icon={<Briefcase />}
                  iconBgColor="bg-blue-100"
                  iconColor="text-primary"
                  title="Active Projects"
                  value={stats.activeProjects}
                />
                <StatCard
                  icon={<MessageSquare />}
                  iconBgColor="bg-yellow-100"
                  iconColor="text-yellow-600"
                  title="Awaiting Feedback"
                  value={stats.awaitingFeedback}
                />
                <StatCard
                  icon={<CheckCircle />}
                  iconBgColor="bg-green-100"
                  iconColor="text-secondary"
                  title="Completed Projects"
                  value={stats.completedProjects}
                />
                <StatCard
                  icon={<CircleDollarSign />}
                  iconBgColor="bg-red-100"
                  iconColor="text-accent"
                  title="Pending Payments"
                  value={`$${stats.pendingPayments.toLocaleString()}`}
                />
              </div>
              
              {/* Projects Section */}
              <div className="mb-8">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-heading font-bold text-foreground">Your Projects</h2>
                  <div>
                    <Select value={filter} onValueChange={setFilter}>
                      <SelectTrigger className="bg-white border border-border w-[180px]">
                        <SelectValue placeholder="All Projects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="awaiting_dp">Awaiting Payment</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {isLoadingProjects ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted" />
                  </div>
                ) : projects && projects.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                      <div 
                        key={project.id} 
                        onClick={() => setSelectedProjectId(project.id)}
                      >
                        <ProjectCard project={project} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg border border-border">
                    <h3 className="text-lg font-medium text-foreground mb-2">No projects yet</h3>
                    <p className="text-muted-foreground mb-6">Get started by creating your first project</p>
                    <Button onClick={handleNewProject}>
                      <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                      New Project
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Recent Activities Section */}
              <div>
                <h2 className="text-xl font-heading font-bold text-foreground mb-5">Recent Activities</h2>
                <div className="bg-white rounded-lg shadow border border-border overflow-hidden">
                  {isLoadingActivities ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted" />
                    </div>
                  ) : activities && activities.length > 0 ? (
                    <ul className="divide-y divide-border">
                      {activities.slice(0, 5).map((activity) => (
                        <ActivityItem key={activity.id} activity={activity} />
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No recent activity</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Project Detail Modal */}
      {selectedProjectId && (
        <ProjectDetailModal
          projectId={selectedProjectId}
          isOpen={selectedProjectId !== null}
          onClose={() => setSelectedProjectId(null)}
        />
      )}
    </div>
  );
}
