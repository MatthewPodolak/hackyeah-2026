package com.example.backend.controller;

import com.example.backend.config.RopsGuard;
import com.example.backend.dto.ProblemReviewRequest;
import com.example.backend.dto.ProblemTrackingResponse;
import com.example.backend.model.ProblemStatus;
import com.example.backend.service.ProblemService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/problems")
@RequiredArgsConstructor
public class AdminProblemController {

    private final ProblemService problemService;
    private final RopsGuard ropsGuard;

    @GetMapping
    public List<ProblemTrackingResponse> list(@RequestParam(required = false) ProblemStatus status, HttpServletRequest request) {
        ropsGuard.require(request);
        return problemService.adminList(status);
    }

    @GetMapping("/unseen-count")
    public Map<String, Long> unseen(HttpServletRequest request) {
        ropsGuard.require(request);
        return Map.of("unseen", problemService.unseenCount());
    }

    @GetMapping("/{id}")
    public ProblemTrackingResponse one(@PathVariable Long id, HttpServletRequest request) {
        ropsGuard.require(request);
        return problemService.adminView(id);
    }

    @PatchMapping("/{id}/review")
    public ProblemTrackingResponse review(@PathVariable Long id, @RequestBody ProblemReviewRequest body, HttpServletRequest request) {
        ropsGuard.require(request);
        return problemService.review(id, body);
    }
}
