package com.family.tree.adapter.in.rest;

import com.family.tree.domain.model.Genealogy;
import com.family.tree.domain.port.out.FileFormatAdapter;
import com.family.tree.domain.port.out.TreeRepository;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.ByteArrayInputStream;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ImportExportController {

    private final TreeRepository repository;
    private final List<FileFormatAdapter> adapters;

    public ImportExportController(TreeRepository r, List<FileFormatAdapter> adapters) {
        this.repository = r; this.adapters = adapters;
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Integer> importFile(@RequestParam("file") MultipartFile file) throws Exception {
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        String fmt = name.endsWith(".json") ? "json" : name.endsWith(".gefx") || name.endsWith(".xml") ? "gefx" : "gedcom";
        var adapter = adapters.stream().filter(a -> a.format().equals(fmt)).findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Format non supporté : " + fmt));
        Genealogy g = repository.load();
        int n = adapter.importInto(g, file.getInputStream());
        repository.save(g);
        return Map.of("imported", n);
    }

    @GetMapping("/export")
    public ResponseEntity<InputStreamResource> export(@RequestParam String format) throws Exception {
        var adapter = adapters.stream().filter(a -> a.format().equals(format)).findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Format non supporté : " + format));
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        adapter.export(repository.load(), baos);
        String ext = format.equals("gedcom") ? "ged" : format;
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"family-tree." + ext + "\"")
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .body(new InputStreamResource(new ByteArrayInputStream(baos.toByteArray())));
    }
}
