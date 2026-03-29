import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Mail, Lock, Eye, EyeOff, Pencil, Save, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminProfileModal({ open, onOpenChange }: AdminProfileModalProps) {
  const { agent } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const startEditing = () => {
    setName(agent?.name || "");
    setEmail(agent?.email || "");
    setPassword("");
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setPassword("");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, string> = { action: "update-admin" };
      if (name && name !== agent?.name) body.name = name;
      if (email && email !== agent?.email) body.email = email;
      if (password) body.password = password;

      if (Object.keys(body).length <= 1) {
        toast.info("Aucune modification détectée.");
        setSaving(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("manage-agents", { body });
      if (error || data?.error) throw new Error(data?.error || error?.message);

      toast.success("Profil mis à jour avec succès !");
      setEditing(false);
      setPassword("");
      // Reload page to refresh auth state
      if (email && email !== agent?.email) {
        toast.info("Votre email a été modifié. Veuillez vous reconnecter.");
        window.location.reload();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Profil Administrateur</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>

          {editing ? (
            <div className="w-full space-y-3">
              <div>
                <Label htmlFor="admin-name">Nom</Label>
                <Input id="admin-name" value={name} onChange={e => setName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="admin-email">Email</Label>
                <Input id="admin-email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="admin-password">Nouveau mot de passe (laisser vide pour ne pas changer)</Label>
                <Input id="admin-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="mt-1" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
                <Button variant="outline" onClick={cancelEditing} disabled={saving}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-3">
              <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Nom</p>
                  <p className="text-sm font-medium text-foreground">{agent?.name || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground">{agent?.email || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3">
                <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Mot de passe</p>
                  <p className="text-sm font-medium text-foreground font-mono">••••••••••</p>
                </div>
              </div>
              <Button variant="outline" onClick={startEditing} className="w-full gap-2 mt-2">
                <Pencil className="h-4 w-4" />
                Modifier le profil
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
