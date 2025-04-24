import React, { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { SmilePlus } from 'lucide-react';
import { EmotionFeedbackModal } from './EmotionFeedbackModal';
import { EmotionFeedback } from './EmotionSlider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface EmotionFeedbackButtonProps extends Omit<ButtonProps, 'onClick'> {
  projectId?: number;
  onFeedbackSubmit?: (feedback: EmotionFeedback) => void;
  tooltipText?: string;
  buttonText?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
}

export function EmotionFeedbackButton({
  projectId,
  onFeedbackSubmit,
  tooltipText = 'Share how you feel about this',
  buttonText = 'Quick Feedback',
  variant = 'outline',
  size = 'default',
  showIcon = true,
  className,
  ...props
}: EmotionFeedbackButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleClick = () => {
    setIsModalOpen(true);
  };
  
  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              onClick={handleClick}
              className={cn(className)}
              {...props}
            >
              {showIcon && <SmilePlus className="h-4 w-4 mr-2" />}
              {buttonText}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <EmotionFeedbackModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        projectId={projectId}
        onSubmit={onFeedbackSubmit}
      />
    </>
  );
}