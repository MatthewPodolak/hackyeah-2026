package com.example.backend.controller;

import com.example.backend.dto.ParticipationResponse;
import com.example.backend.service.InnovationTestingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/me/test-participations")
@RequiredArgsConstructor
public class MyTestParticipationController {

    private final InnovationTestingService testingService;

    @GetMapping
    public List<ParticipationResponse> mine(@AuthenticationPrincipal Jwt jwt) {
        return testingService.getUserParticipations(Long.valueOf(jwt.getSubject()));
    }
}
