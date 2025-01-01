package com.family.tree.adapter.in.security;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserStore users;
    private final JwtService jwt;

    public AuthController(UserStore users, JwtService jwt) { this.users = users; this.jwt = jwt; }

    public record LoginRequest(String username, String password) {}
    public record LoginResponse(String token, UserView user) {}
    public record UserView(String username, String role) {}

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest req) {
        var user = users.authenticate(req.username(), req.password())
            .orElseThrow(() -> new RuntimeException("Identifiants invalides"));
        String token = jwt.issue(user.username(), user.role());
        return new LoginResponse(token, new UserView(user.username(), user.role().name()));
    }

    @PostMapping("/logout")
    public Map<String, Boolean> logout() { return Map.of("ok", true); }

    @GetMapping("/me")
    public UserView me(Authentication auth) {
        if (auth == null) return null;
        String role = auth.getAuthorities().stream().findFirst().map(a -> a.getAuthority().replace("ROLE_","")).orElse("VIEWER");
        return new UserView(auth.getName(), role);
    }
}
