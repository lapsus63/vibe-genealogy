package com.family.tree.domain.model;

import java.util.List;

/** Un fichier média rattaché à une personne (photo, audio, vidéo, document). */
public record MediaAsset(
    String id,
    String url,
    String caption,
    String date,
    Kind kind
) {
    public enum Kind { photo, audio, video, document }
}
