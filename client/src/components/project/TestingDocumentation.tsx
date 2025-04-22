import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FileCode, Rocket, Bug, Terminal, Upload } from "lucide-react";

interface TestingDocumentationProps {
  projectId: number | string;
}

export function TestingDocumentation({ projectId }: TestingDocumentationProps) {
  const [testResults, setTestResults] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [deploymentNotes, setDeploymentNotes] = useState("");
  const [activeTab, setActiveTab] = useState("testing");
  const { toast } = useToast();
  
  const submitTestingMutation = useMutation({
    mutationFn: async (data: { content: string; type: string }) => {
      const response = await apiRequest(
        "POST",
        `/api/projects/${projectId}/documentation`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Documentation saved",
        description: "Your testing documentation has been saved successfully",
      });
      
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${projectId}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${projectId}/activities`],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save documentation",
        variant: "destructive",
      });
    },
  });
  
  const handleSubmitTestResults = () => {
    if (!testResults.trim()) {
      toast({
        title: "Error",
        description: "Please provide test results",
        variant: "destructive",
      });
      return;
    }
    
    submitTestingMutation.mutate({
      type: "testing",
      content: testResults
    });
  };
  
  const handleSubmitDeployment = () => {
    if (!demoUrl.trim() || !deploymentNotes.trim()) {
      toast({
        title: "Error",
        description: "Please provide all deployment information",
        variant: "destructive",
      });
      return;
    }
    
    submitTestingMutation.mutate({
      type: "deployment",
      content: JSON.stringify({
        demoUrl,
        repoUrl,
        deploymentNotes
      })
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Testing & Deployment Documentation</CardTitle>
        <CardDescription>
          Provide testing results and deployment information for your project
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="testing" className="flex items-center">
              <Bug className="mr-2 h-4 w-4" />
              Testing Documentation
            </TabsTrigger>
            <TabsTrigger value="deployment" className="flex items-center">
              <Rocket className="mr-2 h-4 w-4" />
              Deployment Information
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="testing" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center p-3 border rounded-md bg-muted/50">
                  <div className="p-2 rounded-full bg-primary/10 mr-3">
                    <Terminal className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Unit Tests</h3>
                    <p className="text-xs text-muted-foreground">
                      Component and function tests
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center p-3 border rounded-md bg-muted/50">
                  <div className="p-2 rounded-full bg-primary/10 mr-3">
                    <FileCode className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Integration Tests</h3>
                    <p className="text-xs text-muted-foreground">
                      API and service integration 
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="testResults">Test Results</Label>
                <Textarea
                  id="testResults"
                  placeholder="Enter testing results and methodology details... Include code coverage metrics, performance benchmarks, and any issues found during testing."
                  rows={10}
                  value={testResults}
                  onChange={(e) => setTestResults(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Provide detailed test results including code coverage, performance metrics, and edge cases tested.
                </p>
              </div>
              
              <div className="flex space-x-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setTestResults("")}
                >
                  Reset
                </Button>
                <Button
                  onClick={handleSubmitTestResults}
                  disabled={submitTestingMutation.isPending}
                >
                  {submitTestingMutation.isPending ? "Saving..." : "Save Test Results"}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="deployment" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="demoUrl">Demo/Staging URL</Label>
                <Input
                  id="demoUrl"
                  placeholder="https://demo.yourproject.com"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Provide a link where reviewers can see the deployed application
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="repoUrl">Repository URL</Label>
                <Input
                  id="repoUrl"
                  placeholder="https://github.com/your-username/your-repo"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  GitHub or other repository URL (optional)
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="deploymentNotes">Deployment Notes</Label>
                <Textarea
                  id="deploymentNotes"
                  placeholder="Describe the deployment process, environment configuration, and any special instructions for reviewers..."
                  rows={6}
                  value={deploymentNotes}
                  onChange={(e) => setDeploymentNotes(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Include environment requirements, configuration details, and any access instructions for reviewers.
                </p>
              </div>
              
              <div className="flex space-x-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDemoUrl("");
                    setRepoUrl("");
                    setDeploymentNotes("");
                  }}
                >
                  Reset
                </Button>
                <Button
                  onClick={handleSubmitDeployment}
                  disabled={submitTestingMutation.isPending}
                >
                  {submitTestingMutation.isPending ? (
                    "Saving..."
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Save Deployment Info
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}