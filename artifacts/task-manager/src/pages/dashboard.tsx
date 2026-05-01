import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format } from "date-fns";
import { useGetDashboardSummary, useGetOverdueTasks, useGetRecentActivity, getGetDashboardSummaryQueryKey, getGetOverdueTasksQueryKey, getGetRecentActivityQueryKey } from "@workspace/api-client-react";
import { AlertCircle, Clock, CheckCircle2, ListTodo, FolderKanban, Activity, ArrowRight, CalendarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DashboardPage() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: overdueTasks, isLoading: isLoadingOverdue } = useGetOverdueTasks();
  const { data: recentActivity, isLoading: isLoadingActivity } = useGetRecentActivity();

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Here is what's happening across your workspace.</p>
          </div>
          <Link href="/projects">
            <Button>View All Projects</Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{summary?.totalProjects || 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">My Assigned Tasks</CardTitle>
              <ListTodo className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{summary?.myAssignedTasks || 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{summary?.inProgressTasks || 0}</div>
              )}
            </CardContent>
          </Card>
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-destructive">Overdue Tasks</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-destructive">{summary?.overdueTasks || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Project Breakdown */}
          <Card className="md:col-span-2 flex flex-col">
            <CardHeader>
              <CardTitle>Project Status</CardTitle>
              <CardDescription>Task completion breakdown by project</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {isLoadingSummary ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              ) : summary?.projectBreakdown?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground text-sm">
                  <FolderKanban className="h-10 w-10 mb-2 opacity-20" />
                  <p>No active projects found.</p>
                  <Link href="/projects" className="mt-4">
                    <Button variant="outline" size="sm">Create Project</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {summary?.projectBreakdown?.map((project) => {
                    const total = project.total || 1; // avoid division by zero
                    const percent = Math.round((project.completed / total) * 100);
                    return (
                      <div key={project.projectId} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <Link href={`/projects/${project.projectId}`} className="font-medium hover:underline flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: project.projectColor }} />
                            {project.projectName}
                          </Link>
                          <span className="text-muted-foreground">{percent}% ({project.completed}/{project.total})</span>
                        </div>
                        <Progress value={percent} className="h-2" style={{ "--progress-background": project.projectColor } as React.CSSProperties} />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Overdue Tasks */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Needs Attention
              </CardTitle>
              <CardDescription>Overdue tasks assigned to you</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {isLoadingOverdue ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : overdueTasks?.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-8 text-muted-foreground text-sm">
                  <CheckCircle2 className="h-10 w-10 mb-2 opacity-20 text-green-500" />
                  <p>You're all caught up!</p>
                </div>
              ) : (
                <div className="space-y-3 flex-1 overflow-y-auto pr-2" style={{ maxHeight: '300px' }}>
                  {overdueTasks?.map((task) => (
                    <Link key={task.id} href={`/projects/${task.projectId}`}>
                      <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors bg-card relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: task.projectColor }} />
                        <div className="pl-2">
                          <div className="text-sm font-medium leading-tight mb-1 truncate group-hover:text-primary transition-colors">{task.title}</div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="text-xs text-muted-foreground truncate max-w-[120px]">{task.projectName}</div>
                            {task.dueDate && (
                              <div className="flex items-center gap-1 text-[10px] font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                                <CalendarIcon className="h-3 w-3" />
                                {format(new Date(task.dueDate), "MMM d")}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}