package com.example.backend.service;

import com.example.backend.config.CreatorReferenceData;
import com.example.backend.dto.ApplicantProfile;
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
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Set<Role> REGISTRABLE_ROLES = Set.of(Role.CITIZEN, Role.NGO);
    private static final int[] NIP_WEIGHTS = {6, 5, 7, 2, 3, 4, 5, 6, 7};

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final CreatorReferenceData referenceData;
    private final ObjectMapper mapper;
    private final JwtEncoder jwtEncoder;

    @Value("${jwt.expiration}")
    private Duration expiration;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        Role role = request.role() == null ? Role.CITIZEN : request.role();
        if (!REGISTRABLE_ROLES.contains(role)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Konta samorządów i ROPS zakłada administrator platformy");
        }
        String email = request.email().trim().toLowerCase();
        if (appUserRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Konto z tym adresem email już istnieje");
        }

        AppUser user = new AppUser();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(role);
        if (role == Role.NGO) {
            user.setNip(validNip(request.nip()));
        }
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setCreatedAt(Instant.now());

        return issueToken(appUserRepository.save(user));
    }

    public AuthResponse login(LoginRequest request) {
        AppUser user = appUserRepository.findByEmailIgnoreCase(request.email().trim())
                .filter(u -> u.getPassword() != null && passwordEncoder.matches(request.password(), u.getPassword()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Niepoprawny email lub hasło"));

        return issueToken(user);
    }

    // optional details for grant applications; empty values clear the field
    @Transactional
    public UserResponse updateProfile(Long userId, ApplicantProfile request) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        String phone = clean(request.phone(), 30);
        if (phone != null && !phone.matches("[+0-9 ()-]{6,30}")) throw badRequest("Niepoprawny numer telefonu");
        String postalCode = clean(request.postalCode(), 6);
        if (postalCode != null && !postalCode.matches("\\d{2}-\\d{3}")) throw badRequest("Kod pocztowy w formacie 00-000");
        String gminaId = clean(request.gminaId(), 60);
        if (gminaId != null && !referenceData.gminaExists(gminaId)) throw badRequest("Wybierz gminę z listy");

        user.setPhone(phone);
        user.setStreet(clean(request.street(), 120));
        user.setPostalCode(postalCode);
        user.setCity(clean(request.city(), 80));
        user.setResidenceGminaId(gminaId);
        if (user.getRole() == Role.NGO) {
            String krs = digits(request.krs());
            if (krs != null && krs.length() != 10) throw badRequest("KRS ma 10 cyfr");
            String regon = digits(request.regon());
            if (regon != null && regon.length() != 9 && regon.length() != 14) throw badRequest("REGON ma 9 albo 14 cyfr");
            user.setKrs(krs);
            user.setRegon(regon);
            ApplicantProfile.ContactPerson rep = person(request.representative(), "osoby reprezentującej");
            user.setRepresentativeFunction(rep.function());
            user.setRepresentativeName(rep.name());
            user.setRepresentativePhone(rep.phone());
            user.setRepresentativeEmail(rep.email());
            ApplicantProfile.ContactPerson contact = person(request.contact(), "osoby do kontaktów");
            user.setContactFunction(contact.function());
            user.setContactName(contact.name());
            user.setContactPhone(contact.phone());
            user.setContactEmail(contact.email());
            user.setExperience(clean(request.experience(), 3000));
            List<ApplicantProfile.TeamMember> team = request.team() == null ? List.of() : request.team().stream()
                    .map(m -> new ApplicantProfile.TeamMember(clean(m.name(), 120), clean(m.role(), 120), clean(m.experience(), 600)))
                    .filter(m -> m.name() != null || m.role() != null)
                    .toList();
            if (team.size() > 10) throw badRequest("Zespół może mieć najwyżej 10 osób");
            user.setTeamJson(team.isEmpty() ? null : mapper.writeValueAsString(team));
        }
        return toResponse(appUserRepository.save(user));
    }

    private static ApplicantProfile.ContactPerson person(ApplicantProfile.ContactPerson p, String who) {
        if (p == null) return new ApplicantProfile.ContactPerson(null, null, null, null);
        String phone = clean(p.phone(), 30);
        if (phone != null && !phone.matches("[+0-9 ()-]{6,30}")) throw badRequest("Niepoprawny telefon " + who);
        String email = clean(p.email(), 120);
        if (email != null && !email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+")) throw badRequest("Niepoprawny e-mail " + who);
        return new ApplicantProfile.ContactPerson(clean(p.function(), 120), clean(p.name(), 120), phone, email);
    }

    private static String clean(String value, int max) {
        if (value == null || value.isBlank()) return null;
        String trimmed = value.trim();
        return trimmed.length() > max ? trimmed.substring(0, max) : trimmed;
    }

    private static String digits(String value) {
        if (value == null || value.isBlank()) return null;
        String digits = value.replaceAll("[\\s-]", "");
        if (!digits.matches("\\d+")) throw badRequest("Wpisz same cyfry");
        return digits;
    }

    public List<ApplicantProfile.TeamMember> team(AppUser user) {
        if (user.getTeamJson() == null) return List.of();
        return List.of(mapper.readValue(user.getTeamJson(), ApplicantProfile.TeamMember[].class));
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    public UserResponse me(Long userId) {
        return appUserRepository.findById(userId)
                .map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    static String validNip(String raw) {
        String digits = raw == null ? "" : raw.replaceAll("[\\s-]", "");
        if (!digits.matches("\\d{10}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "NIP musi mieć 10 cyfr");
        }
        int sum = 0;
        for (int i = 0; i < 9; i++) sum += (digits.charAt(i) - '0') * NIP_WEIGHTS[i];
        if (sum % 11 == 10 || sum % 11 != digits.charAt(9) - '0') {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Niepoprawny NIP – sprawdź cyfry");
        }
        return digits;
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

    private UserResponse toResponse(AppUser user) {
        ApplicantProfile profile = new ApplicantProfile(user.getPhone(), user.getStreet(), user.getPostalCode(), user.getCity(),
                user.getResidenceGminaId(), user.getKrs(), user.getRegon(),
                new ApplicantProfile.ContactPerson(user.getRepresentativeFunction(), user.getRepresentativeName(), user.getRepresentativePhone(), user.getRepresentativeEmail()),
                new ApplicantProfile.ContactPerson(user.getContactFunction(), user.getContactName(), user.getContactPhone(), user.getContactEmail()),
                user.getExperience(), team(user));
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.effectiveStatus(), user.getGminaId(), user.getNip(), profile);
    }
}
