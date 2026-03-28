package edu.cit.racaza.annimemo.security;

import edu.cit.racaza.annimemo.entity.UserAccount;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Component
public class TokenService {

    public String generateToken(UserAccount user) {
        String payload = user.getUsername() + ":" + Instant.now().toEpochMilli() + ":" + UUID.randomUUID();
        return Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
    }
}
