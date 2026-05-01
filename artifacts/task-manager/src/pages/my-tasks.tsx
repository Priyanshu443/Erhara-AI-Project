import { Layout } from "@/components/layout";
import { useGetMyTasks, useUpdateTask, getGetMyTasksQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon, CheckSquare, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

export default function MyTasksPage() {
  const { data: tasks, isLoading } = useGetMyTasks();
  const queryClient = useQueryClient();

  const updateTask = useUpdateTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyTasksQueryKey() });
      }
    }
  });

  const handleStatusChange = (taskId: number, projectId: number, newStatus: "todo" | "in_progress" | "done") => {
    updateTask.mutate({
      projectId,
      data: {
        id: taskId,
        status: newStatus
      } as any // The hook expects projectId in path, data in body
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-destructive/10 text-destructive border-destructive/20";
      case "medium": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "low": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "in_progress": return <Clock className="h-4 w-4 text-amber-500" />;
      case "todo": return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
      default: return null;
    }
  };

  const isOverdue = (dateString?: string | null) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground mt-1">All tasks assigned to you across projects.</p>
        </div>

        <div className="grid gap-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="py-4">
                <CardContent className="py-0 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))
          ) : tasks?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-lg bg-card/50">
              <CheckSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No tasks assigned to you</h3>
              <p className="text-sm text-muted-foreground">You are all caught up!</p>
            </div>
          ) : (
            tasks?.map((task) => (
              <Card key={task.id} className={`overflow-hidden transition-colors ${task.status === 'done' ? 'opacity-60 bg-muted/50' : 'hover:border-primary/50'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <div className="w-1 h-full absolute left-0 top-0 bottom-0 sm:static sm:w-1 sm:h-auto sm:self-stretch" style={{ backgroundColor: task.projectColor }} />
                  <CardContent className="flex-1 py-4 px-4 sm:px-6 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </span>
                        <Badge variant="outline" className={`text-[10px] uppercase font-bold ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <Link href={`/projects/${task.projectId}`} className="hover:text-primary hover:underline flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: task.projectColor }} />
                          {task.projectName}
                        </Link>
                        {task.dueDate && (
                          <>
                            <span>•</span>
                            <div className={`flex items-center gap-1 ${isOverdue(task.dueDate) && task.status !== 'done' ? 'text-destructive font-medium' : ''}`}>
                              <CalendarIcon className="h-3 w-3" />
                              {format(new Date(task.dueDate), "MMM d, yyyy")}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Select 
                        defaultValue={task.status} 
                        onValueChange={(val: any) => handleStatusChange(task.id, task.projectId, val)}
                        disabled={updateTask.isPending}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(task.status)}
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">
                            <div className="flex items-center gap-2 text-xs">
                              <AlertCircle className="h-3 w-3 text-muted-foreground" />
                              To Do
                            </div>
                          </SelectItem>
                          <SelectItem value="in_progress">
                            <div className="flex items-center gap-2 text-xs">
                              <Clock className="h-3 w-3 text-amber-500" />
                              In Progress
                            </div>
                          </SelectItem>
                          <SelectItem value="done">
                            <div className="flex items-center gap-2 text-xs">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              Done
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}