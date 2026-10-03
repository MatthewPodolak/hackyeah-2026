package com.example.backend.config;

import com.example.backend.model.AppUser;
import com.example.backend.model.Role;
import com.example.backend.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class TestDataInitializer implements CommandLineRunner {

    private final AppUserRepository userRepository;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            log.info("Baza użytkowników jest pusta. Tworzenie kont testowych...");

            // ID = 1: Mieszkaniec / Użytkownik zgłaszający
            AppUser resident = new AppUser();
            resident.setName("Jan Kowalski");
            resident.setEmail("jan.kowalski@example.pl");
            resident.setRole(Role.CITIZEN);
            userRepository.save(resident);

            // ID = 2: Ekspert / Mentor innowacji społecznych ROPS
            AppUser expert = new AppUser();
            expert.setName("Anna Nowak (Ekspert ROPS)");
            expert.setEmail("ekspert@rops.krakow.pl");
            expert.setRole(Role.EXPERT);
            userRepository.save(expert);

            // ID = 3: Administrator ROPS
            AppUser admin = new AppUser();
            admin.setName("Piotr Wiśniewski (Admin ROPS)");
            admin.setEmail("admin@rops.krakow.pl");
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);

            log.info("Utworzono użytkowników testowych: ID 1 (Mieszkaniec), ID 2 (Ekspert), ID 3 (Admin).");
        }
    }
}