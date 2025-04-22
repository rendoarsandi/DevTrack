import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, BarChartHorizontal, LineChart, PieChart } from "lucide-react";

export default function AdminAnalytics() {
  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            View project statistics and performance metrics
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Project Completion Rate</CardTitle>
              <CardDescription>
                Average time to completion
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-[200px] flex flex-col items-center justify-center">
              <LineChart className="h-32 w-32 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm">
                Analytics data will be displayed here
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Project Status Distribution</CardTitle>
              <CardDescription>
                Current project status breakdown
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-[200px] flex flex-col items-center justify-center">
              <PieChart className="h-32 w-32 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm">
                Analytics data will be displayed here
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Client Activity</CardTitle>
              <CardDescription>
                Client engagement metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-[200px] flex flex-col items-center justify-center">
              <BarChart className="h-32 w-32 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm">
                Analytics data will be displayed here
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Budget Utilization</CardTitle>
              <CardDescription>
                Project budget analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-[200px] flex flex-col items-center justify-center">
              <BarChartHorizontal className="h-32 w-32 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm">
                Analytics data will be displayed here
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>
              Project success indicators and key metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="border-b py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Average Project Duration</p>
                    <p className="text-sm text-muted-foreground">
                      Time from start to completion
                    </p>
                  </div>
                  <span className="text-xl font-semibold">4.2 weeks</span>
                </div>
              </div>
              
              <div className="border-b py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Client Satisfaction</p>
                    <p className="text-sm text-muted-foreground">
                      Based on feedback
                    </p>
                  </div>
                  <span className="text-xl font-semibold">94%</span>
                </div>
              </div>
              
              <div className="border-b py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">On-Time Completion</p>
                    <p className="text-sm text-muted-foreground">
                      Projects completed within timeline
                    </p>
                  </div>
                  <span className="text-xl font-semibold">87%</span>
                </div>
              </div>
              
              <div className="py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Budget Adherence</p>
                    <p className="text-sm text-muted-foreground">
                      Projects within budget
                    </p>
                  </div>
                  <span className="text-xl font-semibold">92%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}