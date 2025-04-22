import { formatDistanceToNow } from "date-fns";
import { CodeIcon, DollarSign, MessageSquare, FileText } from "lucide-react";
import { Activity } from "@shared/schema";

interface ActivityItemProps {
  activity: Activity;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  // Get icon and color based on activity type
  const getIconAndColor = () => {
    switch (activity.type) {
      case "commit":
        return {
          bgColor: "bg-blue-100",
          icon: <CodeIcon className="text-primary" />
        };
      case "payment":
        return {
          bgColor: "bg-green-100",
          icon: <DollarSign className="text-secondary" />
        };
      case "feedback":
        return {
          bgColor: "bg-yellow-100",
          icon: <MessageSquare className="text-yellow-600" />
        };
      case "quotation":
        return {
          bgColor: "bg-purple-100",
          icon: <FileText className="text-purple-600" />
        };
      default:
        return {
          bgColor: "bg-gray-100",
          icon: <FileText className="text-gray-600" />
        };
    }
  };

  // Format activity content title
  const getActivityTitle = () => {
    switch (activity.type) {
      case "commit":
        return "New commit pushed";
      case "payment":
        return "Payment updated";
      case "feedback":
        return "New feedback submitted";
      case "quotation":
        return activity.content;
      default:
        return activity.content;
    }
  };

  // Format activity details (only for some types)
  const getActivityDetails = () => {
    if (activity.type === "commit") {
      return (
        <p className="text-xs text-muted-foreground font-mono mt-1">
          {activity.content}
        </p>
      );
    } else if (activity.type === "feedback" || activity.type === "payment") {
      return (
        <p className="text-xs text-muted-foreground mt-1">
          {activity.content}
        </p>
      );
    }
    return null;
  };

  // Format relative time
  const timeAgo = formatDistanceToNow(new Date(activity.createdAt), {
    addSuffix: true,
  });

  const { bgColor, icon } = getIconAndColor();

  return (
    <li className="p-4 hover:bg-muted">
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-4">
          <div className={`h-10 w-10 rounded-full ${bgColor} flex items-center justify-center`}>
            {icon}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            {getActivityTitle()}
          </p>
          {getActivityDetails()}
          <p className="text-xs text-muted-foreground mt-1">
            {timeAgo}
          </p>
        </div>
      </div>
    </li>
  );
}
