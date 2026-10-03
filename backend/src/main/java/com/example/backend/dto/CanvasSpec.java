package com.example.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CanvasSpec(String source, String sourceUrl, String attribution, String notes, List<Step> steps) {
    public record Step(String id, String title, String canvasPage, List<Section> sections) {}

    public record Section(String id, String title, String question, String icon, String type,
                          Integer maxSelected, Boolean allowOther, String withText,
                          List<Object> options, List<String> hints,
                          List<Map<String, Object>> roles, List<Map<String, Object>> statuses,
                          List<Map<String, Object>> dimensions, List<Map<String, Object>> levels) {
        /** Dozwolone wartości: opcje-obiekty ({value,...}) albo zwykłe teksty. */
        public Set<String> allowedValues() {
            Set<String> s = new LinkedHashSet<>();
            if (options != null) for (Object o : options)
                s.add(o instanceof Map<?, ?> m ? String.valueOf(m.get("value")) : String.valueOf(o));
            return s;
        }
        public static Set<String> values(List<Map<String, Object>> l) {
            Set<String> s = new LinkedHashSet<>();
            if (l != null) l.forEach(m -> s.add(String.valueOf(m.get("value"))));
            return s;
        }
    }
}