import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Project } from "@shared/schema";
import { 
  CalendarDays, 
  CheckCircle, 
  CircleDollarSign, 
  Clock, 
  FileText 
} from "lucide-react";
import { statusColorMap, formatStatusLabel } from "@/lib/utils";

type ProjectProgressProps = {
  project: Project;
};

export function ProjectProgress({ project }: ProjectProgressProps) {
  // Status badges and their colors
  const statusColor = statusColorMap[project.status];
  
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + (project.timeline * 7)); // timeline is in weeks
  
  // Payment status display
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