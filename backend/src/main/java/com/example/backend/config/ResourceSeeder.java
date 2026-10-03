package com.example.backend.config;

import com.example.backend.model.KnowledgeResource;
import com.example.backend.model.ResourceType;
import com.example.backend.repository.KnowledgeResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ResourceSeeder implements CommandLineRunner {
    private final KnowledgeResourceRepository repo;

    @Override
    public void run(String... args) {
        if (repo.count() > 0) return;
        repo.saveAll(List.of(
                res("Biblioteka Innowacji Społecznych", ResourceType.LIBRARY,
                        "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/kategorie"),
                res("Raporty z badań ROPS", ResourceType.REPORT,
                        "https://rops.krakow.pl/badania-analizy-raporty/raporty-z-badan"),
                res("Obserwator ROPS", ResourceType.TOOL, "https://obserwator.rops.krakow.pl/"),
                res("Mapa Wyzwań Społecznych", ResourceType.MAP,
                        "https://rops.krakow.pl/mpliki/IS/IWS_20/za._nr_2._Mapa_Wyzwa_Spoecznych.pdf"),
                res("Publikacje ze świata innowacji", ResourceType.PUBLICATION,
                        "https://rops.krakow.pl/innowacje-spoleczne/publikacje-ze-swiata-innowacji"),
                res("Social Canvas (INNO AGH)", ResourceType.CANVAS,
                        "https://rops.krakow.pl/mpliki/IS/Moj_folder/INNO_AGH_-_SOCIAL_CANVAS.pdf")));
    }

    private static KnowledgeResource res(String title, ResourceType type, String url) {
        return new KnowledgeResource(null, title, null, type, url, null);
    }
}
