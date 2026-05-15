import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { speak } from "@/hooks/useVoice";
import { toast } from "sonner";
import { Mail, LogIn, UserPlus } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Sign in — EYTA AI" },
      { name: "description", content: "Sign in to EYTA AI to sync your settings and emergency contacts." },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already signed in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  // Voice greeting
  useEffect(() => {
    const t = setTimeout(() => {
      speak("Sign in to EYTA AI. Enter your email and password, or continue with Google.", "en");
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
        speak("Account created. Please check your email to confirm.", "en");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        speak("Signed in. Welcome back.", "en");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      toast.error(msg);
      speak("Sign in failed. " + msg, "en");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        const msg = result.error instanceof Error ? result.error.message : "Google sign-in failed";
        toast.error(msg);
        speak("Google sign in failed.", "en");
        setLoading(false);
        return;
      }
      if (result.redirected) return;
      // Tokens received — auth state listener will navigate
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed";
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <AppShell withHeader>
      <div className="flex flex-1 flex-col gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            {mode === "signin"
              ? "Sign in to access EYTA AI"
              : "Join EYTA AI to sync your settings"}
          </p>
        </div>

        <Button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="h-14 w-full rounded-xl bg-secondary text-base font-semibold text-secondary-foreground shadow-sm hover:bg-muted"
          aria-label="Continue with Google"
        >
          <Mail className="mr-2 h-5 w-5" aria-hidden />
          Continue with Google
        </Button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-base"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-base">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 text-base"
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-14 w-full rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-md hover:bg-primary/90"
          >
            {mode === "signin" ? (
              <><LogIn className="mr-2 h-5 w-5" aria-hidden /> Sign in</>
            ) : (
              <><UserPlus className="mr-2 h-5 w-5" aria-hidden /> Create account</>
            )}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {mode === "signin"
            ? "New here? Create an account"
            : "Already have an account? Sign in"}
        </button>

        <Link
          to="/"
          className="text-center text-xs text-muted-foreground hover:text-foreground"
        >
          Continue without signing in
        </Link>
      </div>
    </AppShell>
  );
}
