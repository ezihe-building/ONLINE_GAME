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
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const registerSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters").max(30, "Username too long"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { user, refetch } = useAuth();
  const register = useRegister();
  const { toast } = useToast();

  useEffect(() => {
    if (user) setLocation("/lobby");
  }, [user, setLocation]);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    register.mutate({ data: values }, {
      onSuccess: () => {
        refetch();
        setLocation("/lobby");
      },
      onError: (error) => {
        toast({
          title: "Registration failed",
          description: error.error?.error || "Could not create account",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center p-4 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <Card className="w-full max-w-md border-border/50 bg-background/60 backdrop-blur shadow-2xl relative z-10">
          <CardHeader className="space-y-2 text-center pb-8">
            <CardTitle className="text-3xl font-bold tracking-tight">Create an account</CardTitle>
            <CardDescription className="text-base">Join the games and make your moves</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="PlayerOne" className="h-12 bg-background/50" {...field} />
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
                        <Input type="password" placeholder="••••••••" className="h-12 bg-background/50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-12 text-lg shadow-[0_0_20px_-5px_rgba(236,72,153,0.5)] bg-accent hover:bg-accent/90" disabled={register.isPending}>
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
