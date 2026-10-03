package com.example.backend.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component
public class RopsGuard {

    @Value("${admin.key:}")
    private String adminKey;

    public void require(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean rops = auth != null && auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ROPS"::equals);
        if (rops) return;
        String given = request.getHeader("X-Admin-Key");
        if (!adminKey.isBlank() && given != null
                && MessageDigest.isEqual(adminKey.getBytes(StandardCharsets.UTF_8), given.getBytes(StandardCharsets.UTF_8))) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ta operacja jest dostępna tylko dla pracowników ROPS");
    }
}
