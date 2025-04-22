import { formatDistanceToNow } from "date-fns";
import { 
  GitCommit, 
  CreditCard, 
  MessageSquare, 
  FileText, 
  Bell, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  CheckSquare,
  BarChart3
} from "lucide-react";
import { Activity } from "@shared/schema";

interface ActivityItemProps {
  activity: Activity;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  // Get icon, colors, and label based on activity type
  const getActivityConfig = () => {
    switch (activity.type) {
      case "commit":
        return {
          bgColor: "bg-blue-100",
          textColor: "text-blue-700",
          borderColor: "border-blue-200",
          icon: <GitCommit className="h-4 w-4" />,
          label: "Code Update"
        };
      case "payment":
        return {
          bgColor: "bg-green-100",
          textColor: "text-green-700",
          borderColor: "border-green-200",
          icon: <CreditCard className="h-4 w-4" />,
          label: "Payment"
        };
      case "feedback":
        return {
          bgColor: "bg-amber-100",
          textColor: "text-amber-700",
          borderColor: "border-amber-200",
          icon: <MessageSquare className="h-4 w-4" />,
          label: "Feedback"
        };
      case "quotation":
        return {
          bgColor: "bg-purple-100",
          textColor: "text-purple-700",
          borderColor: "border-purple-200",
          icon: <FileText className="h-4 w-4" />,
          label: "Quotation"
        };
      case "status_change":
        if (activity.content.includes("completed")) {
          return {
            bgColor: "bg-green-100",
            textColor: "text-green-700",
            borderColor: "border-green-200",
            icon: <CheckCircle className="h-4 w-4" />,
            label: "Completed"
          };
        } else if (activity.content.includes("under_review")) {
          return {
            bgColor: "bg-purple-100",
            textColor: "text-purple-700",
            borderColor: "border-purple-200",
            icon: <CheckSquare className="h-4 w-4" />,
            label: "Review"
          };
        } else if (activity.content.includes("in_progress")) {
          return {
            bgColor: "bg-blue-100",
            textColor: "text-blue-700",
            borderColor: "border-blue-200",
            icon: <BarChart3 className="h-4 w-4" />,
            label: "In Progress"
          };
        } else {
          return {
            bgColor: "bg-slate-100",
            textColor: "text-slate-700",
            borderColor: "border-slate-200",
            icon: <RefreshCw className="h-4 w-4" />,
            label: "Status Update"
          };
        }
      default:
        return {
          bgColor: "bg-slate-100",
          textColor: "text-slate-700",
          borderColor: "border-slate-200",
          icon: <Bell className="h-4 w-4" />,
          label: "Update"
        };
    }
  };

  // Format activity content title
  const getActivityTitle = () => {
    switch (activity.type) {
      case "commit":
        return "New code update committed";
      case "payment":
        return "Payment processed";
      case "feedback":
        return "Feedback received";
      case "status_change":
        if (activity.content.includes("completed")) {
          return "Project marked as Completed";
        } else if (activity.content.includes("under_review")) {
          return "Project submitted for review";
        } else if (activity.content.includes("in_progress")) {
          return "Project development started";
        } else if (activity.content.includes("awaiting_dp")) {
          return "Waiting for payment to begin";
        } else {
          return "Project status updated";
        }
      case "quotation":
        return "Quote updated";
      default:
        return activity.content;
    }
  };

  // Format activity details (only for some types)
  const getActivityDetails = () => {
    if (activity.type === "commit") {
      return (
        <p className="text-xs text-muted-foreground font-mono mt-1 line-clamp-1">
          {activity.content}
        </p>
      );
    } else if (activity.type === "feedback" || activity.type === "payment") {
      return (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {activity.content}
        </p>
      );
    } else if (activity.type === "status_change" && activity.content.includes("changed from")) {
      const statusMatches = activity.content.match(/from (.+?) to (.+?)($|\s)/);
      if (statusMatches && statusMatches.length >= 3) {
        const fromStatus = statusMatches[1].replace(/_/g, ' ');
        const toStatus = statusMatches[2].replace(/_/g, ' ');
        return (
          <p className="text-xs text-muted-foreground mt-1 flex items-center">
            <span className="capitalize">{fromStatus}</span>
            <ArrowRight className="inline h-3 w-3 mx-1.5" />
            <span className="capitalize font-medium">{toStatus}</span>
          </p>
        );
      }
    }
    return null;
  };

  // Format relative time
  const timeAgo = formatDistanceToNow(new Date(activity.createdAt), {
    addSuffix: true,
  });

  const { bgColor, textColor, borderColor, icon, label } = getActivityConfig();

  return (
    <li className="px-4 py-3 hover:bg-muted/50 transition-colors">
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          <div className={`h-8 w-8 rounded-full ${bgColor} flex items-center justify-center ${textColor}`}>
            {icon}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex justify-between items-start mb-0.5">
            <p className="text-sm font-medium text-foreground">
              {getActivityTitle()}
            </p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full border ${borderColor} ${bgColor} ${textColor} ml-2 whitespace-nowrap`}>
              {label}
            </span>
          </div>
          {getActivityDetails()}
          <p className="text-xs text-muted-foreground mt-1 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {timeAgo}
          </p>
        </div>
      </div>
    </li>
  );
}
