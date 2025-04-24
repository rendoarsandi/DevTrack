import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Activity, 
  Percent, 
  History, 
  Calendar, 
  CreditCard, 
  DollarSign, 
  MessageCircle, 
  CheckSquare, 
  ExternalLink, 
  BarChart2 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DashboardWidget, AddWidgetInput, useWidgets } from '@/hooks/use-widgets';

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

interface DashboardWidgetPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentWidgetIds?: number[]; // IDs widget yang sudah ada di dashboard
}

export function DashboardWidgetPicker({ open, onOpenChange, currentWidgetIds = [] }: DashboardWidgetPickerProps) {
  const { availableWidgets, userWidgets, addWidget, isAdding } = useWidgets();
  
  // Mendapatkan widget yang belum ditambahkan ke dashboard user
  const availableToAdd = availableWidgets?.filter(
    widget => !currentWidgetIds.includes(widget.id)
  ) || [];
  
  const handleAddWidget = (widget: DashboardWidget) => {
    // Cari posisi terakhir untuk menentukan posisi baru
    const lastPosition = userWidgets && userWidgets.length > 0 
      ? Math.max(...userWidgets.map(w => w.position)) 
      : -1;
    
    const newWidget: AddWidgetInput = {
      widgetId: widget.id,
      position: lastPosition + 1,
      gridX: 0,
      gridY: 0,
      width: widget.defaultWidth,
      height: widget.defaultHeight,
      config: widget.defaultConfig,
    };
    
    addWidget(newWidget);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pilih Widget untuk Dashboard Anda</DialogTitle>
        </DialogHeader>
        
        {availableToAdd.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Semua widget sudah ditambahkan ke dashboard Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {availableToAdd.map(widget => {
              const IconComponent = iconMap[widget.icon] || Activity;
              
              return (
                <Card key={widget.id} className="cursor-pointer hover:border-primary transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <IconComponent className="w-4 h-4 text-primary" />
                        <CardTitle className="text-sm">{widget.name}</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {widget.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {widget.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex justify-end">
                      <Button 
                        size="sm" 
                        onClick={() => handleAddWidget(widget)}
                        disabled={isAdding}
                      >
                        Tambahkan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}