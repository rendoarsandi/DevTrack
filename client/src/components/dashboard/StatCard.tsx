import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  icon: ReactNode;
  iconBgColor: string;
  iconColor: string;
  title: string;
  value: string | number;
}

export function StatCard({
  icon,
  iconBgColor,
  iconColor,
  title,
  value,
}: StatCardProps) {
  return (
    <Card className="p-5 border border-border">
      <div className="flex items-center">
        <div
          className={`flex-shrink-0 rounded-md p-3 ${iconBgColor}`}
        >
          <div className={`h-6 w-6 ${iconColor}`}>{icon}</div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-muted-foreground truncate">{title}</dt>
            <dd>
              <div className="text-lg font-bold text-foreground">{value}</div>
            </dd>
          </dl>
        </div>
      </div>
    </Card>
  );
}
