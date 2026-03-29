import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, User, Mail, Lock, Eye, EyeOff } from "lucide-react";

interface AdminProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminProfileModal({ open, onOpenChange }: AdminProfileModalProps) {
  const [showPassword, setShowPassword] = useState(false);

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
          <div className="w-full space-y-3">
            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Nom</p>
                <p className="text-sm font-medium text-foreground">Marouane Admin</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground">marouane@ecom.ma</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3">
              <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Mot de passe</p>
                <p className="text-sm font-medium text-foreground font-mono">
                  {showPassword ? "LMlm171124" : "••••••••••"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
