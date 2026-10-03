package com.example.backend.controller;

import com.example.backend.dto.ConversationDTOs.*;
import com.example.backend.service.CommunicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final CommunicationService communicationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Long startConversation(@Valid @RequestBody NewConversationRequest request, @AuthenticationPrincipal Jwt jwt) {
        return communicationService.createConversation(request, Long.valueOf(jwt.getSubject()));
    }

    @GetMapping
    public List<ConversationItem> listConversations(@AuthenticationPrincipal Jwt jwt) {
        return communicationService.getConversations(Long.valueOf(jwt.getSubject()));
    }

    @GetMapping("/{id}/messages")
    public List<MessageItem> getThread(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return communicationService.getThreadMessages(id, Long.valueOf(jwt.getSubject()));
    }

    @PostMapping("/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageItem reply(
            @PathVariable Long id,
            @Valid @RequestBody MessageRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return communicationService.addReply(id, request, Long.valueOf(jwt.getSubject()));
    }

    @PatchMapping("/{id}/status")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeStatus(
            @PathVariable Long id,
            @Valid @RequestBody ConversationStatusRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        communicationService.updateConversationStatus(id, Long.valueOf(jwt.getSubject()), request.status());
    }
}
