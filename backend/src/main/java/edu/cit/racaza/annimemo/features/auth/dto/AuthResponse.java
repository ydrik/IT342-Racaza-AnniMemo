package edu.cit.racaza.annimemo.features.auth.dto;

public record AuthResponse(
        String message,
        String token,
        String username
) {
}
