package com.example.backend.controller;

import com.example.backend.dto.ProblemTrackingResponse;
import com.example.backend.service.ProblemService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/me/problems")
@RequiredArgsConstructor
public class MyProblemController {

    private final ProblemService problemService;

    @GetMapping
    public List<ProblemTrackingResponse> mine(@AuthenticationPrincipal Jwt jwt) {
        return problemService.getMine(Long.valueOf(jwt.getSubject()));
    }
}
