package edu.cit.racaza.annimemo.features.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.cit.racaza.annimemo.features.auth.dto.LoginRequest;
import edu.cit.racaza.annimemo.features.auth.dto.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void registerAndLoginShouldSucceed() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(
                "integration_user",
                "StrongPass!123",
                "Integration",
                "User",
                "integration_user@example.com"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("integration_user"))
                .andExpect(jsonPath("$.token").isNotEmpty());

        LoginRequest loginRequest = new LoginRequest("integration_user", "StrongPass!123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Login successful"))
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void duplicateUsernameShouldReturnBadRequest() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(
                "duplicate_user",
                "StrongPass!123",
                "Duplicate",
                "User",
                "duplicate_user@example.com"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Username is already taken"));
    }

    @Test
    void duplicateEmailShouldReturnBadRequest() throws Exception {
        RegisterRequest firstRequest = new RegisterRequest(
                "email_duplicate_user_1",
                "StrongPass!123",
                "Email",
                "Duplicate",
                "duplicate_email@example.com"
        );

        RegisterRequest secondRequest = new RegisterRequest(
                "email_duplicate_user_2",
                "StrongPass!123",
                "Email",
                "Duplicate",
                "DUPLICATE_EMAIL@example.com"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(firstRequest)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(secondRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email is already in use"));
    }
}
