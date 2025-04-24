import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// Tipe untuk DashboardWidget dari server
export interface DashboardWidget {
  id: number;
  name: string;
  description: string;
  type: string;
  icon: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultConfig: any;
  availableToRoles: string[];
  createdAt: string;
  updatedAt: string;
}

// Tipe untuk UserWidget dari server
export interface UserWidget {
  id: number;
  userId: number;
  widgetId: number;
  position: number;
  gridX: number;
  gridY: number;
  width: number;
  height: number;
  config: any;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  widget?: DashboardWidget; // Widget definition (optional, for expanded view)
}

// Tipe untuk menambahkan widget baru
export interface AddWidgetInput {
  widgetId: number;
  position: number;
  gridX: number;
  gridY: number;
  width?: number;
  height?: number;
  config?: any;
}

// Tipe untuk mengupdate widget
export interface UpdateWidgetInput {
  position?: number;
  gridX?: number;
  gridY?: number;
  width?: number;
  height?: number;
  config?: any;
  isVisible?: boolean;
}

// Hook untuk mendapatkan semua widget yang tersedia
export const useAvailableWidgets = () => {
  return useQuery({
    queryKey: ['/api/dashboard-widgets'],
    staleTime: 1000 * 60 * 10, // 10 menit
  });
};

// Hook untuk mendapatkan widget yang dimiliki oleh user
export const useUserWidgets = () => {
  return useQuery({
    queryKey: ['/api/user-widgets'],
    staleTime: 1000 * 60 * 5, // 5 menit
  });
};

// Hook untuk menambahkan widget baru ke dashboard user
export const useAddWidget = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (widgetData: AddWidgetInput) => 
      apiRequest('/api/user-widgets', {
        method: 'POST',
        body: JSON.stringify(widgetData)
      }),
    onSuccess: () => {
      // Invalidate cache setelah berhasil menambahkan widget
      queryClient.invalidateQueries({ queryKey: ['/api/user-widgets'] });
      toast({
        title: 'Widget ditambahkan',
        description: 'Widget berhasil ditambahkan ke dashboard Anda',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Gagal menambahkan widget',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat menambahkan widget',
        variant: 'destructive',
      });
    }
  });
};

// Hook untuk memperbarui widget
export const useUpdateWidget = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: UpdateWidgetInput }) => 
      apiRequest(`/api/user-widgets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      // Invalidate cache setelah berhasil mengupdate widget
      queryClient.invalidateQueries({ queryKey: ['/api/user-widgets'] });
      toast({
        title: 'Widget diperbarui',
        description: 'Perubahan berhasil disimpan',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Gagal memperbarui widget',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat memperbarui widget',
        variant: 'destructive',
      });
    }
  });
};

// Hook untuk menghapus widget
export const useDeleteWidget = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/user-widgets/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      // Invalidate cache setelah berhasil menghapus widget
      queryClient.invalidateQueries({ queryKey: ['/api/user-widgets'] });
      toast({
        title: 'Widget dihapus',
        description: 'Widget berhasil dihapus dari dashboard Anda',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Gagal menghapus widget',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat menghapus widget',
        variant: 'destructive',
      });
    }
  });
};

// Hook untuk menggunakan semua fungsionalitas widget
export const useWidgets = () => {
  const [isAddingWidget, setIsAddingWidget] = useState(false);

  // Queries
  const availableWidgetsQuery = useAvailableWidgets();
  const userWidgetsQuery = useUserWidgets();
  
  // Mutations
  const addWidgetMutation = useAddWidget();
  const updateWidgetMutation = useUpdateWidget();
  const deleteWidgetMutation = useDeleteWidget();
  
  return {
    // Queries
    availableWidgets: availableWidgetsQuery.data as DashboardWidget[] | undefined,
    userWidgets: userWidgetsQuery.data as UserWidget[] | undefined,
    isLoading: availableWidgetsQuery.isLoading || userWidgetsQuery.isLoading,
    isError: availableWidgetsQuery.isError || userWidgetsQuery.isError,
    
    // Mutations
    addWidget: addWidgetMutation.mutate,
    updateWidget: updateWidgetMutation.mutate,
    deleteWidget: deleteWidgetMutation.mutate,
    isAddingWidget,
    setIsAddingWidget,
    
    // Mutation states
    isAdding: addWidgetMutation.isPending,
    isUpdating: updateWidgetMutation.isPending,
    isDeleting: deleteWidgetMutation.isPending,
  };
};