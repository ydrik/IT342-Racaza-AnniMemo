package edu.cit.racaza.annimemo.auth.dto;

public record AuthResponse(
        String message,
        String token,
        String username
) {
}
