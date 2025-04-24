import React, { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  ThumbsUp,
  Smile,
  Meh,
  Frown,
  ThumbsDown,
  Send,
  HelpCircle,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface EmotionFeedback {
  satisfaction: number;   // Overall satisfaction (0-100)
  usability: number;      // Ease of use (0-100)
  design: number;         // Visual design appeal (0-100)
  performance: number;    // Speed and performance (0-100)
  comment?: string;       // Optional text feedback
  projectId?: number;     // Optional project ID if related to a specific project
}

interface EmotionSliderProps {
  projectId?: number;
  onSubmit?: (feedback: EmotionFeedback) => void;
  onCancel?: () => void;
  className?: string;
}

export function EmotionSlider({ projectId, onSubmit, onCancel, className }: EmotionSliderProps) {
  const { toast } = useToast();
  
  const [feedback, setFeedback] = useState<EmotionFeedback>({
    satisfaction: 50,
    usability: 50,
    design: 50,
    performance: 50,
    projectId: projectId,
  });
  
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Helper to get emoji based on value
  const getEmotionIcon = (value: number, size: number = 20) => {
    if (value < 20) return <ThumbsDown size={size} className="text-red-500" />;
    if (value < 40) return <Frown size={size} className="text-orange-500" />;
    if (value < 60) return <Meh size={size} className="text-yellow-500" />;
    if (value < 80) return <Smile size={size} className="text-green-500" />;
    return <ThumbsUp size={size} className="text-emerald-500" />;
  };
  
  const handleSliderChange = (name: keyof EmotionFeedback, value: number[]) => {
    setFeedback(prev => ({ ...prev, [name]: value[0] }));
  };
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const finalFeedback = { ...feedback, comment };
      
      const response = await apiRequest('/api/feedback/emotion', {
        method: 'POST',
        body: JSON.stringify(finalFeedback),
      });
      
      console.log('Feedback submission response:', response);
      
      toast({
        title: 'Feedback submitted',
        description: 'Thank you for sharing your thoughts!',
        variant: 'default',
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      // Reset form or provide success state
      if (onSubmit) onSubmit(finalFeedback);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      
      let errorMessage = 'There was an error submitting your feedback. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Submission failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">How do you feel about this?</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Drag the sliders to rate different aspects of your experience</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>
          Please share your feelings about the current state of the project
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Satisfaction */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Overall Satisfaction</label>
            <div className="flex items-center space-x-1">
              {getEmotionIcon(feedback.satisfaction)}
              <span className="text-sm">{feedback.satisfaction}%</span>
            </div>
          </div>
          <Slider
            value={[feedback.satisfaction]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => handleSliderChange('satisfaction', value)}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Very unsatisfied</span>
            <span>Neutral</span>
            <span>Very satisfied</span>
          </div>
        </div>
        
        {/* Usability */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Ease of Use</label>
            <div className="flex items-center space-x-1">
              {getEmotionIcon(feedback.usability)}
              <span className="text-sm">{feedback.usability}%</span>
            </div>
          </div>
          <Slider
            value={[feedback.usability]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => handleSliderChange('usability', value)}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Difficult</span>
            <span>Moderate</span>
            <span>Very easy</span>
          </div>
        </div>
        
        {/* Visual Design */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Visual Design</label>
            <div className="flex items-center space-x-1">
              {getEmotionIcon(feedback.design)}
              <span className="text-sm">{feedback.design}%</span>
            </div>
          </div>
          <Slider
            value={[feedback.design]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => handleSliderChange('design', value)}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Poor design</span>
            <span>Acceptable</span>
            <span>Beautiful</span>
          </div>
        </div>
        
        {/* Performance */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Performance & Speed</label>
            <div className="flex items-center space-x-1">
              {getEmotionIcon(feedback.performance)}
              <span className="text-sm">{feedback.performance}%</span>
            </div>
          </div>
          <Slider
            value={[feedback.performance]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => handleSliderChange('performance', value)}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Very slow</span>
            <span>Acceptable</span>
            <span>Very fast</span>
          </div>
        </div>
        
        {/* Comments */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Additional Comments (optional)</label>
          <textarea
            className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background"
            placeholder="Share any additional thoughts or suggestions..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button 
          className="ml-auto" 
          onClick={handleSubmit} 
          disabled={isSubmitting}
        >
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </CardFooter>
    </Card>
  );
}