package com.family.tree.adapter.out.gedcom;

import com.family.tree.domain.model.Genealogy;
import com.family.tree.domain.model.Person;
import com.family.tree.domain.model.Union;
import com.family.tree.domain.port.out.FileFormatAdapter;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import java.util.Map;

/** Import/export JSON de l'agrégat {@link Genealogy}. */
@Component
public class JsonFileAdapter implements FileFormatAdapter {

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public String format() {
        return "json";
    }

    @Override
    public int importInto(Genealogy target, InputStream in) throws Exception {
        JsonNode root = mapper.readTree(in);
        Genealogy incoming = mapper.treeToValue(normalize(root), Genealogy.class);
        int count = 0;
        for (Person p : incoming.allPersons()) {
            if (target.person(p.id()) == null) {
                target.addPerson(p);
                count++;
            }
        }
        for (Union u : incoming.allUnions()) {
            if (target.union(u.id()) == null) {
                target.addUnion(u);
                count++;
            }
        }
        return count;
    }

    @Override
    public void export(Genealogy source, OutputStream out) throws Exception {
        mapper.writerWithDefaultPrettyPrinter().writeValue(out, source);
    }

    /** Accepte persons/unions en map ou en tableau. */
    private JsonNode normalize(JsonNode root) throws Exception {
        if (root.has("persons") && root.get("persons").isArray()) {
            ObjectNode obj = mapper.createObjectNode();
            ObjectNode persons = mapper.createObjectNode();
            for (JsonNode n : root.get("persons")) {
                persons.set(n.get("id").asText(), n);
            }
            ObjectNode unions = mapper.createObjectNode();
            if (root.has("unions") && root.get("unions").isArray()) {
                for (JsonNode n : root.get("unions")) {
                    unions.set(n.get("id").asText(), n);
                }
            } else if (root.has("unions") && root.get("unions").isObject()) {
                unions = (ObjectNode) root.get("unions");
            }
            obj.set("persons", persons);
            obj.set("unions", unions);
            return obj;
        }
        if (root.has("persons") && root.get("persons").isObject()) {
            return root;
        }
        if (root.isObject() && !root.has("persons")) {
            Genealogy g = new Genealogy();
            Iterator<Map.Entry<String, JsonNode>> fields = root.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> e = fields.next();
                Person p = mapper.treeToValue(e.getValue(), Person.class);
                g.addPerson(p);
            }
            return mapper.valueToTree(g);
        }
        return root;
    }
}
