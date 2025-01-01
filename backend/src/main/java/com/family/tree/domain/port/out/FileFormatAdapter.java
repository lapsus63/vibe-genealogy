package com.family.tree.domain.port.out;

import com.family.tree.domain.model.Genealogy;

import java.io.InputStream;
import java.io.OutputStream;

/**
 * Adapter d'import/export pour un format de fichier (gedcom, json, gefx…).
 * Exposé comme bean Spring ; découvert automatiquement par {@code ImportExportController}.
 */
public interface FileFormatAdapter {
    /** Identifiant du format (ex. {@code "gedcom"}, {@code "json"}, {@code "gefx"}). */
    String format();

    /** Fusionne le contenu dans {@code target} ; retourne le nombre d'entités importées. */
    int importInto(Genealogy target, InputStream in) throws Exception;

    /** Écrit l'arbre complet dans {@code out}. */
    void export(Genealogy source, OutputStream out) throws Exception;
}
