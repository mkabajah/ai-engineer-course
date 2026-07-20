import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({ component: AdminLogin });

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/admin/dashboard" });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-6 rounded-sm border border-rule bg-card p-8">
        <div>
          <div className="label-eyebrow">Admin</div>
          <h1 className="display mt-2 text-4xl">Sign in</h1>
          <p className="mt-2 text-xs text-muted-foreground">
            Admin access only. New admins are provisioned from inside the dashboard.
          </p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider">Email</Label>
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider">Password</Label>
          <Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {loading ? "…" : "Sign in"}
        </button>
        <div className="flex justify-end text-xs text-muted-foreground">
          <Link to="/" className="underline underline-offset-4">← Home</Link>
        </div>
      </form>
    </main>
  );
}
