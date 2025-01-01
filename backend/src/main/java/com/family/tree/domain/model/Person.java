package com.family.tree.domain.model;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.List;

/**
 * Personne — entité racine du modèle généalogique.
 * Mutable via setters ; les modifications métier passent par les cas d'usage ({@code PersonEditing}).
 */
@JsonAutoDetect(getterVisibility = JsonAutoDetect.Visibility.ANY)
public class Person {
    private final String id;
    private String firstName;
    private String lastName;
    private Sex sex;
    private String biography;
    private String occupation;
    private final List<PersonEvent> events;
    private final List<MediaAsset> media;

    @JsonCreator
    public Person(
            @JsonProperty("id") String id,
            @JsonProperty("firstName") String firstName,
            @JsonProperty("lastName") String lastName,
            @JsonProperty("sex") Sex sex,
            @JsonProperty("biography") String biography,
            @JsonProperty("occupation") String occupation,
            @JsonProperty("events") List<PersonEvent> events,
            @JsonProperty("media") List<MediaAsset> media) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.sex = sex == null ? Sex.U : sex;
        this.biography = biography;
        this.occupation = occupation;
        this.events = events == null ? new ArrayList<>() : new ArrayList<>(events);
        this.media = media == null ? new ArrayList<>() : new ArrayList<>(media);
    }

    public Person(String id, String firstName, String lastName, Sex sex) {
        this(id, firstName, lastName, sex, null, null, null, null);
    }

    public String id() { return id; }
    public String firstName() { return firstName; }
    public String lastName() { return lastName; }
    public Sex sex() { return sex; }
    public String biography() { return biography; }
    public String occupation() { return occupation; }
    public List<PersonEvent> events() { return events; }
    public List<MediaAsset> media() { return media; }

    public void setFirstName(String v) { this.firstName = v; }
    public void setLastName(String v) { this.lastName = v; }
    public void setSex(Sex v) { this.sex = v; }
    public void setBiography(String v) { this.biography = v; }
    public void setOccupation(String v) { this.occupation = v; }

    public PersonEvent birthEvent() {
        return events.stream().filter(e -> e.type() == EventType.BIRTH).findFirst().orElse(null);
    }
    public PersonEvent deathEvent() {
        return events.stream().filter(e -> e.type() == EventType.DEATH).findFirst().orElse(null);
    }

    // JavaBean accessors for Jackson serialization
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public Sex getSex() { return sex; }
    public String getBiography() { return biography; }
    public String getOccupation() { return occupation; }
    public List<PersonEvent> getEvents() { return events; }
    public List<MediaAsset> getMedia() { return media; }
}
