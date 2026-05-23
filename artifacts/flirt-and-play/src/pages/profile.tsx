import { useState } from "react";
import { useGetMe, useUpdateMe, useRequestUploadUrl } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Loader2, Upload, Save } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const profileSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters").max(30, "Username must be max 30 characters"),
});

export default function Profile() {
  const { data: profile, isLoading } = useGetMe();
  const updateMe = useUpdateMe();
  const requestUploadUrl = useRequestUploadUrl();
  const { toast } = useToast();
  
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: profile?.username || "",
    },
    values: {
      username: profile?.username || "",
    }
  });

  const onSubmit = (data: z.infer<typeof profileSchema>) => {
    updateMe.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Profile updated successfully" });
      },
      onError: (err) => {
        toast({ title: "Failed to update profile", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Please upload an image file", variant: "destructive" });
      return;
    }

    setIsUploading(true);

    try {
      // 1. Get upload URL
      const { uploadURL, objectPath } = await requestUploadUrl.mutateAsync({
        data: {
          name: file.name,
          size: file.size,
          contentType: file.type,
        }
      });

      // 2. Upload directly to GCS
      const res = await fetch(uploadURL, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!res.ok) throw new Error("Upload failed");

      // 3. Update profile with new avatar path
      await updateMe.mutateAsync({
        data: { avatarPath: objectPath }
      });

      toast({ title: "Avatar updated successfully" });
    } catch (err: any) {
      toast({ title: "Failed to upload avatar", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-md relative">
        <Link href="/lobby" className="absolute -top-12 left-0 text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Lobby
        </Link>
        
        <Card className="bg-card border-border shadow-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-display font-bold">Your Profile</CardTitle>
            <CardDescription>Update your photo and username.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-8">
            
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-border">
                <AvatarImage src={profile?.avatarPath ? `/api/storage/objects${profile.avatarPath}` : undefined} />
                <AvatarFallback className="bg-muted text-4xl">{profile?.username?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
              </Avatar>
              <label 
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                htmlFor="avatar-upload"
              >
                {isUploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8 mb-1" />}
                <span className="text-xs font-medium">{isUploading ? 'Uploading...' : 'Change'}</span>
                <input 
                  id="avatar-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter username" {...field} className="bg-input border-border" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={updateMe.isPending}
                >
                  {updateMe.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </form>
            </Form>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}