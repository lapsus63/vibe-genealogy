package com.family.tree.domain.service;

import com.family.tree.domain.model.Genealogy;
import java.util.*;

/**
 * Extrait un sous-graphe autour d'une personne : N générations d'ascendants + M de descendants.
 * Inclut systématiquement les conjoints des personnes retenues.
 */
public class TreeExpander {

    public record Subgraph(Set<String> personIds, Set<String> unionIds) {}

    public Subgraph expand(Genealogy g, String rootId, int ascendants, int descendants) {
        Set<String> keep = new LinkedHashSet<>();
        keep.add(rootId);
        walkUp(g, rootId, ascendants, keep);
        walkDown(g, rootId, descendants, keep);

        // Inclut les conjoints des personnes retenues
        for (String id : new ArrayList<>(keep)) keep.addAll(g.spousesOf(id));

        Set<String> unionIds = new LinkedHashSet<>();
        g.allUnions().forEach(u -> {
            boolean a = u.spouseA() != null && keep.contains(u.spouseA());
            boolean b = u.spouseB() != null && keep.contains(u.spouseB());
            boolean anyChild = u.children().stream().anyMatch(keep::contains);
            if (a || b || anyChild) unionIds.add(u.id());
        });
        return new Subgraph(keep, unionIds);
    }

    private void walkUp(Genealogy g, String id, int depth, Set<String> acc) {
        if (depth <= 0) return;
        for (String p : g.parentsOf(id)) {
            if (acc.add(p)) walkUp(g, p, depth - 1, acc);
        }
    }

    private void walkDown(Genealogy g, String id, int depth, Set<String> acc) {
        if (depth <= 0) return;
        for (String c : g.childrenOf(id)) {
            if (acc.add(c)) walkDown(g, c, depth - 1, acc);
        }
    }
}
