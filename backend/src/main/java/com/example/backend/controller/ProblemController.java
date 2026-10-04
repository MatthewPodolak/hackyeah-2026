package com.example.backend.controller;

import com.example.backend.dto.GminaDecisionRequest;
import com.example.backend.dto.ProblemRequest;
import com.example.backend.dto.ProblemTrackingResponse;
import com.example.backend.dto.ProblemResponse;
import com.example.backend.dto.ProblemWithMatchesResponse;
import com.example.backend.service.ProblemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import com.example.backend.dto.ProblemSummaryResponse;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/problems")
@RequiredArgsConstructor
public class ProblemController {

    private final ProblemService problemService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProblemWithMatchesResponse createProblem(@RequestBody ProblemRequest request, @AuthenticationPrincipal Jwt jwt) {
        return problemService.reportProblem(request, jwt == null ? null : Long.valueOf(jwt.getSubject()));
    }

    @GetMapping("/by-token/{token}")
    public ProblemTrackingResponse getByToken(@PathVariable String token) {
        return problemService.getByToken(token);
    }

    @GetMapping("/get-problems")
    public List<ProblemSummaryResponse> getProblems() {
        return problemService.getProblems();
    }

    @GetMapping("/reported")
    public List<ProblemTrackingResponse> getReportedProblems(@AuthenticationPrincipal Jwt jwt) {
        return problemService.getReportedProblems(Long.valueOf(jwt.getSubject()));
    }

    @GetMapping("/reported/waiting-count")
    public Map<String, Long> getWaitingForGminaCount(@AuthenticationPrincipal Jwt jwt) {
        return Map.of("waiting", problemService.getWaitingForGminaCount(Long.valueOf(jwt.getSubject())));
    }

    @PostMapping("/reported/{id}/decision")
    public ProblemTrackingResponse decideAsGmina(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @RequestBody GminaDecisionRequest request) {
        return problemService.decideAsGmina(Long.valueOf(jwt.getSubject()), id, request);
    }

    @GetMapping("/{id}")
    public ProblemResponse getProblem(@PathVariable Long id) {
        return problemService.getProblem(id);
    }
}
