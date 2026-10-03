package com.example.backend.controller;

import com.example.backend.dto.ConversationDTOs.PartnershipPostResponse;
import com.example.backend.dto.ConversationDTOs.PartnershipRequest;
import com.example.backend.service.CommunicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/partnerships")
@RequiredArgsConstructor
public class PartnershipController {

    private final CommunicationService communicationService;

    @GetMapping
    public List<PartnershipPostResponse> listActivePosts() {
        return communicationService.getActivePartnershipPosts();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void createPost(@Valid @RequestBody PartnershipRequest request, @AuthenticationPrincipal Jwt jwt) {
        communicationService.createPartnershipPost(request, Long.valueOf(jwt.getSubject()));
    }
}