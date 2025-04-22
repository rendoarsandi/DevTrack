import React, { useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Project, Milestone } from "@shared/schema";
import { 
  CalendarDays, 
  CheckCircle2, 
  CircleDollarSign, 
  Clock, 
  FileText,
  Circle,
  CircleAlert,
  Loader2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { statusColorMap, formatStatusLabel } from "@/lib/utils";

type ProjectProgressProps = {
  project: Project;
};

// Define milestones with their ideal progress percentages
type ProjectMilestone = {
  name: string;
  progressValue: number;
  status: 'completed' | 'in_progress' | 'pending';
  icon: React.ReactNode;
};

export function ProjectProgress({ project }: ProjectProgressProps) {
  // Status badges and their colors
  const statusColor = statusColorMap[project.status];
  
  // Fetch milestones if available
  const { data: milestones = [] } = useQuery<Milestone[]>({
    queryKey: [`/api/projects/${project.id}/milestones`],
    refetchOnWindowFocus: false,
  });
  
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + (project.timeline * 7)); // timeline is in weeks
  
  // Payment status display with progress contribution
  const getPaymentStatusText = () => {
    switch (project.paymentStatus) {
      case 0:
        return "Awaiting payment";
      case 50:
        return "50% paid (down payment)";
      case 100:
        return "100% paid (completed)";
      default:
        return `${project.paymentStatus}% paid`;
    }
  };
  
  // Calculate standardized milestones based on real milestones or project status
  const standardizedMilestones = useMemo(() => {
    // Default milestone structure with progress markers
    const defaultMilestones: ProjectMilestone[] = [
      { 
        name: "Project Approval & DP", 
        progressValue: 10, 
        status: 'pending',
        icon: <CircleDollarSign className="h-5 w-5" />
      },
      { 
        name: "Design & Planning", 
        progressValue: 25, 
        status: 'pending',
        icon: <FileText className="h-5 w-5" />
      },
      { 
        name: "Development - Backend", 
        progressValue: 50, 
        status: 'pending',
        icon: <Clock className="h-5 w-5" />
      },
      { 
        name: "Development - Frontend", 
        progressValue: 75, 
        status: 'pending',
        icon: <Clock className="h-5 w-5" />
      },
      { 
        name: "Testing & Deployment", 
        progressValue: 100, 
        status: 'pending',
        icon: <CheckCircle2 className="h-5 w-5" />
      }
    ];
    
    // Determine milestone status based on project progress and payment status
    defaultMilestones.forEach((milestone, index) => {
      if (project.progress >= milestone.progressValue) {
        milestone.status = 'completed';
      } else if (index > 0 && defaultMilestones[index-1].status === 'completed') {
        milestone.status = 'in_progress';
      }
    });
    
    // Special case: If down payment is made (paymentStatus >= 50), mark first milestone as completed
    if (project.paymentStatus >= 50 && defaultMilestones[0].status !== 'completed') {
      defaultMilestones[0].status = 'completed';
    }
    
    // Special case: If project is completed, mark all milestones as completed
    if (project.status === 'completed') {
      defaultMilestones.forEach(milestone => milestone.status = 'completed');
    }
    
    return defaultMilestones;
  }, [project.progress, project.paymentStatus, project.status]);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Project Progress</CardTitle>
        <CardDescription>Overall progress and status of your project</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>
        
        {/* Visualize milestone progress as a horizontal timeline */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold mb-4">Project Milestones</h3>
          <div className="relative">
            {/* Progress line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted"></div>
            <div 
              className="absolute top-5 left-0 h-0.5 bg-primary" 
              style={{ width: `${project.progress}%` }}
            ></div>
            
            {/* Milestone markers */}
            <div className="grid grid-cols-5 relative">
              {standardizedMilestones.map((milestone, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className={`z-10 w-10 h-10 rounded-full flex items-center justify-center ${
                    milestone.status === 'completed' 
                      ? 'bg-primary text-white' 
                      : milestone.status === 'in_progress'
                        ? 'bg-amber-100 text-amber-600 animate-pulse'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {milestone.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : milestone.status === 'in_progress' ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </div>
                  <p className="text-xs text-center mt-2 font-medium">{milestone.name}</p>
                  <p className="text-xs text-muted-foreground text-center">{milestone.progressValue}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Status */}
          <div className="flex items-start gap-3">
            <div className={`rounded-full p-2 ${statusColor.bg}`}>
              <FileText className={`h-5 w-5 ${statusColor.text}`} />
            </div>
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className={`text-sm ${statusColor.text}`}>
                {formatStatusLabel(project.status)}
              </p>
            </div>
          </div>
          
          {/* Payment Status */}
          <div className="flex items-start gap-3">
            <div className="rounded-full p-2 bg-amber-100">
              <CircleDollarSign className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Payment</p>
              <p className="text-sm">{getPaymentStatusText()}</p>
            </div>
          </div>
          
          {/* Timeline */}
          <div className="flex items-start gap-3">
            <div className="rounded-full p-2 bg-indigo-100">
              <Clock className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Timeline</p>
              <p className="text-sm">{project.timeline} weeks</p>
            </div>
          </div>
          
          {/* Deadline */}
          <div className="flex items-start gap-3">
            <div className="rounded-full p-2 bg-rose-100">
              <CalendarDays className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Estimated Completion</p>
              <p className="text-sm">{deadline.toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}