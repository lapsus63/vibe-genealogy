package com.family.tree.adapter.in.security;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.nio.file.*;
import java.util.*;

/** Base d'utilisateurs stockée dans data/users.json (bcrypt). */
@Component
public class UserStore {

    public enum Role { ADMIN, EDITOR, VIEWER }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record UserRecord(String username, String passwordHash, Role role) {}

    private final Path file;
    private final ObjectMapper mapper = new ObjectMapper();
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final Map<String, UserRecord> users = new HashMap<>();

    public UserStore(@Value("${app.data-dir}") String dataDir) {
        this.file = Path.of(dataDir, "users.json").toAbsolutePath();
    }

    @PostConstruct
    public void init() throws Exception {
        Files.createDirectories(file.getParent());
        if (!Files.exists(file)) {
            List<UserRecord> defaults = List.of(
                new UserRecord("admin", encoder.encode("admin"), Role.ADMIN),
                new UserRecord("viewer", encoder.encode("viewer"), Role.VIEWER)
            );
            mapper.writerWithDefaultPrettyPrinter().writeValue(file.toFile(), defaults);
        }
        UserRecord[] arr = mapper.readValue(file.toFile(), UserRecord[].class);
        for (UserRecord u : arr) users.put(u.username(), u);
    }

    public Optional<UserRecord> authenticate(String username, String password) {
        UserRecord u = users.get(username);
        if (u == null || !encoder.matches(password, u.passwordHash())) return Optional.empty();
        return Optional.of(u);
    }

    public Optional<UserRecord> find(String username) { return Optional.ofNullable(users.get(username)); }
}
