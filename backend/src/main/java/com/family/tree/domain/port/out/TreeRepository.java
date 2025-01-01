package com.family.tree.domain.port.out;

import com.family.tree.domain.model.Genealogy;

/**
 * Port de persistance de l'agrégat généalogique.
 * L'implémentation charge l'arbre en mémoire et le persiste (GEDCOM + WAL).
 */
public interface TreeRepository {
    /** Retourne l'agrégat courant (toujours la même instance après le bootstrap). */
    Genealogy load();

    /** Persiste les mutations (marque dirty + WAL ; snapshot asynchrone éventuel). */
    void save(Genealogy genealogy);
}
