import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createAdmin, listAdmins, removeAdmin } from "@/lib/admins.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/admins")({ component: Admins });

type Admin = { id: string; email: string; created_at: string };

function Admins() {
  const listFn = useServerFn(listAdmins);
  const createFn = useServerFn(createAdmin);
  const removeFn = useServerFn(removeAdmin);
  const [admins, setAdmins] = useState<Admin[] | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const rows = await listFn();
      setAdmins(rows as Admin[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load admins");
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createFn({ data: { email, password } });
      toast.success("Admin created");
      setEmail(""); setPassword("");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create admin");
    } finally { setBusy(false); }
  };

  const remove = async (userId: string, adminEmail: string) => {
    if (!confirm(`Remove admin access from ${adminEmail}?`)) return;
    try {
      await removeFn({ data: { userId } });
      toast.success("Admin removed");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <section className="mx-auto max-w-4xl px-6 py-10">
      <div className="label-eyebrow">Access control</div>
      <h1 className="display text-5xl mt-2">Admins</h1>
      <p className="mt-2 text-sm text-muted-foreground">Only admins listed below can sign in. Public signup is disabled.</p>

      <form onSubmit={submit} className="mt-10 rounded-sm border border-rule bg-card p-6 space-y-4">
        <div className="serif text-lg">Add a new admin</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider">Email</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider">Temporary password</Label>
            <Input type="text" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min 8 chars" />
          </div>
        </div>
        <button disabled={busy} type="submit" className="rounded-sm bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">
          {busy ? "Creating…" : "Create admin"}
        </button>
      </form>

      <div className="mt-10 rounded-sm border border-rule bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-rule bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Added</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(admins ?? []).map((a) => (
              <tr key={a.id} className="border-b border-rule last:border-0">
                <td className="px-4 py-3">{a.email}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(a.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(a.id, a.email)} className="text-xs text-destructive underline underline-offset-4">Remove</button>
                </td>
              </tr>
            ))}
            {admins && admins.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">No admins.</td></tr>
            )}
            {!admins && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
