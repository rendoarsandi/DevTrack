import { useQuery, useMutation } from '@tanstack/react-query';
import { Notification } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function useNotifications() {
  const { toast } = useToast();
  
  const { 
    data: notifications, 
    isLoading, 
    error 
  } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    staleTime: 30000, // 30 seconds
  });
  
  const { 
    data: unreadCount = 0, 
    isLoading: isCountLoading 
  } = useQuery<{count: number}>({
    queryKey: ['/api/notifications/unread-count'],
    staleTime: 30000, // 30 seconds
    select: (data) => data.count,
  });
  
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest('PATCH', `/api/notifications/${notificationId}`, {
        isRead: true
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/notifications']});
      queryClient.invalidateQueries({queryKey: ['/api/notifications/unread-count']});
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to mark notification as read: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/notifications/mark-all-read', {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/notifications']});
      queryClient.invalidateQueries({queryKey: ['/api/notifications/unread-count']});
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to mark all notifications as read: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  return {
    notifications: notifications || [],
    unreadCount,
    isLoading: isLoading || isCountLoading,
    error,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
}