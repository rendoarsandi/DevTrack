import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmotionFeedbackButton, EmotionSlider, EmotionFeedback } from '@/components/feedback';
import { useToast } from '@/hooks/use-toast';

export default function PublicFeedbackPage() {
  const { toast } = useToast();
  const [directFeedbackVisible, setDirectFeedbackVisible] = useState(false);

  const handleDirectFeedbackToggle = () => {
    setDirectFeedbackVisible(!directFeedbackVisible);
  };

  const handleFeedbackSubmit = (feedback: EmotionFeedback) => {
    toast({
      title: 'Feedback Submitted',
      description: `Thank you for your feedback! Satisfaction: ${feedback.satisfaction}%`,
    });
    
    // Hide the direct feedback form after submission
    if (directFeedbackVisible) {
      setDirectFeedbackVisible(false);
    }
  };

  return (
    <div className="container py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">Quick Feedback</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Card explaining the concept */}
        <Card>
          <CardHeader>
            <CardTitle>About Emotion Feedback</CardTitle>
            <CardDescription>
              We've implemented a simple yet powerful way to collect user sentiment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              The Quick Feedback Emotion Sliders provide an intuitive way for users to express 
              how they feel about different aspects of a product or service. This helps gather 
              more nuanced feedback compared to simple star ratings.
            </p>
            <p className="text-muted-foreground mb-4">
              Users can rate their satisfaction, the usability, the design, and the performance 
              using simple sliders that translate emotions into data.
            </p>
            <div className="flex space-x-4 mt-6">
              <EmotionFeedbackButton 
                onFeedbackSubmit={handleFeedbackSubmit}
                buttonText="Quick Feedback Modal"
                variant="default"
              />
              <Button 
                variant="outline"
                onClick={handleDirectFeedbackToggle}
              >
                {directFeedbackVisible ? 'Hide Direct Feedback' : 'Show Direct Feedback'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card showing implementation options */}
        <Card>
          <CardHeader>
            <CardTitle>Implementation Options</CardTitle>
            <CardDescription>
              Multiple ways to integrate emotion feedback into your application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
              <li>
                <strong>Modal Popup:</strong> Trigger the feedback form from anywhere using the EmotionFeedbackButton
              </li>
              <li>
                <strong>Direct Embedding:</strong> Embed the EmotionSlider component directly in your pages
              </li>
              <li>
                <strong>Project Association:</strong> Link feedback to specific projects by passing the projectId
              </li>
              <li>
                <strong>Custom Styling:</strong> All components support custom styling via className props
              </li>
              <li>
                <strong>Callback Integration:</strong> Use onSubmit callbacks to handle feedback data custom logic
              </li>
            </ul>
            
            <div className="mt-6 border rounded p-4 bg-muted/20">
              <code className="text-xs">
                {`<EmotionFeedbackButton
  projectId={123}
  onFeedbackSubmit={handleFeedback}
  buttonText="Rate your experience"
  variant="default"
/>`}
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Direct feedback form */}
      {directFeedbackVisible && (
        <div className="mt-8">
          <EmotionSlider 
            onSubmit={handleFeedbackSubmit}
            onCancel={() => setDirectFeedbackVisible(false)}
          />
        </div>
      )}
    </div>
  );
}