package com.example.backend.config;

import com.example.backend.model.AppUser;
import com.example.backend.model.Role;
import com.example.backend.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Demo accounts: one JST account per gmina (e.g. krakow@hubmi.test) and one ROPS account.
 * Only missing accounts are added, so it is safe to run on an existing database.
 * Runs after startup, so TestDataInitializer still sees an empty table on a fresh database.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JstAccountSeeder {

    // .test is reserved, so these can never be real mailboxes
    public static final String DOMAIN = "@hubmi.test";
    public static final String ROPS_EMAIL = "rops" + DOMAIN;

    private final AppUserRepository userRepository;
    private final CreatorReferenceData referenceData;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.password}")
    private String password;

    @EventListener(ApplicationReadyEvent.class)
    public void seed() {
        Set<String> existing = userRepository.findAll().stream()
                .map(AppUser::getEmail)
                .filter(Objects::nonNull)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        // one hash shared by all demo accounts, hashing 184 times would slow down startup
        String hash = passwordEncoder.encode(password);
        List<AppUser> missing = new ArrayList<>();

        if (!existing.contains(ROPS_EMAIL)) {
            missing.add(account("ROPS Kraków", ROPS_EMAIL, Role.ROPS, null, hash));
        }
        referenceData.regions().powiaty().forEach(powiat -> powiat.gminy().forEach(gmina -> {
            String email = gmina.id() + DOMAIN;
            if (!existing.contains(email)) {
                missing.add(account("Gmina " + gmina.name(), email, Role.JST, gmina.id(), hash));
            }
        }));

        if (!missing.isEmpty()) {
            userRepository.saveAll(missing);
            log.info("Utworzono {} kont demo (JST dla gmin i ROPS)", missing.size());
        }
    }

    private static AppUser account(String name, String email, Role role, String gminaId, String hash) {
        AppUser user = new AppUser();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(hash);
        user.setRole(role);
        user.setGminaId(gminaId);
        return user;
    }
}
