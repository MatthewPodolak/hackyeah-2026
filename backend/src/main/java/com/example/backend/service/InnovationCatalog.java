package com.example.backend.service;

import com.example.backend.model.InnovationData;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;


import java.io.IOException;
import java.io.InputStream;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class InnovationCatalog {

    private final Map<String, InnovationData> byId = new LinkedHashMap<>();
    private String promptCatalog;

    @PostConstruct
    void load() throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        try (InputStream in = new ClassPathResource("data/innovations.json").getInputStream()) {
            List<InnovationData> list = mapper.readValue(in, new TypeReference<List<InnovationData>>() {});
            list.forEach(i -> byId.put(i.id(), i));
        }
        promptCatalog = byId.values().stream()
                .map(i -> "%s | %s | %s | problem: %s | tagi: %s | obszary: %s".formatted(
                        i.id(), i.name(), i.shortDescription(),
                        truncate(i.problem(), 300),
                        String.join(",", i.problemTags()),
                        String.join(",", i.challengeAreas())))
                .collect(Collectors.joining("\n"));
    }

    public Optional<InnovationData> find(String id) { return Optional.ofNullable(byId.get(id)); }
    public String asPromptCatalog() { return promptCatalog; }

    private static String truncate(String s, int max) {
        if (s == null) return "";
        s = s.replace("\n", " ");
        return s.length() <= max ? s : s.substring(0, max) + "…";
    }
}