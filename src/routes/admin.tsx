import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, isAdmin, loading } = useAuth();
  const isLoginRoute = location.pathname === "/admin/login";

  useEffect(() => {
    if (loading || isLoginRoute) return;
    if (!session) navigate({ to: "/admin/login" });
  }, [session, loading, navigate, isLoginRoute]);

  // Login page renders without the admin chrome / guard
  if (isLoginRoute) return <Outlet />;

  if (loading) return <div className="min-h-screen bg-background" />;
  if (!session) return null;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div>
          <h1 className="serif text-3xl">No admin access</h1>
          <p className="mt-2 text-sm text-muted-foreground">This account has no admin role.</p>
          <button
            onClick={() => supabase.auth.signOut().then(() => navigate({ to: "/admin/login" }))}
            className="mt-6 text-sm underline underline-offset-4"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/admin/dashboard" className="serif text-lg">AI Accelerator — Admin</Link>
          <nav className="flex items-center gap-6 text-xs uppercase tracking-widest text-muted-foreground">
            <Link to="/admin/dashboard" activeProps={{ className: "text-foreground" }}>Candidates</Link>
            <Link to="/admin/groups" activeProps={{ className: "text-foreground" }}>Groups</Link>
            <Link to="/admin/challenge" activeProps={{ className: "text-foreground" }}>Challenge</Link>
            <Link to="/admin/exam" activeProps={{ className: "text-foreground" }}>Exam</Link>
            <Link to="/admin/questions" activeProps={{ className: "text-foreground" }}>Questions</Link>
            <Link to="/admin/admins" activeProps={{ className: "text-foreground" }}>Admins</Link>
            <button
              onClick={() => supabase.auth.signOut().then(() => navigate({ to: "/admin/login" }))}
              className="hover:text-foreground"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
