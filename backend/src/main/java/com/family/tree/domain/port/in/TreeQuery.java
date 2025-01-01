package com.family.tree.domain.port.in;

import com.family.tree.domain.model.Genealogy;
import com.family.tree.domain.service.TreeExpander;

/** Cas d'usage de lecture de l'arbre. */
public interface TreeQuery {
    Genealogy fullTree();

    /**
     * Expansion autour d'une personne.
     * @param mode {@code MIXED}, {@code PEDIGREE} (asc seulement) ou {@code DESCENDANTS} (desc seulement)
     */
    TreeExpander.Subgraph expand(String rootId, int ascendants, int descendants, String mode);
}
