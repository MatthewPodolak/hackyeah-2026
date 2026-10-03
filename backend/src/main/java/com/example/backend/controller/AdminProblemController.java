package com.example.backend.controller;

import com.example.backend.dto.ProblemReviewRequest;
import com.example.backend.dto.ProblemTrackingResponse;
import com.example.backend.model.ProblemStatus;
import com.example.backend.service.ProblemService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/problems")
@RequiredArgsConstructor
public class AdminProblemController {

    private final ProblemService problemService;

    @GetMapping
    public List<ProblemTrackingResponse> list(@RequestParam(required = false) ProblemStatus status) {
        return problemService.adminList(status);
    }

    @GetMapping("/unseen-count")
    public Map<String, Long> unseen() {
        return Map.of("unseen", problemService.unseenCount());
    }

    @GetMapping("/{id}")
    public ProblemTrackingResponse one(@PathVariable Long id) {
        return problemService.adminView(id);
    }

    @PatchMapping("/{id}/review")
    public ProblemTrackingResponse review(@PathVariable Long id, @RequestBody ProblemReviewRequest request) {
        return problemService.review(id, request);
    }
}
