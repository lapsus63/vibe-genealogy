import dagre from "dagre";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
  type SimulationNodeDatum,
} from "d3-force";
import { MarkerType, type Edge, type Node } from "reactflow";
import type { TreeGraph, TreeViewMode } from "./types";
import type { LayoutAlgo } from "./store";

export const NODE_W = 164;
export const NODE_H = 112;

const PARENT_STROKE = "#0f766e";
const SPOUSE_STROKE = "#d97706";

export interface LaidOut {
  nodes: Node[];
  edges: Edge[];
}

export interface HiddenInfo {
  hasHiddenParents: boolean;
  hasHiddenChildren: boolean;
  hasHiddenSpouses: boolean;
}

interface Positioned {
  id: string;
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Ranks (generation levels) computed from the parent-child edges, using the
 * tree root as generation 0. Ancestors get negative ranks, descendants
 * positive. Fallback to 0 when unreachable.
 */
function computeGenerations(graph: TreeGraph): Map<string, number> {
  const gen = new Map<string, number>();
  const parents: Record<string, string[]> = {};
  const children: Record<string, string[]> = {};
  for (const n of graph.nodes) {
    parents[n.id] = [];
    children[n.id] = [];
  }
  for (const e of graph.edges) {
    if (e.type !== "PARENT_CHILD") continue;
    children[e.source]?.push(e.target);
    parents[e.target]?.push(e.source);
  }
  const queue: Array<{ id: string; g: number }> = [{ id: graph.rootId, g: 0 }];
  while (queue.length) {
    const { id, g } = queue.shift()!;
    if (gen.has(id)) continue;
    gen.set(id, g);
    for (const c of children[id] ?? []) queue.push({ id: c, g: g + 1 });
    for (const p of parents[id] ?? []) queue.push({ id: p, g: g - 1 });
  }
  // Spread through spouses (same generation)
  let changed = true;
  while (changed) {
    changed = false;
    for (const e of graph.edges) {
      if (e.type !== "SPOUSE") continue;
      if (gen.has(e.source) && !gen.has(e.target)) {
        gen.set(e.target, gen.get(e.source)!);
        changed = true;
      } else if (gen.has(e.target) && !gen.has(e.source)) {
        gen.set(e.source, gen.get(e.target)!);
        changed = true;
      }
    }
  }
  for (const n of graph.nodes) if (!gen.has(n.id)) gen.set(n.id, 0);
  return gen;
}

/**
 * After a layout, place spouses side-by-side by nudging the less-connected
 * partner next to the more-connected one. Also equalises their Y.
 */
function pinSpousesSideBySide(
  graph: TreeGraph,
  positions: Map<string, Positioned>,
): void {
  const degree = new Map<string, number>();
  for (const n of graph.nodes) degree.set(n.id, 0);
  for (const e of graph.edges) {
    if (e.type !== "PARENT_CHILD") continue;
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }
  const gap = NODE_W + 30;
  for (const e of graph.edges) {
    if (e.type !== "SPOUSE") continue;
    const a = positions.get(e.source);
    const b = positions.get(e.target);
    if (!a || !b) continue;
    const [anchor, mover] = (degree.get(e.source) ?? 0) >= (degree.get(e.target) ?? 0)
      ? [a, b]
      : [b, a];
    mover.y = anchor.y;
    mover.x = anchor.x + (mover.x >= anchor.x ? gap : -gap);
  }
}

/**
 * After all placement, resolve any remaining horizontal overlaps between
 * nodes on similar Y bands by nudging them apart. Simple sweep-based
 * separation; cheap and effective for small trees.
 */
function resolveOverlaps(positions: Map<string, Positioned>): void {
  const gapX = NODE_W + 20;
  const gapY = NODE_H + 12;
  const list = Array.from(positions.values());
  for (let iter = 0; iter < 6; iter++) {
    let moved = false;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        if (Math.abs(dx) < gapX && Math.abs(dy) < gapY) {
          const push = (gapX - Math.abs(dx)) / 2 + 1;
          if (dx >= 0) {
            a.x -= push;
            b.x += push;
          } else {
            a.x += push;
            b.x -= push;
          }
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
}

// ---------------------------------------------------------------------------
// Layout algorithms
// ---------------------------------------------------------------------------

function layoutDagre(graph: TreeGraph, mode: TreeViewMode): Map<string, Positioned> {
  const g = new dagre.graphlib.Graph({ compound: false });
  g.setGraph({
    rankdir: mode === "PEDIGREE" ? "BT" : "TB",
    nodesep: 50,
    ranksep: 110,
    marginx: 24,
    marginy: 24,
  });
  g.setDefaultEdgeLabel(() => ({}));
  for (const n of graph.nodes) g.setNode(n.id, { width: NODE_W, height: NODE_H });
  for (const e of graph.edges) {
    if (e.type === "PARENT_CHILD") g.setEdge(e.source, e.target);
    // spouses handled by post-processing (side-by-side)
  }
  dagre.layout(g);
  const out = new Map<string, Positioned>();
  for (const n of graph.nodes) {
    const p = g.node(n.id);
    out.set(n.id, { id: n.id, x: p.x, y: p.y });
  }
  return out;
}

interface SimNode extends SimulationNodeDatum {
  id: string;
  fy?: number | null;
}

function layoutForce(
  graph: TreeGraph,
  variant: "FORCE" | "FRUCHTERMAN",
): Map<string, Positioned> {
  const generations = computeGenerations(graph);
  const rowH = Math.max(180, NODE_H + 110);
  const nodes: SimNode[] = graph.nodes.map((n, i) => ({
    id: n.id,
    x: (i % 8) * (NODE_W + 60) - 400,
    y: (generations.get(n.id) ?? 0) * rowH,
    fy: (generations.get(n.id) ?? 0) * rowH, // lock Y to generation row
  }));
  const idx = new Map(nodes.map((n) => [n.id, n]));
  const links = graph.edges
    .filter((e) => idx.has(e.source) && idx.has(e.target))
    .map((e) => ({
      source: e.source,
      target: e.target,
      isSpouse: e.type === "SPOUSE",
    }));

  const distance = variant === "FRUCHTERMAN" ? NODE_W + 60 : NODE_W + 110;
  const charge = variant === "FRUCHTERMAN" ? -1400 : -1800;

  const sim = forceSimulation(nodes)
    .force(
      "link",
      forceLink(links)
        .id((d) => (d as SimNode).id)
        .distance((l) => ((l as { isSpouse: boolean }).isSpouse ? NODE_W + 30 : distance))
        .strength((l) => ((l as { isSpouse: boolean }).isSpouse ? 1 : 0.35)),
    )
    .force("charge", forceManyBody().strength(charge).distanceMax(1200))
    .force("collide", forceCollide(NODE_W * 0.75).strength(1).iterations(4))
    .force("center", forceCenter(0, 0))
    .force("x", forceX(0).strength(0.02))
    .force("y", forceY((d) => (d as SimNode).fy ?? 0).strength(1))
    .stop();

  const iterations = variant === "FRUCHTERMAN" ? 600 : 500;
  for (let i = 0; i < iterations; i++) sim.tick();

  const out = new Map<string, Positioned>();
  for (const n of nodes) out.set(n.id, { id: n.id, x: n.x ?? 0, y: n.y ?? 0 });
  return out;
}

function layoutRadial(graph: TreeGraph): Map<string, Positioned> {
  const generations = computeGenerations(graph);
  const buckets = new Map<number, string[]>();
  for (const [id, g] of generations) {
    if (!buckets.has(g)) buckets.set(g, []);
    buckets.get(g)!.push(id);
  }
  const out = new Map<string, Positioned>();
  const ringGap = 260;
  // Minimal arc length per node to avoid collisions on a ring.
  const minArc = NODE_W + 40;
  for (const [gen, ids] of buckets) {
    const count = ids.length;
    if (gen === 0) {
      ids.forEach((id, i) =>
        out.set(id, { id, x: (i - (count - 1) / 2) * (NODE_W + 40), y: 0 }),
      );
      continue;
    }
    // Ensure ring radius is large enough to space nodes without overlap.
    const baseR = Math.abs(gen) * ringGap;
    const minR = (count * minArc) / (2 * Math.PI);
    const r = Math.max(baseR, minR);
    ids.forEach((id, i) => {
      const angle = (i / count) * Math.PI * 2;
      out.set(id, {
        id,
        x: Math.cos(angle) * r,
        y: gen * ringGap * 0.7 + Math.sin(angle) * r * 0.55,
      });
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function layoutGraph(
  graph: TreeGraph,
  mode: TreeViewMode,
  hidden?: Record<string, HiddenInfo>,
  algo: LayoutAlgo = "DAGRE",
): LaidOut {
  let positions: Map<string, Positioned>;
  switch (algo) {
    case "FORCE":
      positions = layoutForce(graph, "FORCE");
      break;
    case "FRUCHTERMAN":
      positions = layoutForce(graph, "FRUCHTERMAN");
      break;
    case "RADIAL":
      positions = layoutRadial(graph);
      break;
    case "DAGRE":
    default:
      positions = layoutDagre(graph, mode);
      break;
  }

  pinSpousesSideBySide(graph, positions);
  resolveOverlaps(positions);

  const nodes: Node[] = graph.nodes.map((n) => {
    const pos = positions.get(n.id) ?? { x: 0, y: 0 };
    const h = hidden?.[n.id];
    return {
      id: n.id,
      type: "person",
      position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 },
      data: {
        person: n,
        isRoot: n.id === graph.rootId,
        hasHiddenParents: !!h?.hasHiddenParents,
        hasHiddenChildren: !!h?.hasHiddenChildren,
        hasHiddenSpouses: !!h?.hasHiddenSpouses,
      },
    };
  });

  const edges: Edge[] = graph.edges.map((e) => {
    if (e.type === "SPOUSE") {
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: "r",
        targetHandle: "l",
        type: "straight",
        style: {
          stroke: SPOUSE_STROKE,
          strokeWidth: 2.5,
          strokeDasharray: "6 4",
        },
      };
    }
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: "b",
      targetHandle: "t",
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, color: PARENT_STROKE, width: 18, height: 18 },
      style: { stroke: PARENT_STROKE, strokeWidth: 2 },
    };
  });

  return { nodes, edges };
}
