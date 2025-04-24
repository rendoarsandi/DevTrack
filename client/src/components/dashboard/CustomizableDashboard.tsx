import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DashboardWidget } from './DashboardWidget';
import { DashboardWidgetPicker } from './DashboardWidgetPicker';
import { useWidgets, UserWidget, DashboardWidget as DashboardWidgetType } from '@hooks/use-widgets';
import { Pencil, Plus, Save, X } from 'lucide-react';
import { useToast } from '@hooks/use-toast';

export function CustomizableDashboard() {
  const { userWidgets, availableWidgets, isLoading, updateWidget } = useWidgets();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [orderedWidgets, setOrderedWidgets] = useState<UserWidget[]>([]);
  const { toast } = useToast();
  
  // Mengatur widgets dalam urutan berdasarkan posisi
  useEffect(() => {
    if (userWidgets) {
      setOrderedWidgets([...userWidgets].sort((a, b) => a.position - b.position));
    }
  }, [userWidgets]);
  
  // Mendapatkan dashboard widget berdasarkan ID
  const getDashboardWidget = (widgetId: number): DashboardWidgetType | undefined => {
    return availableWidgets?.find(widget => widget.id === widgetId);
  };
  
  // Handle perubahan posisi widget
  const handleMoveWidget = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === orderedWidgets.length - 1)
    ) {
      return;
    }
    
    const newWidgets = [...orderedWidgets];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Tukar posisi
    [newWidgets[index], newWidgets[targetIndex]] = [newWidgets[targetIndex], newWidgets[index]];
    
    // Update posisi dalam array
    newWidgets.forEach((widget, idx) => {
      widget.position = idx;
    });
    
    setOrderedWidgets(newWidgets);
  };
  
  // Simpan perubahan posisi ke database
  const savePositions = () => {
    // Update posisi setiap widget
    orderedWidgets.forEach(widget => {
      updateWidget({
        id: widget.id,
        data: { position: widget.position }
      });
    });
    
    setIsEditMode(false);
    toast({
      title: "Dashboard tersimpan",
      description: "Perubahan pada dashboard Anda telah disimpan",
    });
  };
  
  // ID dari widget yang sudah ada di dashboard
  const currentWidgetIds = orderedWidgets.map(widget => widget.widgetId);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">Memuat dashboard...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard Saya</h2>
        
        <div className="flex space-x-2">
          {isEditMode ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditMode(false)}>
                <X className="h-4 w-4 mr-1" /> Batal
              </Button>
              <Button variant="default" size="sm" onClick={savePositions}>
                <Save className="h-4 w-4 mr-1" /> Simpan
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsPickerOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" /> Tambah Widget
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => setIsEditMode(true)}
              >
                <Pencil className="h-4 w-4 mr-1" /> Edit Dashboard
              </Button>
            </>
          )}
        </div>
      </div>
      
      {orderedWidgets.length === 0 ? (
        <div className="bg-muted p-8 rounded-lg text-center">
          <p className="text-muted-foreground mb-4">
            Dashboard Anda masih kosong. Tambahkan widget untuk mulai memantau proyek Anda.
          </p>
          <Button onClick={() => setIsPickerOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Tambah Widget Pertama
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-4">
          {orderedWidgets.map((widget, index) => {
            const dashboardWidget = getDashboardWidget(widget.widgetId);
            
            return (
              <DashboardWidget
                key={widget.id}
                widget={widget}
                dashboardWidget={dashboardWidget}
                onMove={isEditMode ? (direction) => handleMoveWidget(index, direction) : undefined}
                isFirst={index === 0}
                isLast={index === orderedWidgets.length - 1}
                isEditMode={isEditMode}
              />
            );
          })}
        </div>
      )}
      
      <DashboardWidgetPicker 
        open={isPickerOpen} 
        onOpenChange={setIsPickerOpen} 
        currentWidgetIds={currentWidgetIds}
      />
    </div>
  );
}