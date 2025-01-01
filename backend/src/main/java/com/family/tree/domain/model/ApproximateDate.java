package com.family.tree.domain.model;

/** Date approximative de type généalogique ("1850", "abt 1850", "bef 1900"). */
public record ApproximateDate(String raw, Integer year) {
    public static ApproximateDate of(String raw) {
        if (raw == null || raw.isBlank()) return null;
        Integer year = null;
        // Extrait la première année à 4 chiffres si présente.
        var m = java.util.regex.Pattern.compile("(\\d{4})").matcher(raw);
        if (m.find()) year = Integer.parseInt(m.group(1));
        return new ApproximateDate(raw.trim(), year);
    }
}
