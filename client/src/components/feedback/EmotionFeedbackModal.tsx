import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { EmotionSlider, EmotionFeedback } from './EmotionSlider';

interface EmotionFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: number;
  onSubmit?: (feedback: EmotionFeedback) => void;
}

export function EmotionFeedbackModal({
  open,
  onOpenChange,
  projectId,
  onSubmit
}: EmotionFeedbackModalProps) {
  
  const handleSubmit = (feedback: EmotionFeedback) => {
    if (onSubmit) onSubmit(feedback);
    onOpenChange(false);
  };
  
  const handleCancel = () => {
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <EmotionSlider 
          projectId={projectId}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}