import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@shared/schema";
import { statusColorMap, formatStatusLabel } from "@/lib/utils";
import { 
  AlertTriangle,
  ArrowRight, 
  BarChart, 
  CheckCircle, 
  Clock, 
  FileText, 
  Users 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [projectFetchError, setProjectFetchError] = useState<string | null>(null);
  
  // Fetch all projects (admin view shows all projects)
  const { 
    data: projects = [], 
    isLoading
  } = useQuery<Project[]>({
    queryKey: ["/api/admin/projects"],
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 60000,
  });

  // Handle errors with useEffect instead of onError callback
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/admin/projects", {
          credentials: "include",
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error fetching projects:", errorText);
          
          setProjectFetchError(errorText);
          toast({
            title: "Error fetching projects",
            description: errorText || "Please try again later",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        if (error instanceof Error) {
          setProjectFetchError(error.message);
          toast({
            title: "Error fetching projects",
            description: error.message || "Please try again later",
            variant: "destructive",
          });
        }
      }
    };
    
    fetchProjects();
  }, [toast]);
  
  // Safe projects array that handles any type issues
  const safeProjects: Project[] = Array.isArray(projects) ? projects : [];
  
  // Group projects by status for stats
  const projectStats = {
    awaiting_dp: safeProjects.filter((p: Project) => p.status === "awaiting_dp").length,
    in_progress: safeProjects.filter((p: Project) => p.status === "in_progress").length,
    under_review: safeProjects.filter((p: Project) => p.status === "under_review").length,
    completed: safeProjects.filter((p: Project) => p.status === "completed").length,
    total: safeProjects.length,
  };
  
  // Calculate total value of all projects
  const totalValue = safeProjects.reduce((sum: number, project: Project) => sum + project.quote, 0);
  
  // Format currency number
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const statCards = [
    {
      title: "Total Projects",
      value: projectStats.total,
      icon: <FileText className="h-6 w-6" />,
      color: "bg-blue-100 text-blue-700",
    },
    {
      title: "Awaiting Processing",
      value: projectStats.awaiting_dp,
      icon: <Clock className="h-6 w-6" />,
      color: "bg-yellow-100 text-yellow-700",
    },
    {
      title: "In Progress",
      value: projectStats.in_progress,
      icon: <BarChart className="h-6 w-6" />,
      color: "bg-indigo-100 text-indigo-700",
    },
    {
      title: "Completed",
      value: projectStats.completed,
      icon: <CheckCircle className="h-6 w-6" />,
      color: "bg-green-100 text-green-700",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and track all project applications
          </p>
        </div>
        
        {/* Error Display */}
        {projectFetchError && (
          <Card className="border-destructive">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                <div>
                  <h3 className="font-semibold">Error loading projects</h3>
                  <p className="text-sm">{projectFetchError}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                  </div>
                  <div className={`p-2 rounded-full ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Recent Projects Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Project Requests</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/admin/projects")}
            >
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : safeProjects.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No project requests found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {safeProjects.slice(0, 5).map((project: Project) => {
                    const statusColor = statusColorMap[project.status];
                    return (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.id}</TableCell>
                        <TableCell className="font-medium">{project.title}</TableCell>
                        <TableCell>Client #{project.clientId}</TableCell>
                        <TableCell>{formatCurrency(project.quote)}</TableCell>
                        <TableCell>{formatDate(project.createdAt)}</TableCell>
                        <TableCell>
                          <Badge style={{
                            backgroundColor: statusColor.bg,
                            color: statusColor.text,
                          }}>
                            {formatStatusLabel(project.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/admin/projects/${project.id}`)}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="font-medium">Total Project Value</span>
                  <span className="font-bold">{formatCurrency(totalValue)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="font-medium">Average Project Value</span>
                  <span className="font-bold">
                    {formatCurrency(safeProjects.length ? totalValue / safeProjects.length : 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="font-medium">Highest Project Value</span>
                  <span className="font-bold">
                    {formatCurrency(
                      safeProjects.length ? Math.max(...safeProjects.map((p: Project) => p.quote)) : 0
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Project Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(projectStats).map(([status, count]) => {
                  if (status === 'total') return null;
                  
                  const percentage = safeProjects.length 
                    ? Math.round((count / safeProjects.length) * 100) 
                    : 0;
                  
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{formatStatusLabel(status)}</span>
                        <span>{count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}