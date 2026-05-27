package edu.cit.racaza.annimemo.core.config;

import edu.cit.racaza.annimemo.features.auth.model.AppUser;
import edu.cit.racaza.annimemo.features.auth.repository.AppUserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminSeeder implements ApplicationRunner {

    private final AppUserRepository appUserRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Value("${ADMIN_USERNAME:admin}")
    private String adminUsername;

    @Value("${ADMIN_EMAIL:admin@annimemo.com}")
    private String adminEmail;

    @Value("${ADMIN_PASSWORD:}")
    private String adminPassword;

    public AdminSeeder(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        // Safe check: Skip seeding completely if no admin password is provided in environment variables
        if (adminPassword == null || adminPassword.trim().isEmpty()) {
            System.out.println("====== SYSTEM NOTE: AdminSeeder Skipped (ADMIN_PASSWORD environment variable is empty) ======");
            return;
        }

        String normalizedUsername = adminUsername.trim();
        if (!appUserRepository.existsByUsername(normalizedUsername)) {
            AppUser admin = new AppUser(
                    normalizedUsername,
                    passwordEncoder.encode(adminPassword),
                    "System",
                    "Administrator",
                    adminEmail.trim()
            );
            admin.setRole("ROLE_ADMIN");
            appUserRepository.save(admin);
            System.out.println("====== SYSTEM NOTE: Default Administrator Account Seeded from Environment ======");
            System.out.println("Username: " + normalizedUsername);
            System.out.println("Email: " + adminEmail);
            System.out.println("=========================================================================");
        }
    }
}
