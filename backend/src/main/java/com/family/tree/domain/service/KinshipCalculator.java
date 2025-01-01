package com.family.tree.domain.service;

import com.family.tree.domain.model.Genealogy;
import java.util.*;

/**
 * Calcule le lien de parenté entre deux personnes en trouvant leur ancêtre commun
 * le plus récent (MRCA) puis en traduisant les distances en libellé humain
 * ("cousin au 3ᵉ degré", "petit-neveu", …).
 */
public class KinshipCalculator {

    public record Kinship(String label, int mrcaDepthA, int mrcaDepthB, String mrcaId) {}

    public Kinship compute(Genealogy g, String a, String b) {
        if (a.equals(b)) return new Kinship("Même personne", 0, 0, a);
        Map<String, Integer> ancA = ancestorsDepth(g, a);
        Map<String, Integer> ancB = ancestorsDepth(g, b);

        String bestMrca = null;
        int bestDepthA = Integer.MAX_VALUE, bestDepthB = Integer.MAX_VALUE;
        long bestTotal = Long.MAX_VALUE;
        for (var e : ancA.entrySet()) {
            Integer db = ancB.get(e.getKey());
            if (db == null) continue;
            long total = (long) e.getValue() + db;
            if (total < bestTotal) {
                bestMrca = e.getKey();
                bestDepthA = e.getValue();
                bestDepthB = db;
                bestTotal = total;
            }
        }
        if (bestMrca == null) return new Kinship("Aucun lien trouvé", -1, -1, null);
        return new Kinship(label(bestDepthA, bestDepthB), bestDepthA, bestDepthB, bestMrca);
    }

    /** Inclut la personne elle-même à la profondeur 0. */
    private Map<String, Integer> ancestorsDepth(Genealogy g, String id) {
        Map<String, Integer> depth = new HashMap<>();
        Deque<String> stack = new ArrayDeque<>();
        depth.put(id, 0);
        stack.push(id);
        while (!stack.isEmpty()) {
            String cur = stack.pop();
            int d = depth.get(cur);
            for (String p : g.parentsOf(cur)) {
                if (!depth.containsKey(p) || depth.get(p) > d + 1) {
                    depth.put(p, d + 1);
                    stack.push(p);
                }
            }
        }
        return depth;
    }

    private String label(int a, int b) {
        if (a == 0) return removedLabel("Descendant", b);
        if (b == 0) return removedLabel("Ancêtre", a);
        if (a == 1 && b == 1) return "Frère/sœur";
        if (a == 1) return b == 2 ? "Neveu/nièce" : "Petit-neveu/nièce (" + (b - 1) + "ᵉ degré)";
        if (b == 1) return a == 2 ? "Oncle/tante" : "Grand-oncle/tante (" + (a - 1) + "ᵉ degré)";
        int degree = Math.min(a, b) - 1;
        int removed = Math.abs(a - b);
        String base = "Cousin(e) au " + degree + (degree == 1 ? "ᵉʳ" : "ᵉ") + " degré";
        return removed == 0 ? base : base + " (issu de germain × " + removed + ")";
    }

    private String removedLabel(String base, int gens) {
        return switch (gens) {
            case 1 -> base + " (parent/enfant)";
            case 2 -> "Grand-" + base.toLowerCase();
            case 3 -> "Arrière-grand-" + base.toLowerCase();
            default -> base + " (" + gens + " générations)";
        };
    }
}
