import { useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/genealogy/auth-context";
import { Button } from "@/components/ui/button";
import { TreePine, Search, Users, Upload, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AuthenticatedLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }

  const links = [
    { to: "/tree", label: "Arbre", icon: TreePine },
    { to: "/search", label: "Recherche", icon: Search },
    { to: "/kinship", label: "Parenté", icon: Users },
    { to: "/import-export", label: "Import/Export", icon: Upload },
  ] as const;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b bg-card/80 backdrop-blur px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <TreePine className="h-5 w-5 shrink-0 text-primary" />
          <span className="truncate text-sm font-semibold">Arbre généalogique</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="hidden text-xs text-muted-foreground sm:inline mr-2">{user.username}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <nav className="flex items-center gap-1 overflow-x-auto border-b bg-card/60 px-2 py-1">
        {links.map((l) => {
          const Icon = l.icon;
          const active = pathname.startsWith(l.to);
          return (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {l.label}
            </Link>
          );
        })}
      </nav>

      <main className="flex-1 min-h-0">
        <Outlet />
      </main>
    </div>
  );
}
