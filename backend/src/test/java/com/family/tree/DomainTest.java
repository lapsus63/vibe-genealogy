package com.family.tree;

import com.family.tree.adapter.out.gedcom.GedcomFileAdapter;
import com.family.tree.domain.model.*;
import com.family.tree.domain.service.KinshipCalculator;
import com.family.tree.domain.service.TreeExpander;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

import static org.junit.jupiter.api.Assertions.*;

class DomainTest {

    private Genealogy sample() {
        Genealogy g = new Genealogy();
        Person a = new Person("A", "Jean", "Dupont", Sex.M);
        Person b = new Person("B", "Marie", "Martin", Sex.F);
        Person c = new Person("C", "Pierre", "Dupont", Sex.M);
        Person d = new Person("D", "Sylvie", "Bernard", Sex.F);
        Person e = new Person("E", "Luc", "Dupont", Sex.M);
        g.addPerson(a); g.addPerson(b); g.addPerson(c); g.addPerson(d); g.addPerson(e);
        Union u1 = new Union("U1", "A", "B"); u1.children().add("C");
        Union u2 = new Union("U2", "C", "D"); u2.children().add("E");
        g.addUnion(u1); g.addUnion(u2);
        return g;
    }

    @Test void expandCollectsAscendantsAndDescendants() {
        var sub = new TreeExpander().expand(sample(), "C", 1, 1);
        assertTrue(sub.personIds().containsAll(java.util.List.of("A","B","C","D","E")));
    }

    @Test void expandAscZeroDescZeroKeepsRootAndSpouses() {
        Genealogy g = sample();
        g.addPerson(new Person("F", "Anna", "Dupont", Sex.F));
        Union u3 = new Union("U3", "E", "F");
        g.addUnion(u3);
        var sub = new TreeExpander().expand(g, "E", 0, 0);
        assertTrue(sub.personIds().contains("E"));
        assertTrue(sub.personIds().contains("F"));
        assertFalse(sub.personIds().contains("A"));
    }

    @Test void expandUnknownRootStillReturnsRootId() {
        var sub = new TreeExpander().expand(sample(), "UNKNOWN", 2, 2);
        assertTrue(sub.personIds().contains("UNKNOWN"));
        assertEquals(1, sub.personIds().size());
    }

    @Test void kinshipParentChild() {
        var k = new KinshipCalculator().compute(sample(), "A", "C");
        assertEquals("A", k.mrcaId());
        assertEquals(0, k.mrcaDepthA());
        assertEquals(1, k.mrcaDepthB());
    }

    @Test void kinshipGrandparent() {
        var k = new KinshipCalculator().compute(sample(), "A", "E");
        assertEquals(2, k.mrcaDepthB());
    }

    @Test void kinshipSiblings() {
        Genealogy g = sample();
        Person f = new Person("F", "Claire", "Dupont", Sex.F);
        g.addPerson(f);
        g.union("U1").children().add("F");
        var k = new KinshipCalculator().compute(g, "C", "F");
        assertEquals("Frère/sœur", k.label());
    }

    @Test void kinshipNoLink() {
        Genealogy g = sample();
        g.addPerson(new Person("Z", "Zoe", "Seul", Sex.F));
        var k = new KinshipCalculator().compute(g, "A", "Z");
        assertEquals("Aucun lien trouvé", k.label());
    }

    @Test void genealogyChildInTwoUnions() {
        Genealogy g = sample();
        Person x = new Person("X", "Alex", "Martin", Sex.M);
        g.addPerson(x);
        Union u3 = new Union("U3", "B", "X");
        u3.children().add("C");
        g.addUnion(u3);
        assertTrue(g.parentsOf("C").containsAll(java.util.List.of("A", "B", "X")));
    }

    @Test void genealogyRemovePersonDissolvesUnion() {
        Genealogy g = sample();
        g.removePerson("A");
        assertNull(g.person("A"));
        assertNull(g.union("U1"));
        assertNotNull(g.union("U2"));
    }

    @Test void bootstrapGedcomRoundTrip() throws Exception {
        GedcomFileAdapter adapter = new GedcomFileAdapter();
        Genealogy original;
        try (InputStream in = new ClassPathResource("bootstrap/tree.ged").getInputStream()) {
            original = adapter.loadFresh(in);
        }
        assertTrue(original.allPersons().size() >= 20);
        assertNotNull(original.person("I5"));
        assertTrue(original.childrenOf("I5").containsAll(java.util.List.of("I7", "I8")));

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        adapter.export(original, baos);
        Genealogy restored = adapter.loadFresh(new ByteArrayInputStream(baos.toByteArray()));
        assertEquals(original.allPersons().size(), restored.allPersons().size());
        assertEquals(original.allUnions().size(), restored.allUnions().size());
        assertEquals("Luc", restored.person("I5").firstName());
    }
}
