import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { memo } from "react";

type NotificationIndicatorProps = {
  notifications: any[];
  unreadCount: number;
};

export default memo(function NotificationIndicator({
  notifications,
  unreadCount,
}: NotificationIndicatorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] text-[10px] flex items-center justify-center"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2">
        <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length > 0 ? (
          notifications.slice(0, 5).map((notification: any) => (
            <DropdownMenuItem key={notification.id} className="p-3">
              <div className="flex flex-col space-y-1">
                <span className="font-medium text-sm">{notification.title}</span>
                <span className="text-xs text-muted-foreground">
                  {notification.content}
                </span>
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <div className="py-3 px-2 text-center text-sm text-muted-foreground">
            Tidak ada notifikasi
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/dashboard">
            <div className="w-full text-center text-sm text-primary font-medium">
              Lihat Semua Notifikasi
            </div>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});