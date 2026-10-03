package com.example.backend.controller;

import com.example.backend.dto.ChallengeArea;
import com.example.backend.model.InnovationData;
import com.example.backend.model.KnowledgeResource;
import com.example.backend.model.ResourceType;
import com.example.backend.repository.KnowledgeResourceRepository;
import com.example.backend.service.InnovationCatalog;
import com.example.backend.service.ReferenceDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/knowledge")
@RequiredArgsConstructor
public class KnowledgeController {
    private final InnovationCatalog catalog;
    private final ReferenceDataService reference;
    private final KnowledgeResourceRepository resources;

    @GetMapping("/challenge-areas") public List<ChallengeArea> areas() { return reference.areas(); }
    @GetMapping("/problem-tags")    public Map<String, String> tags() { return reference.tags(); }
    @GetMapping("/target-groups")   public Map<String, String> groups() { return reference.targetGroups(); }

    @GetMapping("/innovations")
    public List<InnovationData> innovations(@RequestParam(required = false) String targetGroup,
                                            @RequestParam(required = false) String challengeArea,
                                            @RequestParam(required = false) String tag,
                                            @RequestParam(required = false) String q) {
        String needle = q == null ? null : q.toLowerCase();
        return catalog.all().stream()
                .filter(i -> targetGroup == null || i.targetGroups().contains(targetGroup))
                .filter(i -> challengeArea == null || i.challengeAreas().contains(challengeArea))
                .filter(i -> tag == null || i.problemTags().contains(tag))
                .filter(i -> needle == null
                        || (i.name() + " " + i.shortDescription() + " " + i.description())
                        .toLowerCase().contains(needle))
                .toList();
    }

    @GetMapping("/innovations/{id}")
    public InnovationData innovation(@PathVariable String id) {
        return catalog.find(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @GetMapping("/resources")
    public List<KnowledgeResource> resources(@RequestParam(required = false) ResourceType type,
                                             @RequestParam(required = false) String challengeArea) {
        return resources.findAll().stream()
                .filter(r -> type == null || r.getType() == type)
                .filter(r -> challengeArea == null || challengeArea.equals(r.getChallengeArea()))
                .toList();
    }
}
