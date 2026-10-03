package com.example.backend.controller;

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

    @GetMapping("/{id}")
    public ProblemResponse getProblem(@PathVariable Long id) {
        return problemService.getProblem(id);
    }
}
