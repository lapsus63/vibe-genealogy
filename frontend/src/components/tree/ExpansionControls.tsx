import { useTreeStore, type LayoutAlgo } from "@/lib/genealogy/store";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUp, ArrowDown, GitBranch } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";

const ALGO_LABELS: Record<LayoutAlgo, string> = {
  DAGRE: "Hiérarchique (Dagre)",
  FORCE: "Force Atlas 2",
  FRUCHTERMAN: "Fruchterman-Reingold",
  RADIAL: "Radial (générations)",
};

export function ExpansionControls() {
  const {
    ascendants,
    descendants,
    mode,
    setAsc,
    setDesc,
    setMode,
    recenterOnClick,
    toggleRecenterOnClick,
    layoutAlgo,
    setLayoutAlgo,
  } = useTreeStore();

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card/95 backdrop-blur p-3 shadow-md">
      <TooltipProvider delayDuration={200}>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => v && setMode(v as typeof mode)}
          className="justify-start"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem value="PEDIGREE" aria-label="Ascendants">
                <ArrowUp className="h-4 w-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>Ascendants</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem value="MIXED" aria-label="Mixte">
                <GitBranch className="h-4 w-4" />{" "}
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>Mixte</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem value="DESCENDANTS" aria-label="Descendants">
                <ArrowDown className="h-4 w-4" />{" "}
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>Descendants</TooltipContent>
          </Tooltip>
        </ToggleGroup>
      </TooltipProvider>

      <div className="space-y-1">
        <Label className="text-xs">Ascendants : {ascendants}</Label>
        <Slider value={[ascendants]} min={0} max={8} step={1} onValueChange={([v]) => setAsc(v)} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Descendants : {descendants}</Label>
        <Slider
          value={[descendants]}
          min={0}
          max={8}
          step={1}
          onValueChange={([v]) => setDesc(v)}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Algorithme de disposition</Label>
        <Select value={layoutAlgo} onValueChange={(v) => setLayoutAlgo(v as LayoutAlgo)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(ALGO_LABELS) as LayoutAlgo[]).map((k) => (
              <SelectItem key={k} value={k} className="text-xs">
                {ALGO_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t">
        <div className="flex-1">
          <Label htmlFor="recenter-toggle" className="text-xs cursor-pointer">
            Recentrer au clic
          </Label>
          <p className="text-[10px] text-muted-foreground leading-tight">
            Change la racine et replie les autres branches
          </p>
        </div>
        <Switch
          id="recenter-toggle"
          checked={recenterOnClick}
          onCheckedChange={toggleRecenterOnClick}
        />
      </div>
    </div>
  );
}
