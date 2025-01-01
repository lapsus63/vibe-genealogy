import { useRef, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { exportFile, importFile, isDemoMode } from "@/lib/genealogy/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";

export default function ImportExportPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<"gedcom" | "gefx" | "json" | null>(null);
  const queryClient = useQueryClient();

  async function handleFile(f: File) {
    setLoading(true);
    try {
      const res = await importFile(f);
      await queryClient.invalidateQueries({ queryKey: ["tree"] });
      await queryClient.invalidateQueries({ queryKey: ["tree-root"] });
      toast.success(`${res.imported} personnes importées`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import échoué");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(fmt: "gedcom" | "gefx" | "json") {
    setExporting(fmt);
    try {
      await exportFile(fmt);
      toast.success(`Export ${fmt.toUpperCase()} téléchargé`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export échoué");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6 space-y-4">
      <h1 className="text-xl font-bold">Import / Export</h1>

      {isDemoMode() && (
        <Card className="p-3 text-xs text-muted-foreground bg-muted/40">
          Mode démo : configurez <code>VITE_API_BASE_URL</code> pour activer l'import/export contre votre backend Spring Boot.
        </Card>
      )}

      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          <h2 className="font-semibold">Importer un fichier</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Formats acceptés : <b>.ged</b> (GEDCOM 5.5.1), <b>.gefx</b> (GEDCOM X), <b>.json</b> (format interne).
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".ged,.gefx,.json,.xml"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <Button onClick={() => inputRef.current?.click()} disabled={loading || exporting !== null}>
          {loading ? "Import…" : "Choisir un fichier"}
        </Button>
      </Card>

      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          <h2 className="font-semibold">Exporter</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["gedcom", "gefx", "json"] as const).map((fmt) => (
            <Button
              key={fmt}
              variant="outline"
              disabled={isDemoMode() || loading || exporting !== null}
              onClick={() => handleExport(fmt)}
            >
              {exporting === fmt ? "…" : fmt.toUpperCase()}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
