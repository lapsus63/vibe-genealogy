package com.family.tree.domain.port.in;

/** Cas d'usage d'édition des relations (filiation, union). */
public interface RelationEditing {
    /** Crée une union entre deux personnes (ordre non significatif). */
    String createUnion(String spouseA, String spouseB);
    void deleteUnion(String unionId);

    /** Ajoute un enfant à une union. */
    void addChild(String unionId, String childId);
    void removeChild(String unionId, String childId);
}
