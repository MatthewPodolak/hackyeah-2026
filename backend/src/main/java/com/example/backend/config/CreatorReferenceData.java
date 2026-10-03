package com.example.backend.config;

import com.example.backend.dto.CanvasSpec;
import com.example.backend.dto.FormCategories;
import com.example.backend.dto.RegionsData;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class CreatorReferenceData {
    private final CanvasSpec canvas;
    private final FormCategories forms;
    private final RegionsData regions;
    private final Set<String> gminaIds;

    public CreatorReferenceData(ObjectMapper mapper) throws IOException {
        canvas = read(mapper, "data/canvas.json", CanvasSpec.class);
        forms = read(mapper, "data/form-categories.json", FormCategories.class);
        regions = read(mapper, "data/malopolska-units.json", RegionsData.class);
        gminaIds = regions.powiaty().stream().flatMap(p -> p.gminy().stream())
                .map(RegionsData.Gmina::id).collect(Collectors.toSet());
    }
    private static <T> T read(ObjectMapper m, String path, Class<T> type) throws IOException {
        try (InputStream in = new ClassPathResource(path).getInputStream()) { return m.readValue(in, type); }
    }

    public CanvasSpec canvas() { return canvas; }
    public FormCategories forms() { return forms; }
    public RegionsData regions() { return regions; }
    public boolean gminaExists(String id) { return gminaIds.contains(id); }
    public Set<String> whoKeys() { return forms.whoCategories().keySet(); }
    public Set<String> disabilityKeys() { return forms.disabilityTypes().keySet(); }

    public String whoLabels(List<String> keys) {
        return keys.stream().map(k -> forms.whoCategories().containsKey(k)
                ? forms.whoCategories().get(k).label() : k).collect(Collectors.joining(", "));
    }

    /** Opis sekcji canvasu dla promptu AI (jeden krok albo całość). */
    public String promptFor(String stepId) {
        StringBuilder sb = new StringBuilder();
        for (CanvasSpec.Step st : canvas.steps()) {
            if (stepId != null && !st.id().equals(stepId)) continue;
            sb.append("\n## KROK: ").append(st.title()).append("\n");
            for (CanvasSpec.Section s : st.sections()) {
                sb.append("- ").append(s.id()).append(" [").append(s.type()).append("]: ")
                        .append(s.question() != null ? s.question() : s.title());
                if (s.maxSelected() != null) sb.append(" (maks. ").append(s.maxSelected()).append(")");
                if (s.withText() != null) sb.append(" (format {\"value\":...,\"text\":\"")
                        .append(s.withText()).append("\"})");
                if (s.options() != null) sb.append(" | dozwolone: ").append(optionsLine(s));
                if (s.roles() != null) sb.append(" | roles: ").append(CanvasSpec.Section.values(s.roles()))
                        .append(" | statuses: ").append(CanvasSpec.Section.values(s.statuses()));
                if (s.dimensions() != null) sb.append(" | dimensions: ").append(CanvasSpec.Section.values(s.dimensions()))
                        .append(" | levels: ").append(CanvasSpec.Section.values(s.levels()));
                sb.append("\n");
            }
        }
        return sb.toString();
    }
    private static String optionsLine(CanvasSpec.Section s) {
        return s.options().stream().map(o -> o instanceof Map<?, ?> m
                ? m.get("value") + "=" + m.get("label") : String.valueOf(o)).collect(Collectors.joining("; "));
    }
}
