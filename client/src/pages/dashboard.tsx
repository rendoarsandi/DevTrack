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
  PlusIcon,
  ArrowUpRight,
  ClipboardList,
  Bell,
  AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const [location, navigate] = useLocation();
  const [filter, setFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("all");
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

  // Filter projects based on selected status filter and tab
  const filteredProjects = projects ? projects.filter(project => {
    // First apply status filter
    if (filter !== "all" && project.status !== filter) return false;
    
    // Then apply the tab filter
    if (activeTab === "all") return true;
    if (activeTab === "active") return project.status === "in_progress";
    if (activeTab === "review") return project.status === "under_review";
    if (activeTab === "completed") return project.status === "completed";
    return true;
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
        <main className="flex-1 relative overflow-y-auto focus:outline-none custom-scrollbar pt-16 md:pt-0 bg-gradient-to-b from-[#f0f4f9] to-background">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Welcome Banner */}
              <div className="mb-8 bg-gradient-to-r from-primary/90 to-primary rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-8 md:px-10">
                  <div className="md:flex md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl font-heading font-bold text-white sm:text-3xl leading-tight mb-2">
                        Welcome back!
                      </h1>
                      <p className="text-primary-foreground/90 max-w-xl">
                        Manage your project development, track progress, communicate with your team, and monitor project deliverables all in one place.
                      </p>
                      
                      {/* Alert for awaiting review projects */}
                      {stats.awaitingFeedback > 0 && (
                        <div className="flex items-center mt-4 bg-white/20 text-white px-4 py-2 rounded-lg w-fit">
                          <Bell className="h-4 w-4 mr-2" />
                          <span>You have {stats.awaitingFeedback} project{stats.awaitingFeedback > 1 ? 's' : ''} waiting for your review</span>
                          <ArrowUpRight className="h-4 w-4 ml-2" />
                        </div>
                      )}
                    </div>
                    <div className="mt-6 flex md:mt-0 md:ml-4">
                      <Button 
                        onClick={handleNewProject}
                        className="bg-white text-primary hover:bg-white/90 font-medium shadow-sm"
                      >
                        <PlusIcon className="mr-2 h-4 w-4" />
                        New Project Request
                      </Button>
                    </div>
                  </div>
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
                  title="Awaiting Review"
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
              
              {/* Projects Section with Tabs */}
              <div className="mb-8 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div>
                      <h2 className="text-xl font-heading font-bold text-foreground">Projects</h2>
                      <p className="text-sm text-muted-foreground">Manage and track all your development projects</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="bg-background border border-border w-[180px]">
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
                      <Button variant="outline" onClick={handleNewProject}>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        New
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <Tabs defaultValue="all" className="w-full" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-6 bg-muted/50">
                      <TabsTrigger value="all" className="data-[state=active]:bg-background">
                        All
                        {projects && projects.length > 0 && (
                          <Badge variant="outline" className="ml-2">{projects.length}</Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="active" className="data-[state=active]:bg-background">
                        Active
                        {stats.activeProjects > 0 && (
                          <Badge variant="outline" className="ml-2">{stats.activeProjects}</Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="review" className="data-[state=active]:bg-background">
                        Under Review
                        {stats.awaitingFeedback > 0 && (
                          <Badge variant="outline" className="ml-2">{stats.awaitingFeedback}</Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="completed" className="data-[state=active]:bg-background">
                        Completed
                        {stats.completedProjects > 0 && (
                          <Badge variant="outline" className="ml-2">{stats.completedProjects}</Badge>
                        )}
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value={activeTab} className="mt-0">
                      {isLoadingProjects ? (
                        <div className="flex justify-center items-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-muted" />
                        </div>
                      ) : filteredProjects.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredProjects.map((project) => (
                            <div 
                              key={project.id} 
                              onClick={() => setSelectedProjectId(project.id)}
                              className="cursor-pointer transform transition-transform hover:-translate-y-1"
                            >
                              <ProjectCard project={project} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-background rounded-lg border border-border">
                          <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium text-foreground mb-2">No projects found</h3>
                          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            {filter !== "all" || activeTab !== "all" 
                              ? "Try changing your filters to see more projects" 
                              : "Get started by creating your first project request"}
                          </p>
                          <Button onClick={handleNewProject}>
                            <PlusIcon className="mr-2 h-4 w-4" />
                            New Project
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
              
              {/* Recent Activities Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-heading font-bold text-foreground">Recent Activity</h2>
                  {activities && activities.length > 5 && (
                    <Button variant="ghost" size="sm" className="text-primary">
                      View all
                      <ArrowUpRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
                
                <Card>
                  <CardContent className="p-0">
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
                        <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No recent activity</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
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
