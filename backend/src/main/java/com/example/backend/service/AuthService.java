package com.example.backend.service;

import com.example.backend.dto.AuthResponse;
import com.example.backend.dto.LoginRequest;
import com.example.backend.dto.RegisterRequest;
import com.example.backend.dto.UserResponse;
import com.example.backend.model.AccountStatus;
import com.example.backend.model.AppUser;
import com.example.backend.model.Role;
import com.example.backend.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Set<Role> REGISTRABLE_ROLES = Set.of(Role.CITIZEN, Role.JST, Role.ROPS);

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;

    @Value("${jwt.expiration}")
    private Duration expiration;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (!REGISTRABLE_ROLES.contains(request.role())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Niedozwolony typ konta");
        }
        String email = request.email().trim().toLowerCase();
        if (appUserRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Konto z tym adresem email już istnieje");
        }

        AppUser user = new AppUser();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        user.setAccountStatus(request.role() == Role.CITIZEN ? AccountStatus.ACTIVE : AccountStatus.PENDING);
        user.setCreatedAt(Instant.now());

        return issueToken(appUserRepository.save(user));
    }

    public AuthResponse login(LoginRequest request) {
        AppUser user = appUserRepository.findByEmailIgnoreCase(request.email().trim())
                .filter(u -> u.getPassword() != null && passwordEncoder.matches(request.password(), u.getPassword()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Niepoprawny email lub hasło"));

        return issueToken(user);
    }

    public UserResponse me(Long userId) {
        return appUserRepository.findById(userId)
                .map(AuthService::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private AuthResponse issueToken(AppUser user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(expiration);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(String.valueOf(user.getId()))
                .issuedAt(now)
                .expiresAt(expiresAt)
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();

        return new AuthResponse(token, expiresAt, toResponse(user));
    }

    private static UserResponse toResponse(AppUser user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.effectiveStatus(), user.getGminaId());
    }
}
