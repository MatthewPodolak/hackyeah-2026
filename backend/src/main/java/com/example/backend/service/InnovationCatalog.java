package com.example.backend.service;

import com.example.backend.model.InnovationData;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class InnovationCatalog {

    private final ObjectMapper mapper;
    private final String storagePath;

    private volatile Map<String, InnovationData> byId = Map.of();
    private volatile String promptCatalog = "";

    public InnovationCatalog(ObjectMapper mapper,
                             @Value("${catalog.storage-path:./data/innovations.json}") String storagePath) {
        this.mapper = mapper;
        this.storagePath = storagePath;
    }

    @PostConstruct
    void init() throws IOException {
        Path p = Path.of(storagePath);
        if (Files.exists(p)) {
            try {
                replaceFromJson(Files.readAllBytes(p));    // wersja wgrana przez admina ma pierwszeństwo
                return;
            } catch (Exception e) {
                // uszkodzony plik – wracamy do wersji z resources
            }
        }
        try (InputStream in = new ClassPathResource("data/innovations.json").getInputStream()) {
            replaceFromJson(in.readAllBytes());
        }
    }

    /** Parsuje i podmienia katalog w pamięci. Przy błędzie parsowania stary katalog zostaje. */
    public synchronized void replaceFromJson(byte[] json) throws IOException {
        List<InnovationData> list = mapper.readValue(json, new TypeReference<List<InnovationData>>() {});
        Map<String, InnovationData> map = new LinkedHashMap<>();
        list.forEach(i -> map.put(i.id(), i));
        this.promptCatalog = map.values().stream().map(InnovationCatalog::toPromptLine)
                .collect(Collectors.joining("\n"));
        this.byId = map;
    }

    /** Podmienia katalog i zapisuje plik na dysku (używa tego panel admina). */
    public synchronized void saveAndReplace(byte[] json) throws IOException {
        replaceFromJson(json);                          // najpierw walidacja
        Path p = Path.of(storagePath);
        if (p.getParent() != null) Files.createDirectories(p.getParent());
        Files.write(p, json);
    }

    public Collection<InnovationData> all() { return byId.values(); }
    public Optional<InnovationData> find(String id) { return Optional.ofNullable(byId.get(id)); }
    public String asPromptCatalog() { return promptCatalog; }

    private static String toPromptLine(InnovationData i) {
        return "%s | %s | %s | problem: %s | tagi: %s | obszary: %s".formatted(
                i.id(), i.name(), i.shortDescription(), truncate(i.problem(), 300),
                join(i.problemTags()), join(i.challengeAreas()));
    }

    private static String join(List<String> l) { return l == null ? "" : String.join(",", l); }

    private static String truncate(String s, int max) {
        if (s == null) return "";
        s = s.replace("\n", " ");
        return s.length() <= max ? s : s.substring(0, max) + "…";
    }
}