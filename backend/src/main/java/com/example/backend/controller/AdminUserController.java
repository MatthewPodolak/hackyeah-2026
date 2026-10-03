package com.example.backend.controller;

import com.example.backend.config.RopsGuard;
import com.example.backend.dto.AccountStatusRequest;
import com.example.backend.dto.AdminUserResponse;
import com.example.backend.model.AccountStatus;
import com.example.backend.model.AppUser;
import com.example.backend.model.Role;
import com.example.backend.repository.AppUserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private static final Set<Role> INSTITUTIONS = Set.of(Role.JST, Role.ROPS);

    private final AppUserRepository users;
    private final RopsGuard ropsGuard;

    @GetMapping
    public List<AdminUserResponse> institutions(@RequestParam(required = false) AccountStatus status, HttpServletRequest request) {
        ropsGuard.require(request);
        return users.findAll().stream()
                .filter(u -> INSTITUTIONS.contains(u.getRole()))
                .filter(u -> status == null || u.effectiveStatus() == status)
                .sorted(Comparator.comparing(AppUser::getId).reversed())
                .map(AdminUserController::toResponse)
                .toList();
    }

    @GetMapping("/pending-count")
    public Map<String, Long> pendingCount(HttpServletRequest request) {
        ropsGuard.require(request);
        long count = users.findAll().stream()
                .filter(u -> INSTITUTIONS.contains(u.getRole()) && u.effectiveStatus() == AccountStatus.PENDING)
                .count();
        return Map.of("pending", count);
    }

    @PatchMapping("/{id}/status")
    public AdminUserResponse setStatus(@PathVariable Long id, @Valid @RequestBody AccountStatusRequest body,
                                       @AuthenticationPrincipal Jwt jwt, HttpServletRequest request) {
        ropsGuard.require(request);
        if (jwt != null && String.valueOf(id).equals(jwt.getSubject())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nie możesz zmienić statusu własnego konta");
        }
        AppUser user = users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!INSTITUTIONS.contains(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Akceptacji wymagają tylko konta JST i ROPS");
        }
        user.setAccountStatus(body.status());
        return toResponse(users.save(user));
    }

    private static AdminUserResponse toResponse(AppUser u) {
        return new AdminUserResponse(u.getId(), u.getName(), u.getEmail(), u.getRole(), u.effectiveStatus(), u.getCreatedAt());
    }
}
