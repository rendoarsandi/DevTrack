import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, CheckCircle, Circle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Milestone } from "@shared/schema";
import * as z from "zod";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type ProjectTimelineProps = {
  projectId: number;
};

// Form schema for creating/editing milestones
const milestoneFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
});

type MilestoneFormValues = z.infer<typeof milestoneFormSchema>;

export function ProjectTimeline({ projectId }: ProjectTimelineProps) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Fetch milestones for the project
  const { data: milestones, isLoading } = useQuery<Milestone[]>({
    queryKey: ['/api/projects', projectId, 'milestones'],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/milestones`);
      if (!response.ok) {
        throw new Error('Failed to fetch milestones');
      }
      return response.json();
    },
    enabled: !!projectId,
  });
  
  // Form for adding new milestones
  const form = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneFormSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });
  
  // Mutation for creating a new milestone
  const createMilestoneMutation = useMutation({
    mutationFn: async (values: MilestoneFormValues) => {
      const response = await apiRequest('POST', `/api/projects/${projectId}/milestones`, values);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'milestones'] });
      toast({
        title: "Milestone added",
        description: "The milestone has been added successfully",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to add milestone",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for updating a milestone
  const updateMilestoneMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      const response = await apiRequest('PATCH', `/api/projects/${projectId}/milestones/${id}`, {
        completed,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'milestones'] });
      toast({
        title: "Milestone updated",
        description: "The milestone has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update milestone",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: MilestoneFormValues) {
    createMilestoneMutation.mutate(data);
  }
  
  function toggleMilestoneStatus(milestone: Milestone) {
    updateMilestoneMutation.mutate({
      id: milestone.id,
      completed: !milestone.completed,
    });
  }

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Project Timeline</CardTitle>
          <CardDescription>Track your project progress with milestones</CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 gap-1">
              <Plus className="h-4 w-4" />
              <span>Add Milestone</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Milestone</DialogTitle>
              <DialogDescription>
                Create a new milestone to track progress on your project.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Design Approval" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what this milestone entails" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createMilestoneMutation.isPending}
                  >
                    {createMilestoneMutation.isPending ? "Adding..." : "Add Milestone"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : milestones && milestones.length > 0 ? (
          <div className="space-y-6">
            <div className="relative">
              <div className="absolute left-5 top-0 h-full w-px bg-border" />
              
              <div className="space-y-6">
                {milestones.map((milestone) => (
                  <div key={milestone.id} className="relative flex gap-5">
                    <button
                      className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background shadow-sm border"
                      onClick={() => toggleMilestoneStatus(milestone)}
                    >
                      {milestone.completed ? (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <h3 className={cn(
                          "text-sm font-medium",
                          milestone.completed && "line-through text-muted-foreground"
                        )}>
                          {milestone.title}
                        </h3>
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          {milestone.completed ? "Completed" : format(new Date(milestone.dueDate), "MMM d, yyyy")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{milestone.description}</p>
                      {milestone.completed && milestone.completedAt && (
                        <p className="text-xs text-muted-foreground">
                          Completed on {format(new Date(milestone.completedAt), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              No milestones have been added to this project yet.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Create your first milestone
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}