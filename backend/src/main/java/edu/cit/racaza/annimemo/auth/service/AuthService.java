package edu.cit.racaza.annimemo.auth.service;

import edu.cit.racaza.annimemo.auth.dto.AuthResponse;
import edu.cit.racaza.annimemo.auth.dto.LoginRequest;
import edu.cit.racaza.annimemo.auth.dto.RegisterRequest;
import edu.cit.racaza.annimemo.auth.exception.AuthException;
import edu.cit.racaza.annimemo.auth.model.AppUser;
import edu.cit.racaza.annimemo.auth.repository.AppUserRepository;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    public AuthResponse register(RegisterRequest request) {
        String normalizedUsername = request.username().trim();
        String normalizedEmail = request.email().trim().toLowerCase();

        if (appUserRepository.existsByUsername(normalizedUsername)) {
            throw new AuthException("Username is already taken");
        }

        if (appUserRepository.existsByEmail(normalizedEmail)) {
            throw new AuthException("Email is already in use");
        }

        AppUser user = new AppUser(
                normalizedUsername,
                passwordEncoder.encode(request.password()),
                request.firstName().trim(),
                request.lastName().trim(),
                normalizedEmail
        );

        appUserRepository.save(user);

        String token = generateToken(user.getUsername());
        return new AuthResponse("User registered successfully", token, user.getUsername());
    }

    public AuthResponse login(LoginRequest request) {
        // Accept both username and email for login
        String loginIdentifier = request.username().trim();
        AppUser user = appUserRepository.findByUsername(loginIdentifier)
            .or(() -> appUserRepository.findByEmail(loginIdentifier.toLowerCase()))
                .orElseThrow(() -> new AuthException("Invalid username/email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new AuthException("Invalid username/email or password");
        }

        String token = generateToken(user.getUsername());
        return new AuthResponse("Login successful", token, user.getUsername());
    }

    private String generateToken(String username) {
        String raw = username + ":" + Instant.now().toEpochMilli();
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }
}
