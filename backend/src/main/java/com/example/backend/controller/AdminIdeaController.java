package com.example.backend.controller;

import com.example.backend.dto.IdeaDetailsResponse;
import com.example.backend.dto.IdeaResponse;
import com.example.backend.dto.IdeaReviewRequest;
import com.example.backend.mapper.IdeaStatus;
import com.example.backend.model.Readiness;
import com.example.backend.repository.IdeaRepository;
import com.example.backend.service.IdeaCreatorService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/ideas")
@RequiredArgsConstructor
public class AdminIdeaController {
    private final IdeaRepository ideas;
    private final IdeaCreatorService service;

    @GetMapping
    public List<IdeaResponse> list(@RequestParam(required = false) IdeaStatus status,
                                   @RequestParam(required = false) Readiness readiness,
                                   @RequestParam(required = false) String who) {
        return ideas.findAllByOrderByCreatedAtDesc().stream()
                .filter(i -> status == null || i.getStatus() == status)
                .filter(i -> readiness == null || i.getReadiness() == readiness)
                .filter(i -> who == null || i.getWhoCategories().contains(who))
                .map(i -> service.toResponse(i, false)).toList();
    }

    @GetMapping("/unseen-count")                              // licznik/dzwonek „nowy pomysł” w panelu
    public Map<String, Long> unseen() { return Map.of("unseen", ideas.countByAdminSeenFalse()); }

    @GetMapping("/{id}")
    public IdeaDetailsResponse one(@PathVariable Long id) { return service.adminView(id); }

    @PatchMapping("/{id}/review")                             // zmiana statusu + odpowiedź do autora
    public IdeaResponse review(@PathVariable Long id, @RequestBody IdeaReviewRequest r) { return service.review(id, r); }
}
