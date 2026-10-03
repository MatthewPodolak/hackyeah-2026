package com.example.backend.config;

import com.example.backend.dto.CanvasSpec;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
public class CanvasValidator {
    private final CreatorReferenceData ref;

    public Map<String, Object> sanitize(Map<String, Object> raw, String onlyStepId) {
        Map<String, Object> out = new LinkedHashMap<>();
        if (raw == null) return out;
        for (CanvasSpec.Step step : ref.canvas().steps()) {
            if (onlyStepId != null && !step.id().equals(onlyStepId)) continue;
            for (CanvasSpec.Section s : step.sections()) {
                Object v = raw.get(s.id());
                if (v == null) continue;
                Object clean = switch (s.type()) {
                    case "single" -> single(s, v);
                    case "multi" -> multi(s, v);
                    case "textList" -> textList(v);
                    case "partnerList" -> partners(s, v);
                    case "impactMatrix" -> impact(s, v);
                    default -> null;
                };
                if (clean != null) out.put(s.id(), clean);   // nieznane sekcje i błędne wartości odpadają
            }
        }
        return out;
    }

    private Object single(CanvasSpec.Section s, Object v) {
        String value;
        String text = null;
        if (v instanceof Map<?, ?> m) {
            value = str(m.get("value"));
            text = clip(str(m.get("text")), 500);
        } else value = str(v);
        if (value == null || !s.allowedValues().contains(value)) return null;
        if (s.withText() == null) return value;
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("value", value);
        r.put("text", text == null ? "" : text);
        return r;
    }

    private Object multi(CanvasSpec.Section s, Object v) {
        if (!(v instanceof List<?> list)) return null;
        List<String> out = new ArrayList<>();
        for (Object o : list) {
            String x = clip(str(o), 100);
            if (x == null || x.isBlank() || out.contains(x)) continue;
            if (s.allowedValues().contains(x) || Boolean.TRUE.equals(s.allowOther())) out.add(x);
        }
        if (s.maxSelected() != null && out.size() > s.maxSelected())
            out = new ArrayList<>(out.subList(0, s.maxSelected()));
        return out;
    }

    private Object textList(Object v) {
        if (!(v instanceof List<?> list)) return null;
        return list.stream().map(o -> clip(str(o), 200)).filter(x -> x != null && !x.isBlank()).limit(20).toList();
    }

    private Object partners(CanvasSpec.Section s, Object v) {
        if (!(v instanceof List<?> list)) return null;
        Set<String> roles = CanvasSpec.Section.values(s.roles());
        Set<String> statuses = CanvasSpec.Section.values(s.statuses());
        List<Map<String, Object>> out = new ArrayList<>();
        for (Object o : list) {
            if (!(o instanceof Map<?, ?> m) || out.size() >= 20) continue;
            String name = clip(str(m.get("name")), 100);
            if (name == null || name.isBlank()) continue;
            List<String> rs = m.get("roles") instanceof List<?> rl
                    ? rl.stream().map(CanvasValidator::str).filter(roles::contains).distinct().toList() : List.of();
            String status = str(m.get("status"));
            Map<String, Object> p = new LinkedHashMap<>();
            p.put("name", name);
            p.put("roles", rs);
            p.put("status", statuses.contains(status) ? status : "POTENTIAL");
            p.put("note", clip(str(m.get("note")), 300));
            out.add(p);
        }
        return out;
    }

    private Object impact(CanvasSpec.Section s, Object v) {
        if (!(v instanceof Map<?, ?> m)) return null;
        Set<String> dims = CanvasSpec.Section.values(s.dimensions());
        Set<String> levels = CanvasSpec.Section.values(s.levels());
        Map<String, Object> out = new LinkedHashMap<>();
        m.forEach((k, val) -> {
            if (dims.contains(str(k)) && levels.contains(str(val))) out.put(str(k), str(val));
        });
        return out;
    }

    static String str(Object o) {
        return o == null ? null : o.toString().trim();
    }

    static String clip(String s, int max) {
        return s == null ? null : (s.length() <= max ? s : s.substring(0, max));
    }
}
