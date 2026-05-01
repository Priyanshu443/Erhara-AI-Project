import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetMe, useUpdateMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/react";

export default function SettingsPage() {
  const { data: userProfile, isLoading } = useGetMe();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || "");
      setAvatarUrl(userProfile.avatarUrl || "");
    }
  }, [userProfile]);

  const updateProfile = useUpdateMe({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Profile updated successfully" });
      },
      onError: () => {
        toast({ title: "Failed to update profile", variant: "destructive" });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    updateProfile.mutate({
      data: {
        name: name.trim(),
        avatarUrl: avatarUrl.trim() || null
      }
    });
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      value={user?.primaryEmailAddress?.emailAddress || userProfile?.email || ""} 
                      disabled 
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Email is managed by Clerk and cannot be changed here.</p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required 
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="avatar">Avatar URL (optional)</Label>
                    <Input 
                      id="avatar" 
                      value={avatarUrl} 
                      onChange={(e) => setAvatarUrl(e.target.value)} 
                      placeholder="https://example.com/avatar.png"
                    />
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={isLoading || updateProfile.isPending || !name.trim()}>
                {updateProfile.isPending ? "Saving..." : "Save changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Layout>
  );
}