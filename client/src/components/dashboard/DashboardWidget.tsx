import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Draggable } from '@/components/ui/draggable';
import { 
  Pencil, 
  X, 
  Trash2, 
  Maximize2, 
  Minimize2, 
  GripVertical,
  Activity,
  Percent,
  History,
  Calendar,
  CreditCard,
  DollarSign,
  MessageCircle,
  CheckSquare,
  ExternalLink,
  BarChart2,
  Icon as LucideIcon
} from 'lucide-react';
import { UserWidget, useUpdateWidget, useDeleteWidget } from '@/hooks/use-widgets';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// Map tipe widget ke ikon
const iconMap: Record<string, any> = {
  'activity': Activity,
  'percent': Percent,
  'history': History,
  'calendar': Calendar,
  'credit-card': CreditCard,
  'dollar-sign': DollarSign,
  'message-circle': MessageCircle,
  'check-square': CheckSquare,
  'external-link': ExternalLink,
  'bar-chart-2': BarChart2,
};

interface DashboardWidgetProps {
  widget: UserWidget;
  dashboardWidget: any; // Detail widget dari dashboard_widgets
  onMove?: (direction: 'up' | 'down') => void;
  isFirst?: boolean;
  isLast?: boolean;
  isEditMode?: boolean;
}

export function DashboardWidget({ 
  widget, 
  dashboardWidget, 
  onMove, 
  isFirst, 
  isLast, 
  isEditMode = false 
}: DashboardWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmDelete, setIsConfirmDelete] = useState(false);
  
  const { mutate: updateWidget } = useUpdateWidget();
  const { mutate: deleteWidget } = useDeleteWidget();
  
  // Mendapatkan komponen ikon yang sesuai dari iconMap
  const IconComponent = iconMap[dashboardWidget?.icon] || Activity;
  
  const handleWidgetEdit = () => {
    setIsEditing(true);
  };
  
  const handleWidgetDelete = () => {
    setIsConfirmDelete(true);
  };
  
  const confirmDelete = () => {
    deleteWidget(widget.id);
    setIsConfirmDelete(false);
  };
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    
    // Update ukuran widget dalam database
    updateWidget({
      id: widget.id,
      data: {
        width: isExpanded ? widget.width : widget.width + 1,
        height: isExpanded ? widget.height : widget.height + 1,
      }
    });
  };
  
  // Menentukan kelas CSS untuk ukuran
  const widgetSizeClass = `col-span-${widget.width} row-span-${widget.height}`;
  
  return (
    <>
      <Card className={cn(
        "transition-all duration-200", 
        widgetSizeClass,
        isEditMode && "border-dashed border-2 cursor-move"
      )}>
        <CardHeader className="pb-2 relative">
          {isEditMode && (
            <div className="absolute -top-3 -left-3 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center">
              <GripVertical className="w-4 h-4" />
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <IconComponent className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm">{dashboardWidget?.name}</CardTitle>
            </div>
            
            <div className="flex space-x-1">
              {isEditMode && (
                <>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleWidgetEdit}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleWidgetDelete}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0" 
                onClick={toggleExpand}
              >
                {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
              </Button>
            </div>
          </div>
          
          <CardDescription className="text-xs">
            {dashboardWidget?.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Placeholder content - to be replaced with actual widget content */}
          <div className="text-center py-4 text-muted-foreground">
            {dashboardWidget?.type === 'project_status' ? (
              <div className="text-center">
                <div className="text-2xl font-bold">Completed</div>
                <div className="text-sm">Last updated: Today</div>
              </div>
            ) : dashboardWidget?.type === 'project_progress' ? (
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-4 rounded-full mt-2">
                <div 
                  className="bg-primary h-4 rounded-full" 
                  style={{ width: '70%' }}
                >
                  <span className="text-xs text-white px-2">70%</span>
                </div>
              </div>
            ) : (
              <p className="text-sm">Widget content will appear here</p>
            )}
          </div>
        </CardContent>
        
        {onMove && isEditMode && (
          <CardFooter className="pt-0 flex justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onMove('up')} 
              disabled={isFirst}
            >
              Move Up
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onMove('down')} 
              disabled={isLast}
            >
              Move Down
            </Button>
          </CardFooter>
        )}
      </Card>
    
      {/* Confirm delete dialog */}
      <Dialog open={isConfirmDelete} onOpenChange={setIsConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Widget</DialogTitle>
          </DialogHeader>
          <p>Apakah Anda yakin ingin menghapus widget {dashboardWidget?.name} dari dashboard?</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsConfirmDelete(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit widget dialog - to be implemented */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Widget</DialogTitle>
          </DialogHeader>
          <p>Form untuk mengedit konfigurasi widget akan ditampilkan di sini.</p>
          <DialogFooter>
            <Button onClick={() => setIsEditing(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}