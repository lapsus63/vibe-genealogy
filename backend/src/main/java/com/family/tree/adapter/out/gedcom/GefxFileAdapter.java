package com.family.tree.adapter.out.gedcom;

import com.family.tree.domain.model.Genealogy;
import com.family.tree.domain.model.Person;
import com.family.tree.domain.model.Union;
import com.family.tree.domain.port.out.FileFormatAdapter;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Adapter GEDCOM X / GEFX (v1 minimal).
 * L'export produit un XML simplifié ; l'import profond est prévu v2.
 */
@Component
public class GefxFileAdapter implements FileFormatAdapter {

    @Override
    public String format() {
        return "gefx";
    }

    @Override
    public int importInto(Genealogy target, InputStream in) {
        // v1 : format reconnu mais non parsé en profondeur
        return 0;
    }

    @Override
    public void export(Genealogy source, OutputStream out) throws Exception {
        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<gedcomx xmlns=\"http://gedcomx.org/v1/\">\n");
        for (Person p : source.allPersons()) {
            sb.append("  <person id=\"").append(esc(p.id())).append("\">\n");
            sb.append("    <name>")
                .append(esc(nullToEmpty(p.firstName()))).append(' ')
                .append(esc(nullToEmpty(p.lastName())))
                .append("</name>\n");
            sb.append("    <sex>").append(p.sex().name()).append("</sex>\n");
            sb.append("  </person>\n");
        }
        for (Union u : source.allUnions()) {
            sb.append("  <relationship id=\"").append(esc(u.id())).append("\" type=\"Couple\">\n");
            if (u.spouseA() != null) {
                sb.append("    <person1 resource=\"#").append(esc(u.spouseA())).append("\"/>\n");
            }
            if (u.spouseB() != null) {
                sb.append("    <person2 resource=\"#").append(esc(u.spouseB())).append("\"/>\n");
            }
            for (String c : u.children()) {
                sb.append("    <child resource=\"#").append(esc(c)).append("\"/>\n");
            }
            sb.append("  </relationship>\n");
        }
        sb.append("</gedcomx>\n");
        out.write(sb.toString().getBytes(StandardCharsets.UTF_8));
    }

    private static String esc(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace("\"", "&quot;");
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }
}
