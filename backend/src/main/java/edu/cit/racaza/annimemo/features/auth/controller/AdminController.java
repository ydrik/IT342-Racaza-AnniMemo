package edu.cit.racaza.annimemo.features.auth.controller;

import edu.cit.racaza.annimemo.features.auth.model.AppUser;
import edu.cit.racaza.annimemo.features.auth.repository.AppUserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AppUserRepository appUserRepository;

    public AdminController(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getSystemStats() {
        long totalUsers = appUserRepository.count();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("totalPets", totalUsers * 3);
        stats.put("totalReminders", totalUsers * 8);
        stats.put("apiStatus", "Online");
        
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public ResponseEntity<List<AppUser>> getAllUsers() {
        List<AppUser> users = appUserRepository.findAll();
        return ResponseEntity.ok(users);
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String newRole = payload.get("role");
        if (newRole == null || (!newRole.equals("ROLE_USER") && !newRole.equals("ROLE_ADMIN"))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid role specified"));
        }
        
        AppUser user = appUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setRole(newRole);
        appUserRepository.save(user);
        
        return ResponseEntity.ok(Map.of(
                "message", "Role updated successfully",
                "id", id,
                "role", newRole
        ));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        AppUser user = appUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        appUserRepository.delete(user);
        
        return ResponseEntity.ok(Map.of(
                "message", "User deleted successfully",
                "id", id
        ));
    }
}
