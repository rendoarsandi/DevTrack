import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Project } from "@shared/schema";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  // Status Badge Component
  const StatusBadge = ({ status }: { status: string }) => {
    let bgColor = "";
    let textColor = "";
    let label = "";

    switch (status) {
      case "awaiting_dp":
        bgColor = "bg-yellow-100";
        textColor = "text-yellow-800";
        label = "Awaiting DP";
        break;
      case "in_progress":
        bgColor = "bg-blue-100";
        textColor = "text-blue-800";
        label = "In Progress";
        break;
      case "under_review":
        bgColor = "bg-purple-100";
        textColor = "text-purple-800";
        label = "Under Review";
        break;
      case "completed":
        bgColor = "bg-green-100";
        textColor = "text-green-800";
        label = "Completed";
        break;
      default:
        bgColor = "bg-gray-100";
        textColor = "text-gray-800";
        label = status;
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
      >
        {label}
      </span>
    );
  };

  // Format relative time
  const timeAgo = formatDistanceToNow(new Date(project.createdAt), {
    addSuffix: true,
  });

  // Calculate payment status label
  const getPaymentStatusButton = () => {
    if (project.paymentStatus === 0) {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="text-secondary font-medium"
          asChild
        >
          <Link href={`/projects/${project.id}`}>Pay Deposit</Link>
        </Button>
      );
    } else if (project.status === "completed" && project.paymentStatus < 100) {
      return (
        <Button
          variant="ghost" 
          size="sm"
          className="text-secondary font-medium"
          asChild
        >
          <Link href={`/projects/${project.id}`}>Complete Payment</Link>
        </Button>
      );
    } else if (project.status === "under_review") {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="text-accent font-medium"
          asChild
        >
          <Link href={`/projects/${project.id}`}>Berikan Review</Link>
        </Button>
      );
    } else if (project.status === "completed") {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="text-secondary font-medium"
          asChild
        >
          <Link href={`/projects/${project.id}`}>View Deployment</Link>
        </Button>
      );
    } else {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground font-medium"
          asChild
        >
          <Link href={`/projects/${project.id}`}>GitHub</Link>
        </Button>
      );
    }
  };

  return (
    <Card className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="p-5 flex-1">
        <div className="flex items-center justify-between mb-4">
          <StatusBadge status={project.status} />
          <span className="text-xs text-muted-foreground">
            {project.status === "completed" ? "Completed" : "Created"} {timeAgo}
          </span>
        </div>
        
        <h3 className="text-lg font-heading font-semibold mb-2">{project.title}</h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {project.description}
        </p>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Quote</span>
            <span className="font-medium">${project.quote.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Timeline</span>
            <span className="font-medium">{project.timeline} weeks</span>
          </div>
        </div>
        
        {(project.status === "in_progress" || project.status === "under_review") && (
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
        )}
      </div>
      
      <div className="bg-muted px-5 py-3 border-t border-border flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="text-primary font-medium"
          asChild
        >
          <Link href={`/projects/${project.id}`}>View Details</Link>
        </Button>
        {getPaymentStatusButton()}
      </div>
    </Card>
  );
}
