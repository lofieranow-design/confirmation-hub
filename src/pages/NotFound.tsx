import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background wave-bg">
      <div className="text-center glass-card rounded-3xl p-12 animate-fade-in">
        <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
        <p className="mb-6 text-xl text-muted-foreground">Page introuvable</p>
        <a href="/" className="text-primary font-semibold underline hover:text-primary/80 transition-colors">
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
};

export default NotFound;
