package com.family.tree;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import org.springframework.test.web.reactive.server.WebTestClient;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("prod")
class ContextPathIntegrationTest {

    @LocalServerPort
    private int port;

    private WebTestClient webTestClient;

    @BeforeEach
    void setUp() {
        this.webTestClient = WebTestClient.bindToServer().baseUrl("http://localhost:" + port).build();
    }

    @Test
    void testContextPathIsVibeGenealogyInProdProfile() {
        String url = "http://localhost:" + port + "/vibe-genealogy/auth/me";
        EntityExchangeResult<String> response = webTestClient.get().uri(url).exchange().expectBody(String.class).returnResult();
        // /auth/me without JWT token returns null/empty or 200/401, but the endpoint responds under /vibe-genealogy context path
        assertThat(response.getStatus()).isNotEqualTo(HttpStatus.NOT_FOUND);
    }
}
