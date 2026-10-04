package com.example.backend.controller;

import com.example.backend.dto.IdeaDetailsResponse;
import com.example.backend.service.IdeaCreatorService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/me/ideas")
@RequiredArgsConstructor
public class MyIdeaController {

    private final IdeaCreatorService ideaService;

    @GetMapping
    public List<IdeaDetailsResponse> mine(@AuthenticationPrincipal Jwt jwt) {
        return ideaService.getMine(Long.valueOf(jwt.getSubject()));
    }
}
