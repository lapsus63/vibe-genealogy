import { create } from "zustand";
import type { TreeViewMode } from "./types";

export type LayoutAlgo = "DAGRE" | "FORCE" | "FRUCHTERMAN" | "RADIAL";

const INITIAL_ROOT = "I5";

interface TreeState {
  rootId: string;
  initialRootId: string;
  ascendants: number;
  descendants: number;
  mode: TreeViewMode;
  /** When true, clicking a node recenters the tree (changes root + refetch subgraph). */
  recenterOnClick: boolean;
  layoutAlgo: LayoutAlgo;
  setRoot: (id: string) => void;
  setAsc: (n: number) => void;
  setDesc: (n: number) => void;
  setMode: (m: TreeViewMode) => void;
  toggleRecenterOnClick: () => void;
  setLayoutAlgo: (a: LayoutAlgo) => void;
  resetView: () => void;
}

export const useTreeStore = create<TreeState>((set) => ({
  rootId: INITIAL_ROOT,
  initialRootId: INITIAL_ROOT,
  ascendants: 2,
  descendants: 2,
  mode: "MIXED",
  recenterOnClick: true,
  layoutAlgo: "DAGRE",
  setRoot: (id) => set({ rootId: id }),
  setAsc: (n) => set({ ascendants: Math.max(0, Math.min(8, n)) }),
  setDesc: (n) => set({ descendants: Math.max(0, Math.min(8, n)) }),
  setMode: (m) => set({ mode: m }),
  toggleRecenterOnClick: () => set((s) => ({ recenterOnClick: !s.recenterOnClick })),
  setLayoutAlgo: (a) => set({ layoutAlgo: a }),
  resetView: () =>
    set((s) => ({ rootId: s.initialRootId, ascendants: 8, descendants: 8, mode: "MIXED" })),
}));
