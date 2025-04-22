import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Project } from "@shared/schema";
import { 
  AlertCircle, 
  Clock, 
  CircleDollarSign, 
  Calendar, 
  TrendingUp,
  ArrowRight,
  Eye,
  CheckCircle2
} from "lucide-react";
import { statusColorMap, formatStatusLabel } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  // Format relative time
  const timeAgo = formatDistanceToNow(new Date(project.createdAt), {
    addSuffix: true,
  });

  // Get status colors from the utility function
  const statusColors = statusColorMap[project.status] || { bg: "bg-gray-100", text: "text-gray-800" };
  const statusLabel = formatStatusLabel(project.status);

  // Progress color based on progress percentage
  const getProgressColor = (progress: number) => {
    if (progress < 25) return "bg-red-500";
    if (progress < 50) return "bg-yellow-500";
    if (progress < 75) return "bg-blue-500";
    return "bg-green-500";
  };

  // Calculate payment status
  const getPaymentStatusInfo = () => {
    if (project.paymentStatus === 0) {
      return {
        label: "Payment Pending",
        color: "text-yellow-600",
        actionLabel: "Pay Deposit",
        actionColor: "text-secondary",
      };
    } else if (project.paymentStatus === 50) {
      return {
        label: "50% Paid",
        color: "text-blue-600",
        actionLabel: project.status === "completed" ? "Complete Payment" : undefined,
        actionColor: "text-secondary",
      };
    } else if (project.paymentStatus === 100) {
      return {
        label: "Fully Paid",
        color: "text-secondary",
        actionLabel: undefined,
      };
    } else {
      return {
        label: `${project.paymentStatus}% Paid`,
        color: "text-muted-foreground",
        actionLabel: undefined,
      };
    }
  };

  const paymentInfo = getPaymentStatusInfo();

  // Get action button based on project status
  const getActionButton = () => {
    if (project.status === "awaiting_dp" && project.paymentStatus === 0) {
      return (
        <Button
          variant="outline"
          size="sm"
          className="text-secondary border-secondary hover:bg-secondary/10"
          asChild
        >
          <Link href={`/projects/${project.id}`}>
            <CircleDollarSign className="mr-2 h-4 w-4" />
            Pay Deposit
          </Link>
        </Button>
      );
    } else if (project.status === "completed" && project.paymentStatus < 100) {
      return (
        <Button
          variant="outline" 
          size="sm"
          className="text-secondary border-secondary hover:bg-secondary/10"
          asChild
        >
          <Link href={`/projects/${project.id}`}>
            <CircleDollarSign className="mr-2 h-4 w-4" />
            Complete Payment
          </Link>
        </Button>
      );
    } else if (project.status === "under_review") {
      return (
        <Button
          variant="default"
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white"
          asChild
        >
          <Link href={`/projects/${project.id}`}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Submit Review
          </Link>
        </Button>
      );
    } else {
      return (
        <Button
          variant="outline"
          size="sm"
          className="text-primary border-primary hover:bg-primary/10"
          asChild
        >
          <Link href={`/projects/${project.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </Button>
      );
    }
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow border-muted">
      {/* Status indicator strip on top */}
      <div className={`h-1 w-full ${statusColors.bg}`}></div>
      
      <CardContent className="p-5 pt-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}
          >
            {statusLabel}
          </span>
          <span className="text-xs text-muted-foreground flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {timeAgo}
          </span>
        </div>
        
        <h3 className="text-lg font-heading font-semibold mb-2 line-clamp-1">{project.title}</h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {project.description}
        </p>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-start">
            <CircleDollarSign className="h-4 w-4 mt-0.5 mr-2 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="text-sm font-medium">${project.quote.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Calendar className="h-4 w-4 mt-0.5 mr-2 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Timeline</p>
              <p className="text-sm font-medium">{project.timeline} weeks</p>
            </div>
          </div>
        </div>
        
        {/* Show progress for in-progress or under-review projects */}
        {(project.status === "in_progress" || project.status === "under_review") && (
          <div className="mb-1">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <div className="flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-muted-foreground" />
                <span className="text-muted-foreground">Progress</span>
              </div>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress 
              value={project.progress} 
              className="h-1.5" 
              indicatorColor={getProgressColor(project.progress)}
            />
          </div>
        )}
        
        {/* Payment status for projects with payment < 100% */}
        {project.paymentStatus < 100 && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className={`flex items-center ${paymentInfo.color}`}>
              <CircleDollarSign className="h-4 w-4 mr-1.5" />
              <span className="text-sm font-medium">{paymentInfo.label}</span>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="bg-muted/50 px-5 py-3 border-t border-border">
        {getActionButton()}
      </CardFooter>
    </Card>
  );
}
