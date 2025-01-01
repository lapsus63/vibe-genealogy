import { useState } from "react";
import { TreeCanvas } from "@/components/tree/TreeCanvas";
import { ExpansionControls } from "@/components/tree/ExpansionControls";
import { useTreeStore } from "@/lib/genealogy/store";
import { Button } from "@/components/ui/button";
import { Settings2, X } from "lucide-react";
import { toast } from "sonner";

export default function TreePage() {
  const setRoot = useTreeStore((s) => s.setRoot);
  const rootId = useTreeStore((s) => s.rootId);
  const [showControls, setShowControls] = useState(false);

  return (
    <div className="relative h-[calc(100vh-96px)] w-full">
      <TreeCanvas
        onNodeClick={(id) => {
          if (id === rootId) return;
          setRoot(id);
          toast.success("Arbre recentré", { duration: 1200 });
        }}
      />

      {/* Bouton flottant pour ouvrir les options d'affichage */}
      <div className="absolute top-3 right-3 z-20">
        {!showControls ? (
          <Button
            size="sm"
            variant="secondary"
            className="shadow-md"
            onClick={() => setShowControls(true)}
          >
            <Settings2 className="h-4 w-4 mr-1.5" />
            Options
          </Button>
        ) : (
          <div className="w-64 max-w-[calc(100vw-24px)] relative">
            <Button
              size="icon"
              variant="ghost"
              className="absolute -top-1 -right-1 z-10 h-7 w-7 rounded-full bg-card border shadow"
              onClick={() => setShowControls(false)}
              aria-label="Fermer les options"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
            <ExpansionControls />
          </div>
        )}
      </div>
    </div>
  );
}
