import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Plus, Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Agent = Tables<"agents">;
const ADMIN_EMAIL = "marouane@aarab.mks";

export default function AdminPanel() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [deletingAgent, setDeletingAgent] = useState<Agent | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", suffix_code: "" });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/dashboard");
      return;
    }
    if (isAdmin) fetchAgents();
  }, [isAdmin, authLoading, navigate]);

  const fetchAgents = async () => {
    const { data } = await supabase.from("agents").select("*").order("created_at", { ascending: false });
    setAgents(data || []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditingAgent(null);
    setForm({ name: "", email: "", password: "", suffix_code: "" });
    setFormOpen(true);
  };

  const openEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setForm({ name: agent.name, email: agent.email, password: "", suffix_code: agent.suffix_code });
    setFormOpen(true);
  };

  const openDelete = (agent: Agent) => {
    setDeletingAgent(agent);
    setDeleteOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingAgent) {
        const { data, error } = await supabase.functions.invoke("manage-agents", {
          body: { action: "update", agent_id: editingAgent.id, name: form.name, suffix_code: form.suffix_code, email: form.email },
        });
        if (error || data?.error) throw new Error(data?.error || error?.message);
        toast.success("Agent modifié avec succès");
      } else {
        if (!form.password) { toast.error("Mot de passe requis"); setSaving(false); return; }
        const { data, error } = await supabase.functions.invoke("manage-agents", {
          body: { action: "create", email: form.email, password: form.password, name: form.name, suffix_code: form.suffix_code },
        });
        if (error || data?.error) throw new Error(data?.error || error?.message);
        toast.success("Agent créé avec succès");
      }
      setFormOpen(false);
      fetchAgents();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAgent) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-agents", {
        body: { action: "delete", agent_id: deletingAgent.id },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast.success("Agent supprimé");
      setDeleteOpen(false);
      setDeletingAgent(null);
      fetchAgents();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Gestion des Agents</h1>
            <p className="text-sm text-muted-foreground">Administration</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un agent
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={async () => { await signOut(); navigate("/login"); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Créé le</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {agents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      Aucun agent pour le moment.
                    </td>
                  </tr>
                ) : agents.filter(a => a.email !== ADMIN_EMAIL).map((agent) => (
                  <tr key={agent.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-card-foreground">{agent.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{agent.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                        /{agent.suffix_code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(agent.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(agent)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDelete(agent)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAgent ? "Modifier l'agent" : "Nouvel agent"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="agent-name">Nom complet</Label>
              <Input id="agent-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Fatima Zahra" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="agent-email">Email</Label>
              <Input id="agent-email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="agent@confirma.ma" className="mt-1.5" />
            </div>
            {!editingAgent && (
              <div>
                <Label htmlFor="agent-password">Mot de passe</Label>
                <Input id="agent-password" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" className="mt-1.5" />
              </div>
            )}
            <div>
              <Label htmlFor="agent-suffix">Code suffixe</Label>
              <Input id="agent-suffix" value={form.suffix_code} onChange={e => setForm(f => ({ ...f, suffix_code: e.target.value }))} placeholder="FZ" maxLength={3} className="mt-1.5 uppercase" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.email || !form.suffix_code}>
              {saving ? "Enregistrement..." : editingAgent ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet agent ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'agent <strong>{deletingAgent?.name}</strong> et toutes ses données seront supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={saving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {saving ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
