package com.family.tree.application;

import com.family.tree.domain.model.*;
import com.family.tree.domain.port.in.*;
import com.family.tree.domain.port.out.TreeRepository;
import com.family.tree.domain.service.TreeExpander;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Orchestration des cas d'usage : délègue au domaine et notifie le repository
 * après chaque mutation pour déclencher persistance + WAL.
 */
@Service
public class GenealogyService implements TreeQuery, PersonEditing, RelationEditing {

    private final TreeRepository repository;
    private final TreeExpander expander = new TreeExpander();
    private Genealogy cache;

    public GenealogyService(TreeRepository repository) {
        this.repository = repository;
        this.cache = repository.load();
    }

    private Genealogy g() { return cache; }
    private void touch() { repository.save(cache); }

    @Override public Genealogy fullTree() { return g(); }

    @Override
    public TreeExpander.Subgraph expand(String rootId, int ascendants, int descendants, String mode) {
        int asc = ascendants;
        int desc = descendants;
        if (mode != null) {
            switch (mode.toUpperCase()) {
                case "PEDIGREE" -> desc = 0;
                case "DESCENDANTS" -> asc = 0;
                default -> { /* MIXED */ }
            }
        }
        return expander.expand(g(), rootId, asc, desc);
    }

    @Override
    public Person create(String firstName, String lastName, Sex sex) {
        Person p = new Person("I" + UUID.randomUUID().toString().substring(0, 8), firstName, lastName, sex);
        g().addPerson(p);
        touch();
        return p;
    }

    @Override
    public Person update(String id, String firstName, String lastName, Sex sex, String biography, String occupation) {
        Person p = g().person(id);
        if (p == null) throw new IllegalArgumentException("Personne introuvable : " + id);
        if (firstName != null) p.setFirstName(firstName);
        if (lastName != null) p.setLastName(lastName);
        if (sex != null) p.setSex(sex);
        if (biography != null) p.setBiography(biography);
        if (occupation != null) p.setOccupation(occupation);
        touch();
        return p;
    }

    @Override
    public void delete(String id) { g().removePerson(id); touch(); }

    @Override
    public String createUnion(String a, String b) {
        Union u = new Union("F" + UUID.randomUUID().toString().substring(0, 8), a, b);
        g().addUnion(u);
        touch();
        return u.id();
    }

    @Override public void deleteUnion(String unionId) { g().removeUnion(unionId); touch(); }

    @Override
    public void addChild(String unionId, String childId) {
        Union u = g().union(unionId);
        if (u == null) throw new IllegalArgumentException("Union introuvable : " + unionId);
        if (!u.children().contains(childId)) u.children().add(childId);
        touch();
    }

    @Override
    public void removeChild(String unionId, String childId) {
        Union u = g().union(unionId);
        if (u != null) u.children().remove(childId);
        touch();
    }
}
