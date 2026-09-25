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
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link to="/admin/dashboard" className="serif text-lg">AI Accelerator — Admin</Link>
          <nav className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 text-[10px] uppercase tracking-widest text-muted-foreground sm:w-auto sm:gap-6 sm:text-xs">
            <Link to="/admin/dashboard" activeProps={{ className: "text-foreground" }}>Candidates</Link>
            <Link to="/admin/groups" activeProps={{ className: "text-foreground" }}>Groups</Link>
            <Link to="/admin/challenges" activeProps={{ className: "text-foreground" }}>Challenges</Link>
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
