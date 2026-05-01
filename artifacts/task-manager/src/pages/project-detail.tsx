import { Layout } from "@/components/layout";
import { useParams, Link } from "wouter";
import { 
  useGetProject, 
  useUpdateProject, 
  useDeleteProject,
  useListProjectTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useListProjectMembers,
  useAddProjectMember,
  useRemoveProjectMember,
  useUpdateProjectMember,
  getGetProjectQueryKey,
  getListProjectTasksQueryKey,
  getListProjectMembersQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { 
  CheckCircle2, Clock, AlertCircle, Plus, 
  CalendarIcon, Settings, Users, ArrowLeft, Trash2, Edit
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/react";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = Number(params.projectId);
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("tasks");
  const [taskFilterStatus, setTaskFilterStatus] = useState<string | undefined>(undefined);
  const [taskFilterAssignee, setTaskFilterAssignee] = useState<string | undefined>(undefined);
  
  const { data: project, isLoading: isLoadingProject } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) }
  });
  
  const { data: tasks, isLoading: isLoadingTasks } = useListProjectTasks(projectId, {
    query: { enabled: !!projectId, queryKey: getListProjectTasksQueryKey(projectId, { 
      status: taskFilterStatus as any, 
      assigneeId: taskFilterAssignee ? Number(taskFilterAssignee) : undefined 
    })}
  });
  
  const { data: members, isLoading: isLoadingMembers } = useListProjectMembers(projectId, {
    query: { enabled: !!projectId, queryKey: getListProjectMembersQueryKey(projectId) }
  });

  const isAdmin = project?.myRole === "admin";
  
  if (isLoadingProject) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full" />
        </div>
      </Layout>
    );
  }
  
  if (!project) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-2xl font-bold mb-2">Project not found</h2>
          <Link href="/projects">
            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/projects" className="hover:text-foreground transition-colors">Projects</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{project.name}</span>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: project.color }} />
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                {project.name}
                <Badge variant={project.status === "active" ? "default" : "secondary"}>
                  {project.status === "active" ? "Active" : "Archived"}
                </Badge>
                {isAdmin && <Badge variant="outline" className="uppercase text-[10px]">Admin</Badge>}
              </h1>
              {project.description && (
                <p className="text-muted-foreground mt-1 max-w-3xl">{project.description}</p>
              )}
            </div>
          </div>
          
          {isAdmin && <ProjectSettingsDialog project={project} />}
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="tasks" className="flex gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Tasks
              <Badge variant="secondary" className="ml-1 rounded-full px-2 py-0 h-5 text-[10px]">{project.taskCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="members" className="flex gap-2">
              <Users className="h-4 w-4" />
              Members
              <Badge variant="secondary" className="ml-1 rounded-full px-2 py-0 h-5 text-[10px]">{project.memberCount}</Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-end sm:items-center bg-card p-4 rounded-lg border shadow-sm">
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <Select value={taskFilterStatus || "all"} onValueChange={(val) => setTaskFilterStatus(val === "all" ? undefined : val)}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={taskFilterAssignee || "all"} onValueChange={(val) => setTaskFilterAssignee(val === "all" ? undefined : val)}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="All Assignees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignees</SelectItem>
                    {members?.map(m => (
                      <SelectItem key={m.id} value={m.userId.toString()}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <CreateTaskDialog projectId={projectId} members={members || []} />
            </div>
            
            <div className="grid gap-3">
              {isLoadingTasks ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
              ) : tasks?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-lg bg-card/50">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">No tasks found</h3>
                  <p className="text-sm text-muted-foreground mb-4">Create the first task for this project.</p>
                  <CreateTaskDialog projectId={projectId} members={members || []} />
                </div>
              ) : (
                tasks?.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    projectId={projectId} 
                    members={members || []}
                    isAdmin={isAdmin}
                    currentUserId={currentUser?.id}
                  />
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="members" className="space-y-4">
            <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
              <h3 className="font-medium">Project Members</h3>
              {isAdmin && <AddMemberDialog projectId={projectId} />}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoadingMembers ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
              ) : (
                members?.map(member => (
                  <Card key={member.id} className="overflow-hidden">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatarUrl || undefined} />
                          <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{member.name}</span>
                          <span className="text-xs text-muted-foreground">{member.email}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isAdmin && member.clerkId !== currentUser?.id ? (
                          <MemberActionsDropdown 
                            member={member} 
                            projectId={projectId} 
                          />
                        ) : (
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {member.role}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

// Subcomponents

function TaskCard({ task, projectId, members, isAdmin, currentUserId }: any) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const canEdit = isAdmin || task.assigneeClerkId === currentUserId;
  
  const updateTask = useUpdateTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectTasksQueryKey(projectId, {}) });
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
      }
    }
  });

  const deleteTask = useDeleteTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectTasksQueryKey(projectId, {}) });
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
        toast({ title: "Task deleted" });
      }
    }
  });

  const handleStatusChange = (newStatus: string) => {
    if (!canEdit) return;
    updateTask.mutate({
      projectId,
      data: { id: task.id, status: newStatus as any } as any
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
    <Card className={`overflow-hidden transition-colors ${task.status === 'done' ? 'opacity-60 bg-muted/50' : 'hover:border-border'}`}>
      <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </span>
            <Badge variant="outline" className={`text-[10px] uppercase font-bold ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </Badge>
          </div>
          
          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-1 max-w-2xl">{task.description}</p>
          )}
          
          <div className="flex items-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Avatar className="h-5 w-5">
                <AvatarImage src={task.assigneeAvatarUrl} />
                <AvatarFallback className="text-[8px]">{task.assigneeName ? task.assigneeName.substring(0,2).toUpperCase() : "?"}</AvatarFallback>
              </Avatar>
              <span>{task.assigneeName || "Unassigned"}</span>
            </div>
            
            {task.dueDate && (
              <div className={`flex items-center gap-1 ${isOverdue(task.dueDate) && task.status !== 'done' ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                <CalendarIcon className="h-3 w-3" />
                {format(new Date(task.dueDate), "MMM d, yyyy")}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto mt-2 sm:mt-0">
          <Select 
            defaultValue={task.status} 
            onValueChange={handleStatusChange}
            disabled={!canEdit || updateTask.isPending}
          >
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <div className="flex items-center gap-2">
                {getStatusIcon(task.status)}
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">
                <div className="flex items-center gap-2 text-xs">
                  <AlertCircle className="h-3 w-3 text-muted-foreground" /> To Do
                </div>
              </SelectItem>
              <SelectItem value="in_progress">
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="h-3 w-3 text-amber-500" /> In Progress
                </div>
              </SelectItem>
              <SelectItem value="done">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="h-3 w-3 text-green-500" /> Done
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          {canEdit && (
            <EditTaskDialog 
              task={task} 
              projectId={projectId} 
              members={members} 
              open={isEditOpen} 
              onOpenChange={setIsEditOpen} 
            />
          )}
          
          {isAdmin && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => {
                if(confirm("Are you sure you want to delete this task?")) {
                  deleteTask.mutate({ projectId, data: { id: task.id } as any });
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CreateTaskDialog({ projectId, members }: { projectId: number, members: any[] }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [assigneeId, setAssigneeId] = useState("none");
  const [dueDate, setDueDate] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createTask = useCreateTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectTasksQueryKey(projectId, {}) });
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
        toast({ title: "Task created successfully" });
        setOpen(false);
        reset();
      },
      onError: () => {
        toast({ title: "Failed to create task", variant: "destructive" });
      }
    }
  });

  const reset = () => {
    setTitle("");
    setDescription("");
    setStatus("todo");
    setPriority("medium");
    setAssigneeId("none");
    setDueDate("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    createTask.mutate({
      projectId,
      data: {
        title: title.trim(),
        description: description.trim() || null,
        status: status as any,
        priority: priority as any,
        assigneeId: assigneeId === "none" ? null : Number(assigneeId),
        dueDate: dueDate || null
      } as any
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9"><Plus className="h-4 w-4 mr-2" /> New Task</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required autoFocus />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className="resize-none" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Assignee</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {members?.map(m => (
                      <SelectItem key={m.id} value={m.userId.toString()}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="due">Due Date (optional)</Label>
                <Input id="due" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createTask.isPending || !title.trim()}>Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditTaskDialog({ task, projectId, members, open, onOpenChange }: any) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState(task.priority);
  const [assigneeId, setAssigneeId] = useState(task.assigneeId ? task.assigneeId.toString() : "none");
  const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const updateTask = useUpdateTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectTasksQueryKey(projectId, {}) });
        toast({ title: "Task updated" });
        onOpenChange(false);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    updateTask.mutate({
      projectId,
      data: {
        id: task.id,
        title: title.trim(),
        description: description.trim() || null,
        priority: priority as any,
        assigneeId: assigneeId === "none" ? null : Number(assigneeId),
        dueDate: dueDate ? new Date(dueDate).toISOString() : null
      } as any
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Edit className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className="resize-none" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Assignee</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {members?.map((m: any) => (
                      <SelectItem key={m.id} value={m.userId.toString()}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="due">Due Date (optional)</Label>
              <Input id="due" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={updateTask.isPending || !title.trim()}>Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProjectSettingsDialog({ project }: { project: any }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [color, setColor] = useState(project.color);
  const [status, setStatus] = useState(project.status);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const updateProject = useUpdateProject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(project.id) });
        queryClient.invalidateQueries({ queryKey: getListProjectTasksQueryKey(project.id, {}) });
        toast({ title: "Project settings updated" });
        setOpen(false);
      }
    }
  });

  const deleteProject = useDeleteProject({
    mutation: {
      onSuccess: () => {
        toast({ title: "Project deleted" });
        window.location.href = "/projects";
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    updateProject.mutate({
      projectId: project.id,
      data: {
        name: name.trim(),
        description: description.trim() || null,
        color,
        status: status as any
      }
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure? This will delete the project and all its tasks. This cannot be undone.")) {
      deleteProject.mutate({ projectId: project.id });
    }
  };

  const colors = ["#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#6366F1", "#EC4899", "#F43F5E", "#64748B", "#334155"];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Settings className="mr-2 h-4 w-4" /> Settings</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Project Settings</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} className="resize-none" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2 mt-1">
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
          <DialogFooter className="flex justify-between items-center sm:justify-between w-full">
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleteProject.isPending}>
              Delete Project
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateProject.isPending || !name.trim()}>Save</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddMemberDialog({ projectId }: { projectId: number }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const addMember = useAddProjectMember({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectMembersQueryKey(projectId) });
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
        toast({ title: "Member added" });
        setOpen(false);
        setEmail("");
        setRole("member");
      },
      onError: (err: any) => {
        toast({ title: "Failed to add member", description: err.message || "User might not exist", variant: "destructive" });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    addMember.mutate({
      projectId,
      data: {
        email: email.trim(),
        role: role as any
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" /> Add Member</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>
              Invite a user to collaborate on this project. They must have an account already.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus placeholder="colleague@example.com" />
            </div>
            
            <div className="grid gap-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={addMember.isPending || !email.trim()}>Add Member</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MemberActionsDropdown({ member, projectId }: { member: any, projectId: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const updateMember = useUpdateProjectMember({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectMembersQueryKey(projectId) });
        toast({ title: "Role updated" });
      }
    }
  });

  const removeMember = useRemoveProjectMember({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectMembersQueryKey(projectId) });
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
        toast({ title: "Member removed" });
      }
    }
  });

  return (
    <div className="flex items-center gap-2">
      <Select 
        value={member.role} 
        onValueChange={(val) => {
          updateMember.mutate({
            projectId,
            data: { id: member.userId, role: val as any } as any
          });
        }}
        disabled={updateMember.isPending}
      >
        <SelectTrigger className="w-[100px] h-8 text-xs uppercase font-medium">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="member" className="text-xs uppercase font-medium">Member</SelectItem>
          <SelectItem value="admin" className="text-xs uppercase font-medium">Admin</SelectItem>
        </SelectContent>
      </Select>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        disabled={removeMember.isPending}
        onClick={() => {
          if (confirm("Remove this member from the project?")) {
            removeMember.mutate({ projectId, data: { id: member.userId } as any });
          }
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}