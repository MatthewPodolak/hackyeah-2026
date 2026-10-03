package com.example.backend.controller;

import com.example.backend.dto.ConversationDTOs.*;
import com.example.backend.service.CommunicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final CommunicationService communicationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Long startConversation(@Valid @RequestBody NewConversationRequest request) {
        return communicationService.createConversation(request);
    }

    @GetMapping
    public List<ConversationItem> listConversations(@RequestParam Long userId) {
        return communicationService.getConversations(userId);
    }

    @GetMapping("/{id}/messages")
    public List<MessageItem> getThread(
            @PathVariable Long id,
            @RequestParam Long userId) {
        return communicationService.getThreadMessages(id, userId);
    }

    @PostMapping("/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageItem reply(
            @PathVariable Long id,
            @Valid @RequestBody MessageRequest request) {
        return communicationService.addReply(id, request);
    }

    @PatchMapping("/{id}/status")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeStatus(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody ConversationStatusRequest request) {
        communicationService.updateConversationStatus(id, userId, request.status());
    }
}