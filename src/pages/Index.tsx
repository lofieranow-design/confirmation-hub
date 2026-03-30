import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, ArrowRight, CheckCircle2, BarChart3, FileSpreadsheet } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background wave-bg">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-mint/10" />
        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 animate-float">
              <Package className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-tight">
              ConfirmaPro
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
              Gérez vos confirmations de commandes efficacement. Collectez, suivez et exportez en toute simplicité.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/login")}
              className="h-14 px-10 text-base font-semibold gap-2 rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-[1.02]"
            >
              Accéder à mon espace
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-16 relative">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { icon: CheckCircle2, title: "Confirmations faciles", desc: "Formulaire mobile optimisé pour vos clients" },
            { icon: BarChart3, title: "Statistiques en direct", desc: "Suivez vos performances jour, semaine et mois" },
            { icon: FileSpreadsheet, title: "Export Excel", desc: "Téléchargez vos données en un clic" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card rounded-2xl p-7 text-center space-y-4 animate-fade-in hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                <Icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
