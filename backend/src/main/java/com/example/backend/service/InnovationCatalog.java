package com.example.backend.service;

import com.example.backend.model.CatalogEntry;
import com.example.backend.model.InnovationData;
import com.example.backend.repository.CatalogEntryRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class InnovationCatalog {

    private final ObjectMapper mapper;
    private final CatalogEntryRepository entries;
    private final String storagePath;

    private volatile Map<String, InnovationData> byId = Map.of();
    private volatile String promptCatalog = "";

    public InnovationCatalog(ObjectMapper mapper, CatalogEntryRepository entries,
                             @Value("${catalog.storage-path:./data/innovations.json}") String storagePath) {
        this.mapper = mapper;
        this.entries = entries;
        this.storagePath = storagePath;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void init() throws IOException {
        if (entries.count() == 0) {
            List<InnovationData> seed = readSeed();
            List<CatalogEntry> rows = new ArrayList<>();
            for (int i = 0; i < seed.size(); i++) {
                rows.add(new CatalogEntry(seed.get(i).id(), mapper.writeValueAsString(seed.get(i)), i, Instant.now()));
            }
            entries.saveAll(rows);
        }
        reload();
    }

    public synchronized void reload() {
        Map<String, InnovationData> map = new LinkedHashMap<>();
        for (CatalogEntry entry : entries.findAllByOrderByPositionAscIdAsc()) {
            InnovationData data = mapper.readValue(entry.getData(), InnovationData.class);
            map.put(entry.getId(), data);
        }
        this.promptCatalog = map.values().stream().map(InnovationCatalog::toPromptLine)
                .collect(Collectors.joining("\n"));
        this.byId = map;
    }

    @Transactional
    public synchronized InnovationData save(InnovationData data) {
        CatalogEntry entry = entries.findById(data.id()).orElseGet(() -> {
            CatalogEntry created = new CatalogEntry();
            created.setId(data.id());
            created.setPosition(-1);
            return created;
        });
        entry.setData(mapper.writeValueAsString(data));
        entry.setUpdatedAt(Instant.now());
        entries.save(entry);
        reload();
        return data;
    }

    @Transactional
    public synchronized boolean delete(String id) {
        if (!entries.existsById(id)) return false;
        entries.deleteById(id);
        reload();
        return true;
    }

    public Collection<InnovationData> all() { return byId.values(); }
    public Optional<InnovationData> find(String id) { return Optional.ofNullable(byId.get(id)); }
    public boolean exists(String id) { return byId.containsKey(id); }
    public String asPromptCatalog() { return promptCatalog; }

    private List<InnovationData> readSeed() throws IOException {
        Path p = Path.of(storagePath);
        if (Files.exists(p)) {
            try {
                return mapper.readValue(Files.readAllBytes(p), new TypeReference<List<InnovationData>>() {});
            } catch (Exception e) {
                // uszkodzony plik – wracamy do wersji z resources
            }
        }
        try (InputStream in = new ClassPathResource("data/innovations.json").getInputStream()) {
            return mapper.readValue(in.readAllBytes(), new TypeReference<List<InnovationData>>() {});
        }
    }

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
