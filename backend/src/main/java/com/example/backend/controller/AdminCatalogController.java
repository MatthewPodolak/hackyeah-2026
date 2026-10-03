package com.example.backend.controller;

import com.example.backend.config.CreatorReferenceData;
import com.example.backend.config.RopsGuard;
import com.example.backend.dto.KnowledgeResourceRequest;
import com.example.backend.model.InnovationData;
import com.example.backend.model.KnowledgeResource;
import com.example.backend.model.ResourceType;
import com.example.backend.repository.KnowledgeResourceRepository;
import com.example.backend.service.InnovationCatalog;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminCatalogController {

    private static final Pattern ID_PATTERN = Pattern.compile("[a-z0-9]+(-[a-z0-9]+)*");
    private static final Set<String> LINK_KEYS = Set.of("video", "details", "leaflet", "materials", "usageRules");

    private final InnovationCatalog catalog;
    private final KnowledgeResourceRepository resources;
    private final CreatorReferenceData ref;
    private final RopsGuard ropsGuard;

    @PostMapping("/catalog/innovations")
    @ResponseStatus(HttpStatus.CREATED)
    public InnovationData create(@RequestBody InnovationData body, HttpServletRequest request) {
        ropsGuard.require(request);
        String id = body.id() == null || body.id().isBlank() ? slug(body.name()) : body.id().trim();
        if (catalog.exists(id)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Innowacja o tym identyfikatorze już istnieje");
        return catalog.save(clean(id, body));
    }

    @PutMapping("/catalog/innovations/{id}")
    public InnovationData update(@PathVariable String id, @RequestBody InnovationData body, HttpServletRequest request) {
        ropsGuard.require(request);
        if (!catalog.exists(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return catalog.save(clean(id, body));
    }

    @DeleteMapping("/catalog/innovations/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id, HttpServletRequest request) {
        ropsGuard.require(request);
        if (!catalog.delete(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }

    @PostMapping("/knowledge/resources")
    @ResponseStatus(HttpStatus.CREATED)
    public KnowledgeResource createResource(@RequestBody KnowledgeResourceRequest body, HttpServletRequest request) {
        ropsGuard.require(request);
        KnowledgeResource resource = new KnowledgeResource();
        apply(resource, body);
        return resources.save(resource);
    }

    @PutMapping("/knowledge/resources/{id}")
    public KnowledgeResource updateResource(@PathVariable Long id, @RequestBody KnowledgeResourceRequest body, HttpServletRequest request) {
        ropsGuard.require(request);
        KnowledgeResource resource = resources.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        apply(resource, body);
        return resources.save(resource);
    }

    @DeleteMapping("/knowledge/resources/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteResource(@PathVariable Long id, HttpServletRequest request) {
        ropsGuard.require(request);
        if (!resources.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        resources.deleteById(id);
    }

    private InnovationData clean(String id, InnovationData b) {
        if (!ID_PATTERN.matcher(id).matches() || id.length() > 100) throw bad("Identyfikator może zawierać tylko małe litery, cyfry i myślniki");
        if (b.name() == null || b.name().isBlank()) throw bad("Podaj nazwę innowacji");
        Map<String, String> links = new LinkedHashMap<>();
        if (b.links() != null) {
            b.links().forEach((k, v) -> {
                if (LINK_KEYS.contains(k) && v != null && !v.isBlank()) links.put(k, safeUrl(v.trim()));
            });
        }
        return new InnovationData(id, clip(b.name().trim(), 200), text(b.shortDescription(), 500), text(b.description(), 6000),
                text(b.problem(), 4000), list(b.targetGroups()), list(b.challengeAreas()), list(b.problemTags()),
                text(b.targetGroupDescription(), 3000), text(b.whoCanImplement(), 3000), text(b.effectiveness(), 4000),
                text(b.disseminationProgram(), 200), links,
                known(b.whoCategories(), ref.forms().whoCategories().keySet()),
                known(b.problemCategories(), ref.forms().problemCategories().keySet()),
                known(b.disabilityTypes(), ref.forms().disabilityTypes().keySet()),
                b.thumbnailUrl() == null || b.thumbnailUrl().isBlank() ? null : safeUrl(b.thumbnailUrl().trim()));
    }

    private static void apply(KnowledgeResource r, KnowledgeResourceRequest b) {
        if (b.title() == null || b.title().isBlank()) throw bad("Podaj tytuł materiału");
        if (b.url() == null || b.url().isBlank()) throw bad("Podaj adres materiału");
        r.setTitle(clip(b.title().trim(), 200));
        r.setDescription(text(b.description(), 2000));
        r.setType(b.type() == null ? ResourceType.OTHER : b.type());
        r.setUrl(safeUrl(b.url().trim()));
        r.setChallengeArea(text(b.challengeArea(), 100));
    }

    private static String safeUrl(String url) {
        String lower = url.toLowerCase();
        if (!lower.startsWith("https://") && !lower.startsWith("http://")) throw bad("Adres musi zaczynać się od http:// lub https://");
        return clip(url, 1000);
    }

    private static List<String> known(List<String> values, Set<String> allowed) {
        return values == null ? List.of() : values.stream().filter(allowed::contains).distinct().toList();
    }

    private static List<String> list(List<String> values) {
        return values == null ? List.of() : values.stream().filter(v -> v != null && !v.isBlank()).map(v -> clip(v.trim(), 100)).distinct().toList();
    }

    private static String text(String s, int max) {
        return s == null || s.isBlank() ? null : clip(s.trim(), max);
    }

    private static String clip(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max);
    }

    private static String slug(String name) {
        if (name == null) throw bad("Podaj nazwę innowacji");
        String ascii = Normalizer.normalize(name.toLowerCase().replace("ł", "l"), Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        String s = ascii.replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        if (s.isEmpty()) throw bad("Nie udało się utworzyć identyfikatora z nazwy");
        return s.length() > 80 ? s.substring(0, 80).replaceAll("-$", "") : s;
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
