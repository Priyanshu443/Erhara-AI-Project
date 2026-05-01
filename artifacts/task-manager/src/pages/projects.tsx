import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useListProjects, useCreateProject, getListProjectsQueryKey } from "@workspace/api-client-react";
import { Plus, FolderKanban, MoreVertical, Settings, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function ProjectsPage() {
  const { data: projects, isLoading } = useListProjects();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground mt-1">Manage your workspaces and initiatives.</p>
          </div>
          <CreateProjectDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="flex flex-col h-[200px]">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className="flex-1 mt-auto">
                  <Skeleton className="h-2 w-full mb-2" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : projects?.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-lg bg-card/50">
              <FolderKanban className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No projects found</h3>
              <p className="text-sm text-muted-foreground mb-4">Get started by creating your first project.</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </div>
          ) : (
            projects?.map((project) => {
              const totalTasks = project.taskCount || 0;
              const completedTasks = project.completedCount || 0;
              const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="flex flex-col h-full hover:border-primary/50 transition-colors cursor-pointer group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: project.color }} />
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">{project.name}</CardTitle>
                        <Badge variant={project.status === "active" ? "default" : "secondary"}>
                          {project.status === "active" ? "Active" : "Archived"}
                        </Badge>
                      </div>
                      {project.description && (
                        <CardDescription className="line-clamp-2 mt-2">{project.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="mt-auto pb-4">
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground font-medium">Progress</span>
                            <span className="font-medium">{percent}%</span>
                          </div>
                          <Progress value={percent} className="h-2" style={{ "--progress-background": project.color } as React.CSSProperties} />
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                          <div className="flex gap-3">
                            <span className="font-medium">{totalTasks} tasks</span>
                            <span>•</span>
                            <span>{project.memberCount} members</span>
                          </div>
                          {project.myRole === "admin" && (
                            <Badge variant="outline" className="text-[10px] uppercase font-bold">Admin</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}

function CreateProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#0EA5E9");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createProject = useCreateProject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        toast({ title: "Project created successfully" });
        onOpenChange(false);
        setName("");
        setDescription("");
        setColor("#0EA5E9");
      },
      onError: () => {
        toast({ title: "Failed to create project", variant: "destructive" });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createProject.mutate({
      data: {
        name: name.trim(),
        description: description.trim() || null,
        color
      }
    });
  };

  const colors = ["#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#6366F1", "#EC4899", "#F43F5E"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create project</DialogTitle>
            <DialogDescription>
              Add a new workspace for your team's tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q3 Marketing Launch"
                required
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this project about?"
                className="resize-none"
              />
            </div>
            <div className="grid gap-2">
              <Label>Project Color</Label>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                      color === c ? "border-foreground" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createProject.isPending || !name.trim()}>
              {createProject.isPending ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}