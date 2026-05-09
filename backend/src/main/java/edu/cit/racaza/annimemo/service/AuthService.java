package edu.cit.racaza.annimemo.service;

import edu.cit.racaza.annimemo.dto.AuthResponse;
import edu.cit.racaza.annimemo.dto.LoginRequest;
import edu.cit.racaza.annimemo.dto.RegisterRequest;
import edu.cit.racaza.annimemo.dto.UserResponse;
import edu.cit.racaza.annimemo.entity.UserAccount;
import edu.cit.racaza.annimemo.exception.BadRequestException;
import edu.cit.racaza.annimemo.exception.UnauthorizedException;
import edu.cit.racaza.annimemo.repository.UserAccountRepository;
import edu.cit.racaza.annimemo.security.TokenService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuthService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public AuthService(UserAccountRepository userAccountRepository,
                       PasswordEncoder passwordEncoder,
                       TokenService tokenService) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    public AuthResponse register(RegisterRequest request) {
        String normalizedUsername = request.getUsername().trim();
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (userAccountRepository.existsByUsername(normalizedUsername)) {
            throw new BadRequestException("Username already exists");
        }

        if (userAccountRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("Email already exists");
        }

        UserAccount user = new UserAccount();
        user.setUsername(normalizedUsername);
        user.setEmail(normalizedEmail);
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        UserAccount saved = userAccountRepository.save(user);

        return new AuthResponse(
                "User registered successfully",
                null,
                UserResponse.fromEntity(saved)
        );
    }

    public AuthResponse login(LoginRequest request) {
        UserAccount user = userAccountRepository.findByUsername(request.getUsername().trim())
                .orElseThrow(() -> new UnauthorizedException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid username or password");
        }

        String token = tokenService.generateToken(user);

        return new AuthResponse(
                "Login successful",
                token,
                UserResponse.fromEntity(user)
        );
    }

    public List<UserResponse> getRegisteredUsers() {
        return userAccountRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(UserResponse::fromEntity)
                .toList();
    }
}
