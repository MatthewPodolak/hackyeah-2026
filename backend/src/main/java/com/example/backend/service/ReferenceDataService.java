package com.example.backend.service;

import com.example.backend.dto.ChallengeArea;
import tools.jackson.core.type.TypeReference;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

@Service
public class ReferenceDataService {
    private final List<ChallengeArea> areas;
    private final Map<String, String> tags;
    private final Map<String, String> targetGroups;

    public ReferenceDataService(ObjectMapper mapper) throws IOException {
        areas = read(mapper, "data/challenge-areas.json", new TypeReference<List<ChallengeArea>>() {});
        tags = read(mapper, "data/problem-tags.json", new TypeReference<Map<String, String>>() {});
        targetGroups = read(mapper, "data/target-groups.json", new TypeReference<Map<String, String>>() {});
    }

    private static <T> T read(ObjectMapper m, String path, TypeReference<T> type) throws IOException {
        try (InputStream in = new ClassPathResource(path).getInputStream()) { return m.readValue(in, type); }
    }

    public List<ChallengeArea> areas() { return areas; }
    public Map<String, String> tags() { return tags; }
    public Map<String, String> targetGroups() { return targetGroups; }
}
