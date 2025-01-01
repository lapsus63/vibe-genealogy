package com.family.tree.domain.model;

/** Un événement biographique lié à une personne ou une union. */
public record PersonEvent(
    String id,
    EventType type,
    ApproximateDate date,
    String place,
    String description
) {}
