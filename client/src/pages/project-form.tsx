import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertProjectSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const projectSchema = insertProjectSchema.omit({ clientId: true }).extend({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  quote: z.coerce.number().min(100, "Quote must be at least $100"),
  timeline: z.coerce.number().min(1, "Timeline must be at least 1 week"),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function ProjectForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      quote: undefined,
      timeline: undefined,
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      const res = await apiRequest("POST", "/api/projects", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project created",
        description: "Your project request has been submitted successfully.",
      });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating project",
        description: error.message || "There was an error submitting your project. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: ProjectFormValues) {
    createProjectMutation.mutate(data);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Mobile Menu */}
      <MobileMenu />
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden md:ml-64">
        <main className="flex-1 relative overflow-y-auto focus:outline-none custom-scrollbar pt-16 md:pt-0">
          <div className="py-6">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="mb-6">
                <Button 
                  variant="ghost" 
                  className="mb-4" 
                  onClick={() => navigate("/")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
                <h1 className="text-2xl font-heading font-bold text-foreground">New Project Request</h1>
                <p className="text-muted-foreground">
                  Submit details for your new application development project
                </p>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                  <CardDescription>
                    Provide comprehensive information about your project to get an accurate quote and timeline.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Title</FormLabel>
                            <FormControl>
                              <Input placeholder="E.g., E-commerce Website, Mobile App, etc." {...field} />
                            </FormControl>
                            <FormDescription>
                              A short, descriptive name for your project
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your project requirements, features, and objectives in detail..." 
                                rows={6}
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Include as much detail as possible about functionality, design preferences, and any specific technologies
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="quote"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Budget (USD)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                                  <Input 
                                    type="number" 
                                    placeholder="1000" 
                                    className="pl-7" 
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Your estimated budget for this project
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="timeline"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Timeline (Weeks)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="4" {...field} />
                              </FormControl>
                              <FormDescription>
                                Expected project duration in weeks
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <CardFooter className="px-0 pt-6">
                        <Button 
                          type="submit" 
                          disabled={createProjectMutation.isPending}
                          className="ml-auto"
                        >
                          {createProjectMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit Project Request"
                          )}
                        </Button>
                      </CardFooter>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
