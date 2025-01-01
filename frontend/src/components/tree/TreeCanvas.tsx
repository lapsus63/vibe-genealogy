import { useMemo, useCallback, useState, useRef, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  type NodeMouseHandler,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import { useQuery } from "@tanstack/react-query";
import { fetchExpand, fetchTreeRoot } from "@/lib/genealogy/api";
import { useTreeStore } from "@/lib/genealogy/store";
import { layoutGraph, type HiddenInfo, NODE_W, NODE_H } from "@/lib/genealogy/layout";
import { PersonNode } from "./PersonNode";

const nodeTypes = { person: PersonNode };

function isTouchDevice() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

function TreeCanvasInner({ onNodeClick }: { onNodeClick?: (id: string) => void }) {
  const { rootId, ascendants, descendants, mode, layoutAlgo, recenterOnClick, resetView } =
    useTreeStore();
  const rf = useReactFlow();
  const touch = useMemo(isTouchDevice, []);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const pressTimer = useRef<number | null>(null);
  const anchorRef = useRef<{ id: string; screenX: number; screenY: number } | null>(null);


  const { data, isLoading, error } = useQuery({
    queryKey: ["tree", rootId, ascendants, descendants, mode],
    queryFn: () => fetchExpand({ rootId, ascendants, descendants, mode }),
  });

  const { data: full } = useQuery({ queryKey: ["tree-root"], queryFn: fetchTreeRoot });

  const hidden = useMemo<Record<string, HiddenInfo>>(() => {
    if (!data || !full) return {};
    const visible = new Set(data.nodes.map((n) => n.id));
    const map: Record<string, HiddenInfo> = {};
    for (const id of visible) {
      map[id] = { hasHiddenParents: false, hasHiddenChildren: false, hasHiddenSpouses: false };
    }
    for (const e of full.edges) {
      if (e.type === "PARENT_CHILD") {
        if (visible.has(e.target) && !visible.has(e.source)) map[e.target].hasHiddenParents = true;
        if (visible.has(e.source) && !visible.has(e.target)) map[e.source].hasHiddenChildren = true;
      } else if (e.type === "SPOUSE") {
        if (visible.has(e.source) && !visible.has(e.target)) map[e.source].hasHiddenSpouses = true;
        if (visible.has(e.target) && !visible.has(e.source)) map[e.target].hasHiddenSpouses = true;
      }
    }
    return map;
  }, [data, full]);

  const laid = useMemo(
    () => (data ? layoutGraph(data, mode, hidden, layoutAlgo) : { nodes: [], edges: [] }),
    [data, mode, hidden, layoutAlgo],
  );

  // On touch devices, lock drag by default; unlock a node after long-press.
  const nodes = useMemo<Node[]>(() => {
    if (!touch) return laid.nodes;
    return laid.nodes.map((n) => ({
      ...n,
      draggable: unlockedIds.has(n.id),
      className: unlockedIds.has(n.id) ? "ring-2 ring-primary rounded-xl" : n.className,
    }));
  }, [laid.nodes, touch, unlockedIds]);

  useEffect(() => {
    if (unlockedIds.size === 0) return;
    const t = window.setTimeout(() => setUnlockedIds(new Set()), 6000);
    return () => window.clearTimeout(t);
  }, [unlockedIds]);

  // Re-fit view once the expand/collapse transition has settled.
  const graphSignature = useMemo(
    () => laid.nodes.map((n) => n.id).sort().join("|"),
    [laid.nodes],
  );
  useEffect(() => {
    if (laid.nodes.length === 0) return;
    if (!recenterOnClick) {
      // Option désactivée : on garde exactement le même cadrage à l'écran,
      // en compensant le déplacement du nœud cliqué dû au nouveau layout.
      const anchor = anchorRef.current;
      anchorRef.current = null;
      if (!anchor) return;
      const n = laid.nodes.find((x) => x.id === anchor.id);
      if (!n) return;
      const vp = rf.getViewport();
      rf.setViewport({
        x: anchor.screenX - n.position.x * vp.zoom,
        y: anchor.screenY - n.position.y * vp.zoom,
        zoom: vp.zoom,
      });
      return;
    }
    const t = window.setTimeout(() => {
      rf.fitView({ padding: 0.2, duration: 350 });
    }, 220);
    return () => window.clearTimeout(t);
  }, [graphSignature, rf, laid.nodes, laid.nodes.length, recenterOnClick]);

  const handleClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (recenterOnClick) {
        onNodeClick?.(node.id);
        rf.setCenter(node.position.x + NODE_W / 2, node.position.y + NODE_H / 2, {
          zoom: rf.getZoom(),
          duration: 300,
        });
      } else {
        // Mémorise la position écran du nœud avant le recalcul du layout.
        const vp = rf.getViewport();
        anchorRef.current = {
          id: node.id,
          screenX: node.position.x * vp.zoom + vp.x,
          screenY: node.position.y * vp.zoom + vp.y,
        };
        onNodeClick?.(node.id);
      }
    },
    [onNodeClick, recenterOnClick, rf],
  );


  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const el = (e.target as HTMLElement).closest("[data-id]") as HTMLElement | null;
    if (!el) return;
    const id = el.getAttribute("data-id");
    if (!id) return;
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    pressTimer.current = window.setTimeout(() => {
      setUnlockedIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(30);
    }, 450);
  }, []);

  const cancelPress = useCallback(() => {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }, []);

  const handlePaneClick = useCallback(() => {
    resetView();
    setUnlockedIds(new Set());
  }, [resetView]);

  if (error) {
    return (
      <div className="grid h-full place-items-center text-sm text-destructive">
        Erreur de chargement de l'arbre.
      </div>
    );
  }

  return (
    <div
      className="relative h-full w-full"
      onTouchStart={touch ? handleTouchStart : undefined}
      onTouchEnd={touch ? cancelPress : undefined}
      onTouchMove={touch ? cancelPress : undefined}
    >
      {isLoading && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-background/60 text-sm text-muted-foreground">
          Chargement…
        </div>
      )}
      {touch && unlockedIds.size > 0 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 rounded-full bg-primary text-primary-foreground text-xs px-3 py-1 shadow">
          Nœud déverrouillé — glissez pour déplacer
        </div>
      )}
      <ReactFlow className={!recenterOnClick ? "no-node-transition" : undefined}
        nodes={nodes}
        edges={laid.edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleClick}
        onPaneClick={handlePaneClick}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        panOnDrag
        panOnScroll={false}
        zoomOnPinch
        selectionOnDrag={false}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.15}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} size={1} />
        <Controls showInteractive={false} className="!bottom-4 !left-4" />
        <MiniMap pannable zoomable className="!hidden md:!block" />
      </ReactFlow>
      {touch && (
        <div className="absolute bottom-4 right-4 z-20 max-w-[220px] rounded-md bg-card/90 backdrop-blur border px-2 py-1 text-[10px] text-muted-foreground shadow">
          Appui long sur un nœud pour le déplacer • touchez le vide pour tout réafficher
        </div>
      )}
    </div>
  );
}

export function TreeCanvas(props: { onNodeClick?: (id: string) => void }) {
  return (
    <ReactFlowProvider>
      <TreeCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
