import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CheckCircle, AlertTriangle, Star } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const feedbackSchema = z.object({
  content: z.string().min(10, "Feedback must be at least 10 characters"),
  rating: z.string().optional(),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

export default function PublicFeedback() {
  const [, navigate] = useLocation();
  const [success, setSuccess] = useState(false);
  
  // Extract token from URL
  const token = window.location.pathname.split("/").pop() || "";
  
  interface TokenValidationResponse {
    valid: boolean;
    message?: string;
    projectId?: number;
    projectTitle?: string;
    expiresAt?: string;
  }
  
  interface FeedbackResponse {
    message: string;
    feedback: any;
  }
  
  // Validate token
  const { data: tokenData, isLoading: isValidating, error: tokenError } = useQuery({
    queryKey: [`/api/public/feedback/${token}/validate`],
    queryFn: () => apiRequest<TokenValidationResponse>(`/api/public/feedback/${token}/validate`),
    retry: false,
  });
  
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      content: "",
      rating: undefined,
    },
  });
  
  const submitFeedback = useMutation({
    mutationFn: (values: FeedbackFormValues) => {
      return apiRequest<FeedbackResponse>(`/api/public/feedback/${token}`, {
        method: "POST",
        body: JSON.stringify({
          content: values.content,
          rating: values.rating,
        }),
      });
    },
    onSuccess: () => {
      setSuccess(true);
    },
  });
  
  const onSubmit = (values: FeedbackFormValues) => {
    submitFeedback.mutate(values);
  };
  
  // Show redirection message and navigate home after 3 seconds when success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate("/");
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);
  
  // Loading state
  if (isValidating) {
    return (
      <div className="container max-w-md mx-auto mt-16 px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Validating Feedback Link</CardTitle>
            <CardDescription>Please wait while we validate your feedback link</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Invalid token
  if (tokenError || (tokenData && !tokenData.valid)) {
    return (
      <div className="container max-w-md mx-auto mt-16 px-4">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Invalid Feedback Link</AlertTitle>
          <AlertDescription>
            {tokenData?.message || "This feedback link is invalid or has expired."}
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/")} className="w-full">
          Go to Homepage
        </Button>
      </div>
    );
  }
  
  // Success state
  if (success) {
    return (
      <div className="container max-w-md mx-auto mt-16 px-4">
        <Alert className="mb-4 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Thank You!</AlertTitle>
          <AlertDescription className="text-green-700">
            Your feedback has been submitted successfully. Redirecting you to the homepage in a few seconds...
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/")} className="w-full">
          Go to Homepage Now
        </Button>
      </div>
    );
  }
  
  // Feedback form
  return (
    <div className="container max-w-md mx-auto mt-8 px-4 mb-12">
      <Card>
        <CardHeader>
          <CardTitle>Project Feedback</CardTitle>
          <CardDescription>
            Please provide your feedback for project: {tokenData?.projectTitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>How would you rate your experience?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-1"
                      >
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <FormItem key={rating} className="flex flex-col items-center space-y-1">
                            <FormControl>
                              <RadioGroupItem
                                value={rating.toString()}
                                className="peer sr-only"
                                id={`rating-${rating}`}
                              />
                            </FormControl>
                            <FormLabel
                              htmlFor={`rating-${rating}`}
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  field.value === rating.toString()
                                    ? "fill-primary text-primary"
                                    : "text-muted-foreground"
                                }`}
                              />
                              <span className="text-xs mt-1">{rating}</span>
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormDescription>
                      Rating is optional but appreciated
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Feedback</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please share your thoughts, suggestions, or experiences with the project..."
                        className="min-h-[150px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={submitFeedback.isPending}
              >
                {submitFeedback.isPending ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Submitting...
                  </>
                ) : (
                  "Submit Feedback"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}