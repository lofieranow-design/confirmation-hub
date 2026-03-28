import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, ArrowRight, CheckCircle2, BarChart3, FileSpreadsheet } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
              <Package className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-tight">
              ConfirmaPro
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Gérez vos confirmations de commandes efficacement. Collectez, suivez et exportez en toute simplicité.
            </p>
            <Button size="lg" onClick={() => navigate("/login")} className="h-13 px-8 text-base font-semibold gap-2">
              Accéder à mon espace
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { icon: CheckCircle2, title: "Confirmations faciles", desc: "Formulaire mobile optimisé pour vos clients" },
            { icon: BarChart3, title: "Statistiques en direct", desc: "Suivez vos performances jour, semaine et mois" },
            { icon: FileSpreadsheet, title: "Export Excel", desc: "Téléchargez vos données en un clic" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border bg-card p-6 text-center space-y-3 animate-fade-in">
              <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-card-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
