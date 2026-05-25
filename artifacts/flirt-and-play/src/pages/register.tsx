import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, Link } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useRef } from "react";
import { Camera } from "lucide-react";

const registerSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters").max(30, "Username too long"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { user, refetch } = useAuth();
  const register = useRegister();
  const { toast } = useToast();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) setLocation("/lobby");
  }, [user, setLocation]);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", password: "" },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const uploadAvatar = async (): Promise<void> => {
    if (!avatarFile) return;
    const formData = new FormData();
    formData.append("avatar", avatarFile);
    await fetch("/api/auth/upload-avatar", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
  };

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    register.mutate({ data: values }, {
      onSuccess: async () => {
        if (avatarFile) {
          await uploadAvatar();
        }
        await refetch();
        setLocation("/lobby");
      },
      onError: (error: any) => {
        toast({
          title: "Registration failed",
          description: error?.data?.error || "Could not create account",
          variant: "destructive",
        });
      },
    });
  };

  const username = form.watch("username");

  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center p-4 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

        <Card className="w-full max-w-md border-border/50 bg-background/60 backdrop-blur shadow-2xl relative z-10">
          <CardHeader className="space-y-2 text-center pb-6">
            <CardTitle className="text-3xl font-bold tracking-tight">Create an account</CardTitle>
            <CardDescription className="text-base">Join the games and make your moves</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar picker */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="relative cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
                data-testid="avatar-picker"
              >
                <Avatar className="h-24 w-24 border-2 border-dashed border-border/60 group-hover:border-primary/60 transition-colors">
                  <AvatarImage src={avatarPreview ?? undefined} />
                  <AvatarFallback className="bg-muted text-2xl font-bold text-muted-foreground group-hover:text-primary transition-colors">
                    {username ? username.charAt(0).toUpperCase() : "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5 shadow-lg">
                  <Camera className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {avatarFile ? avatarFile.name : "Tap to add a photo (optional)"}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarChange}
                data-testid="input-avatar-file"
              />
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="PlayerOne"
                          className="h-12 bg-background/50"
                          data-testid="input-username"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="h-12 bg-background/50"
                          data-testid="input-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full h-12 text-lg shadow-[0_0_20px_-5px_rgba(236,72,153,0.5)] bg-accent hover:bg-accent/90"
                  disabled={register.isPending}
                  data-testid="button-register"
                >
                  {register.isPending ? "Creating account..." : "Register"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/50 pt-6">
            <div className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Log in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}
