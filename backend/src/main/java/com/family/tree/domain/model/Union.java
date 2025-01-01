package com.family.tree.domain.model;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.List;

/** Une union entre deux personnes (mariage, concubinage, PACS…) et leurs enfants communs. */
@JsonAutoDetect(getterVisibility = JsonAutoDetect.Visibility.ANY)
public class Union {
    private final String id;
    private String spouseA;
    private String spouseB;
    private final List<String> children;
    private final List<PersonEvent> events;

    @JsonCreator
    public Union(
            @JsonProperty("id") String id,
            @JsonProperty("spouseA") String spouseA,
            @JsonProperty("spouseB") String spouseB,
            @JsonProperty("children") List<String> children,
            @JsonProperty("events") List<PersonEvent> events) {
        this.id = id;
        this.spouseA = spouseA;
        this.spouseB = spouseB;
        this.children = children == null ? new ArrayList<>() : new ArrayList<>(children);
        this.events = events == null ? new ArrayList<>() : new ArrayList<>(events);
    }

    public Union(String id, String spouseA, String spouseB) {
        this(id, spouseA, spouseB, null, null);
    }

    public String id() { return id; }
    public String spouseA() { return spouseA; }
    public String spouseB() { return spouseB; }
    public List<String> children() { return children; }
    public List<PersonEvent> events() { return events; }

    public void setSpouseA(String v) { this.spouseA = v; }
    public void setSpouseB(String v) { this.spouseB = v; }

    // JavaBean accessors for Jackson serialization
    public String getSpouseA() { return spouseA; }
    public String getSpouseB() { return spouseB; }
    public List<String> getChildren() { return children; }
    public List<PersonEvent> getEvents() { return events; }
}
